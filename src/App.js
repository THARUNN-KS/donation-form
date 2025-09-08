const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_4nEyceM4GUQmPk',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'VOEc6TmHfMUWVvaxJcFsTHj9'
});

export default async function handler(req, res) {
  // CORS headers
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
    const { amount, name, email, phone, frequency } = req.body;
    
    // Validate input
    if (!amount || !name) {
      return res.status(400).json({
        error: 'Amount and name are required'
      });
    }

    if (frequency === 'Monthly' && !email) {
      return res.status(400).json({
        error: 'Email is required for monthly donations'
      });
    }

    // Validate amount is a positive number
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        error: 'Invalid amount. Please enter a valid positive number.'
      });
    }

    const amountInPaisa = Math.round(parseFloat(amount) * 100);

    if (frequency === 'Monthly') {
      // Create subscription plan first
      const planOptions = {
        period: 'monthly',
        interval: 1,
        item: {
          name: `Monthly Donation - ${name}`,
          amount: amountInPaisa,
          currency: 'INR',
          description: `Monthly donation of ₹${amount}`
        }
      };

      const plan = await razorpay.plans.create(planOptions);
      
      console.log('Plan created:', plan.id);

      // Create subscription
      const subscriptionOptions = {
        plan_id: plan.id,
        customer_notify: 1,
        total_count: 120, // 10 years of monthly payments
        notes: {
          donor_name: name,
          donor_email: email || '',
          donor_phone: phone || ''
        }
      };

      const subscription = await razorpay.subscriptions.create(subscriptionOptions);
      
      console.log('Subscription created successfully:', {
        subscriptionId: subscription.id,
        amount: amountInPaisa,
        planId: plan.id,
        donorName: name
      });

      // Return subscription details for popup handling
      res.status(200).json({
        type: 'subscription',
        subscription_id: subscription.id,
        amount: amountInPaisa,
        currency: 'INR',
        key: razorpay.key_id
      });

    } else {
      // Create regular order for one-time payment
      const options = {
        amount: amountInPaisa,
        currency: 'INR',
        receipt: `donation_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        payment_capture: 1,
        notes: {
          donor_name: name,
          donor_email: email || '',
          donor_phone: phone || ''
        }
      };

      const order = await razorpay.orders.create(options);
      
      console.log('Order created successfully:', {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        donorName: name
      });
      
      res.status(200).json({
        type: 'order',
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: razorpay.key_id
      });
    }
    
  } catch (error) {
    console.error('Error creating order/subscription:', error);
    res.status(500).json({
      error: 'Failed to create order/subscription',
      details: error.message
    });
  }
}