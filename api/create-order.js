const Razorpay = require('razorpay');

export default async function handler(req, res) {
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
    
    console.log('=== Payment Request ===');
    console.log('Request data:', { amount, name, email, frequency });
    
    if (!amount || !name) {
      return res.status(400).json({ error: 'Amount and name are required' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY
    });

    if (frequency === 'Monthly') {
      console.log('Processing monthly subscription...');
      
      // Email is required for subscriptions
      if (!email) {
        return res.status(400).json({ error: 'Email is required for monthly subscriptions' });
      }

      // Create plan ID based on amount
      const planId = `monthly_${amount}`;
      let plan;
      
      try {
        // Try to fetch existing plan
        plan = await razorpay.plans.fetch(planId);
        console.log('Using existing plan:', planId);
      } catch (planError) {
        console.log('Plan not found, creating new plan:', planId);
        
        // Plan doesn't exist, create it
        plan = await razorpay.plans.create({
          id: planId,
          name: `Monthly Donation ₹${amount}`,
          amount: parseInt(amount) * 100, // Amount in paisa
          currency: 'INR',
          interval: 1,
          period: 'monthly',
          notes: {
            created_for: 'donation_form'
          }
        });
        console.log('Created new plan:', plan.id);
      }

      // Create customer
      const customer = await razorpay.customers.create({
        name: name,
        email: email,
        contact: phone || '',
        notes: {
          donation_amount: amount,
          created_via: 'donation_form'
        }
      });
      console.log('Created customer:', customer.id);

      // Create subscription
      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: 60, // 5 years of monthly donations
        addons: [],
        notes: {
          donor_name: name,
          donor_email: email,
          donation_type: 'monthly',
          amount: amount
        }
      });

      console.log('Created subscription:', subscription.id);

      res.status(200).json({
        type: 'subscription',
        subscription_id: subscription.id,
        customer_id: customer.id,
        plan_id: planId,
        amount: parseInt(amount) * 100,
        currency: 'INR'
      });

    } else {
      console.log('Processing one-time payment...');
      
      // Handle one-time payment
      const options = {
        amount: Math.round(parseFloat(amount) * 100),
        currency: 'INR',
        receipt: `donation_${Date.now()}`,
        payment_capture: 1,
        notes: {
          donor_name: name,
          donor_email: email || '',
          donation_type: 'one_time'
        }
      };

      const order = await razorpay.orders.create(options);
      console.log('Created order:', order.id);
      
      res.status(200).json({
        type: 'order',
        id: order.id,
        amount: order.amount,
        currency: order.currency
      });
    }
    
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to process payment',
      details: error.message 
    });
  }
}