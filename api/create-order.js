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
    console.log('Environment check:', {
      hasKeyId: !!process.env.RAZORPAY_KEY_ID,
      hasSecretKey: !!process.env.RAZORPAY_SECRET_KEY
    });

    const { amount, name, email, phone, frequency } = req.body;
    
    if (!amount || !name) {
      return res.status(400).json({ error: 'Amount and name are required' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
      return res.status(500).json({ error: 'Razorpay credentials not configured' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY
    });

    console.log('Frequency:', frequency);

    if (frequency === 'Monthly') {
      console.log('Processing monthly subscription...');
      
      if (!email) {
        return res.status(400).json({ error: 'Email is required for monthly subscriptions' });
      }

      // For now, just return a test response for subscriptions
      res.status(200).json({
        type: 'subscription',
        subscription_id: 'test_sub_123',
        customer_id: 'test_cust_123',
        plan_id: `monthly_${amount}`,
        amount: parseInt(amount) * 100,
        currency: 'INR',
        message: 'Subscription flow - testing'
      });

    } else {
      console.log('Processing one-time payment...');
      
      // Handle one-time payment
      const options = {
        amount: Math.round(parseFloat(amount) * 100),
        currency: 'INR',
        receipt: `donation_${Date.now()}`,
        payment_capture: 1
      };

      const order = await razorpay.orders.create(options);
      
      res.status(200).json({
        type: 'order',
        id: order.id,
        amount: order.amount,
        currency: order.currency
      });
    }
    
  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}