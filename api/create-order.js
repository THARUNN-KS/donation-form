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
    
    if (!amount || !name) {
      return res.status(400).json({ error: 'Amount and name are required' });
    }

    // Email is required for monthly donations
    if (frequency === 'Monthly' && !email) {
      return res.status(400).json({ error: 'Email is required for monthly donations' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
      return res.status(500).json({ error: 'Razorpay credentials not configured' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY
    });

    console.log('Processing payment with frequency:', frequency);

    // Handle both one-time and monthly as orders (monthly marked for future processing)
    const isMonthly = frequency === 'Monthly';
    
    const options = {
      amount: Math.round(parseFloat(amount) * 100),
      currency: 'INR',
      receipt: `${isMonthly ? 'monthly' : 'onetime'}_${Date.now()}`,
      payment_capture: 1,
      notes: {
        donation_type: isMonthly ? 'monthly_recurring' : 'one_time',
        donor_name: name,
        donor_email: email || '',
        donor_phone: phone || '',
        recurring_setup_needed: isMonthly ? 'true' : 'false',
        frequency: frequency || 'One-time'
      }
    };

    console.log('Creating order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Order created successfully:', order.id);
    
    res.status(200).json({
      type: 'order',
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      is_monthly: isMonthly
    });
    
  } catch (error) {
    console.error('=== API ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to process payment',
      details: error.message 
    });
  }
}