const Razorpay = require('razorpay');

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== API CALLED ===');
    console.log('Request body:', req.body);

    const { amount, name, email, phone, frequency } = req.body;

    // Validate required fields
    if (!amount || !name) {
      return res.status(400).json({ error: 'Amount and name are required' });
    }

    if (frequency === 'Monthly' && !email) {
      return res.status(400).json({ error: 'Email is required for monthly donations' });
    }

    // Check environment variables
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
      console.error('Missing Razorpay credentials');
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY
    });

    console.log('Processing frequency:', frequency);

    if (frequency === 'Monthly') {
      console.log('=== PROCESSING MONTHLY SUBSCRIPTION ===');
      
      try {
        // Use the Supabase approach for creating subscriptions
        const subscriptionResult = await createRazorpaySubscription(
          razorpay, 
          parseFloat(amount), 
          name, 
          email, 
          phone
        );

        return res.status(200).json({
          type: 'subscription',
          subscription_id: subscriptionResult.id,
          customer_id: subscriptionResult.customer_id,
          plan_id: subscriptionResult.plan_id,
          amount: parseInt(amount) * 100,
          currency: 'INR',
          short_url: subscriptionResult.short_url,
          status: subscriptionResult.status,
          message: 'Monthly subscription created successfully'
        });

      } catch (subscriptionError) {
        console.error('=== SUBSCRIPTION CREATION FAILED ===');
        console.error('Error details:', subscriptionError);
        console.log('FALLING BACK TO ONE-TIME ORDER WITH MONTHLY TAGS');

        // Fallback: Create one-time order with monthly recurring flags
        const fallbackOptions = {
          amount: Math.round(parseFloat(amount) * 100),
          currency: 'INR',
          receipt: `monthly_donation_${Date.now()}`,
          payment_capture: 1,
          notes: {
            donation_type: 'monthly_recurring',
            donor_name: name,
            donor_email: email,
            donor_phone: phone || '',
            frequency: 'Monthly',
            recurring_setup_needed: 'true',
            fallback_reason: 'subscription_creation_failed',
            original_error: subscriptionError.message
          }
        };

        const fallbackOrder = await razorpay.orders.create(fallbackOptions);
        console.log('Fallback order created:', fallbackOrder.id);

        return res.status(200).json({
          type: 'order_with_recurring_intent',
          id: fallbackOrder.id,
          amount: fallbackOrder.amount,
          currency: fallbackOrder.currency,
          is_fallback: true,
          message: 'Processing as one-time payment with monthly setup intent'
        });
      }

    } else {
      console.log('=== PROCESSING ONE-TIME DONATION ===');
      
      // Handle one-time payment
      const options = {
        amount: Math.round(parseFloat(amount) * 100),
        currency: 'INR',
        receipt: `donation_${Date.now()}`,
        payment_capture: 1,
        notes: {
          donation_type: 'one_time',
          donor_name: name,
          donor_email: email || '',
          donor_phone: phone || '',
          frequency: 'One-time'
        }
      };

      const order = await razorpay.orders.create(options);
      console.log('One-time order created:', order.id);

      return res.status(200).json({
        type: 'order',
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        message: 'One-time donation order created'
      });
    }

  } catch (error) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);

    res.status(500).json({ 
      error: 'Payment processing failed',
      message: 'Unable to process your donation at this time. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}

// Function to get or create a Razorpay plan (adapted from Supabase)
async function getOrCreateRazorpayPlan(razorpay, amount, description) {
  // First, check if plan with this amount already exists
  try {
    const plans = await razorpay.plans.all({ count: 100 });
    
    // Check if a matching plan exists
    if (plans && plans.items && plans.items.length > 0) {
      for (const plan of plans.items) {
        // Check if amount matches
        if (plan.item && plan.item.amount === amount * 100) {
          console.log(`Found existing Razorpay plan: ${plan.id}`);
          return plan.id;
        }
      }
    }
  } catch (error) {
    console.log('Error fetching plans, will create new one:', error.message);
  }

  // If no matching plan found, create a new one
  const planData = {
    period: 'monthly',
    interval: 1,
    item: {
      name: description || `Monthly donation of INR ${amount}`,
      amount: amount * 100,
      currency: 'INR',
      description: description || `Monthly donation of INR ${amount}`
    },
    notes: {
      created_by: 'donation_system',
      creation_timestamp: new Date().toISOString()
    }
  };

  try {
    const newPlan = await razorpay.plans.create(planData);
    console.log(`Created new Razorpay plan: ${newPlan.id}`);
    return newPlan.id;
  } catch (error) {
    console.error('Razorpay plan creation error:', error);
    throw new Error(`Plan creation failed: ${error.message}`);
  }
}

// Function to find or create a Razorpay customer (adapted from Supabase)
async function getOrCreateRazorpayCustomer(razorpay, name, email, phone) {
  // If email is missing, create a new customer
  if (!email) {
    return createNewRazorpayCustomer(razorpay, name, email, phone);
  }

  // First, check if customer already exists by email
  try {
    const customers = await razorpay.customers.all({ 
      count: 10,
      skip: 0 
    });

    // Check if a matching customer exists
    if (customers && customers.items && customers.items.length > 0) {
      for (const customer of customers.items) {
        if (customer.email && customer.email.toLowerCase() === email.toLowerCase()) {
          console.log(`Found existing Razorpay customer by email: ${customer.id}`);
          return customer.id;
        }
      }
    }
  } catch (error) {
    console.log('Error fetching customers, will create new one:', error.message);
  }

  // If no matching customer found, create a new one
  return createNewRazorpayCustomer(razorpay, name, email, phone);
}

// Helper to create a new Razorpay customer
async function createNewRazorpayCustomer(razorpay, name, email, phone) {
  const customerData = {
    name: name || 'Donor',
    email: email || '',
    contact: phone || '',
    fail_existing: 0,
    notes: {
      source: 'Donation Website',
      creation_date: new Date().toISOString()
    }
  };

  try {
    const newCustomer = await razorpay.customers.create(customerData);
    console.log(`Created new Razorpay customer: ${newCustomer.id}`);
    return newCustomer.id;
  } catch (error) {
    console.error('Razorpay customer creation error:', error);
    throw new Error(`Customer creation failed: ${error.message}`);
  }
}

// Function to create a Razorpay subscription (adapted from Supabase)
async function createRazorpaySubscription(razorpay, amount, name = '', email = '', phone = '') {
  try {
    // Step 1: Get or create a plan
    const planId = await getOrCreateRazorpayPlan(razorpay, amount, `Monthly donation of INR ${amount}`);
    
    // Step 2: Get or create a customer
    let customerId = '';
    if (email || phone) {
      customerId = await getOrCreateRazorpayCustomer(razorpay, name, email, phone);
    }

    // Step 3: Create subscription
    const subscriptionData = {
      plan_id: planId,
      total_count: 360, // 30 years like in Supabase
      quantity: 1,
      customer_notify: 1,
      start_at: Math.floor(Date.now() / 1000) + 300, // Start in 5 minutes
      notes: {
        donation_amount: amount,
        created_by: 'donation_system',
        source: 'Donation Website'
      }
    };

    // Add customer_id if available
    if (customerId) {
      subscriptionData.customer_id = customerId;
      subscriptionData.notes.customer_name = name;
      subscriptionData.notes.customer_email = email;
    }

    // Create subscription
    console.log('Creating Razorpay subscription with data:', JSON.stringify(subscriptionData));
    const subscriptionResult = await razorpay.subscriptions.create(subscriptionData);

    // If no short_url, try to create payment link as fallback (like Supabase does)
    if (!subscriptionResult.short_url) {
      console.log('No short_url found, creating payment link as fallback...');
      try {
        const paymentLinkData = {
          amount: amount * 100,
          currency: 'INR',
          accept_partial: false,
          description: `Monthly donation of INR ${amount}`,
          customer: {
            name: name || 'Donor',
            email: email || '',
            contact: phone || ''
          },
          notes: {
            subscription_id: subscriptionResult.id,
            plan_id: planId,
            donation_type: 'recurring',
            source: 'Donation Website'
          },
          callback_url: 'donation-form-j142-git-stripe-tharunn-ks-projects.vercel.app',
          callback_method: 'get'
        };

        const paymentLink = await razorpay.paymentLink.create(paymentLinkData);
        if (paymentLink.short_url) {
          console.log('Created payment link as fallback:', paymentLink.short_url);
          subscriptionResult.short_url = paymentLink.short_url;
        }
      } catch (linkError) {
        console.error('Failed to create payment link fallback:', linkError);
      }
    }

    return subscriptionResult;
  } catch (error) {
    console.error('Error in createRazorpaySubscription:', error);
    throw error;
  }
}