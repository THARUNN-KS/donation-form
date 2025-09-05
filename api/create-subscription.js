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
    console.log('=== CREATE SUBSCRIPTION AFTER PAYMENT ===');
    console.log('Request body:', req.body);

    const { amount, name, email, phone, paymentId, orderId } = req.body;

    // Validate required fields
    if (!amount || !name || !email || !paymentId) {
      return res.status(400).json({ error: 'Amount, name, email, and paymentId are required' });
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

    // Create subscription after successful payment
    const subscriptionResult = await createRazorpaySubscription(
      razorpay, 
      parseFloat(amount), 
      name, 
      email, 
      phone,
      paymentId,
      orderId
    );

    return res.status(200).json({
      success: true,
      subscription_id: subscriptionResult.id,
      customer_id: subscriptionResult.customer_id,
      plan_id: subscriptionResult.plan_id,
      status: subscriptionResult.status,
      message: 'Monthly subscription created successfully after payment'
    });

  } catch (error) {
    console.error('=== SUBSCRIPTION CREATION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    res.status(500).json({ 
      error: 'Failed to create subscription after payment',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}

// Function to create a Razorpay subscription after successful payment
async function createRazorpaySubscription(razorpay, amount, name = '', email = '', phone = '', paymentId = '', orderId = '') {
  try {
    // Step 1: Get or create a plan
    const planId = await getOrCreateRazorpayPlan(razorpay, amount, `Monthly donation of INR ${amount}`);
    
    // Step 2: Get or create a customer
    let customerId = '';
    if (email || phone) {
      customerId = await getOrCreateRazorpayCustomer(razorpay, name, email, phone);
    }

    // Step 3: Create subscription (starting from next month since first payment is already completed)
    const subscriptionData = {
      plan_id: planId,
      total_count: 359, // 359 more payments since first payment is already done
      quantity: 1,
      customer_notify: 1,
      start_at: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // Start next month
      notes: {
        donation_amount: amount,
        created_by: 'donation_system',
        source: 'Donation Website',
        first_payment_id: paymentId,
        first_order_id: orderId,
        first_payment_completed: 'true',
        created_after_payment: 'true'
      }
    };

    // Add customer_id if available
    if (customerId) {
      subscriptionData.customer_id = customerId;
      subscriptionData.notes.customer_name = name;
      subscriptionData.notes.customer_email = email;
    }

    // Create subscription
    console.log('Creating Razorpay subscription after payment with data:', JSON.stringify(subscriptionData));
    const subscriptionResult = await razorpay.subscriptions.create(subscriptionData);
    
    console.log('Subscription created successfully after payment:', subscriptionResult.id);
    return subscriptionResult;

  } catch (error) {
    console.error('Error in createRazorpaySubscription after payment:', error);
    throw error;
  }
}

// Function to get or create a Razorpay plan
async function getOrCreateRazorpayPlan(razorpay, amount, description) {
  try {
    const plans = await razorpay.plans.all({ count: 100 });
    
    // Check if a matching plan exists
    if (plans && plans.items && plans.items.length > 0) {
      for (const plan of plans.items) {
        if (plan.item && plan.item.amount === amount * 100) {
          console.log(`Found existing Razorpay plan: ${plan.id}`);
          return plan.id;
        }
      }
    }
  } catch (error) {
    console.log('Error fetching plans, will create new one:', error.message);
  }

  // Create new plan if not found
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
  if (!email) {
    return createNewRazorpayCustomer(razorpay, name, email, phone);
  }

  try {
    const customers = await razorpay.customers.all({ 
      count: 10,
      skip: 0 
    });

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