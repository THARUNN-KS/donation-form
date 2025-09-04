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
    console.log('=== API Function Called ===');
    console.log('Request body:', req.body);
    console.log('Environment variables check:', {
      hasKeyId: !!process.env.RAZORPAY_KEY_ID,
      hasSecretKey: !!process.env.RAZORPAY_SECRET_KEY,
      keyIdLength: process.env.RAZORPAY_KEY_ID?.length,
      secretKeyLength: process.env.RAZORPAY_SECRET_KEY?.length
    });

    const { amount, name } = req.body;
    
    if (!amount || !name) {
      console.log('Missing required fields:', { amount, name });
      return res.status(400).json({ error: 'Amount and name are required' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
      console.log('Missing Razorpay credentials');
      return res.status(500).json({ error: 'Razorpay credentials not configured' });
    }

    console.log('Creating Razorpay instance...');
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY
    });

    const options = {
      amount: Math.round(parseFloat(amount) * 100),
      currency: 'INR',
      receipt: `donation_${Date.now()}`,
      payment_capture: 1
    };

    console.log('Creating order with options:', options);
    const order = await razorpay.orders.create(options);
    console.log('Order created successfully:', order.id);
    
    res.status(200).json({
      id: order.id,
      amount: order.amount,
      currency: order.currency
    });
    
  } catch (error) {
    console.error('=== ERROR DETAILS ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    
    res.status(500).json({ 
      error: 'Failed to create order',
      details: error.message 
    });
  }
}