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

    const { amount, name, email, phone, frequency, isSubscriptionSetup } = req.body;

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
      console.log('=== PROCESSING MONTHLY DONATION AS FIRST PAYMENT ===');
      
      // For monthly donations, create a one-time order first
      // After payment confirmation, we can set up the subscription
      const options = {
        amount: Math.round(parseFloat(amount) * 100),
        currency: 'INR',
        receipt: `monthly_first_payment_${Date.now()}`,
        payment_capture: 1,
        notes: {
          donation_type: 'monthly_subscription_first_payment',
          donor_name: name,
          donor_email: email,
          donor_phone: phone || '',
          frequency: 'Monthly',
          subscription_amount: amount,
          needs_subscription_setup: 'true'
        }
      };

      const order = await razorpay.orders.create(options);
      console.log('Monthly first payment order created:', order.id);

      return res.status(200).json({
        type: 'order',
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        isMonthlyFirstPayment: true,
        message: 'First payment for monthly subscription'
      });

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

// Optional: Create a separate endpoint to set up subscription after successful payment
// This could be called after payment confirmation
async function createSubscriptionAfterPayment(razorpay, amount, name, email, phone) {
  try {
    // Step 1: Get or create a plan
    const planId = await getOrCreateRazorpayPlan(razorpay, amount, `Monthly donation of INR ${amount}`);
    
    // Step 2: Get or create a customer
    let customerId = '';
    if (email || phone) {
      customerId = await getOrCreateRazorpayCustomer(razorpay, name, email, phone);
    }

    // Step 3: Create subscription (starting from next month since first payment is already done)
    const subscriptionData = {
      plan_id: planId,
      total_count: 359, // 359 more payments (first payment already done)
      quantity: 1,
      customer_notify: 1,
      start_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // Start next month
      notes: {
        donation_amount: amount,
        created_by: 'donation_system',
        source: 'Donation Website',
        first_payment_completed: 'true'
      }
    };

    // Add customer_id if available
    if (customerId) {
      subscriptionData.customer_id = customerId;
      subscriptionData.notes.customer_name = name;
      subscriptionData.notes.customer_email = email;
    }

    const subscriptionResult = await razorpay.subscriptions.create(subscriptionData);
    console.log('Subscription created after first payment:', subscriptionResult.id);
    
    return subscriptionResult;
  } catch (error) {
    console.error('Error in createSubscriptionAfterPayment:', error);
    throw error;
  }
}

// Function to get or create a Razorpay plan
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

// Function to find or create a Razorpay customer
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