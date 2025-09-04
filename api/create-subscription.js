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
    const { amount, name, email, phone } = req.body;
    
    if (!amount || !name || !email) {
      return res.status(400).json({ error: 'Amount, name, and email are required for subscriptions' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY
    });

    // Create customer first
    const customer = await razorpay.customers.create({
      name: name,
      email: email,
      contact: phone || ''
    });

    // Create subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: `monthly_${amount}`, // This should match your plan IDs
      customer_notify: 1,
      total_count: 60, // 5 years of monthly donations
      start_at: Math.floor(Date.now() / 1000) + 86400, // Start tomorrow
      notes: {
        donor_name: name,
        donor_email: email
      }
    });
    
    res.status(200).json({
      subscription_id: subscription.id,
      customer_id: customer.id,
      plan_id: `monthly_${amount}`,
      short_url: subscription.short_url
    });
    
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ 
      error: 'Failed to create subscription',
      details: error.message 
    });
  }
}