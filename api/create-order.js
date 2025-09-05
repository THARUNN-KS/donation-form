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

    // For BOTH one-time and monthly donations, create a regular order first
    // Monthly subscriptions will be created AFTER successful payment
    const options = {
      amount: Math.round(parseFloat(amount) * 100),
      currency: 'INR',
      receipt: frequency === 'Monthly' ? `monthly_first_payment_${Date.now()}` : `donation_${Date.now()}`,
      payment_capture: 1,
      notes: {
        donation_type: frequency === 'Monthly' ? 'monthly_first_payment' : 'one_time',
        donor_name: name,
        donor_email: email || '',
        donor_phone: phone || '',
        frequency: frequency,
        subscription_amount: frequency === 'Monthly' ? amount : null,
        needs_subscription_setup: frequency === 'Monthly' ? 'true' : 'false'
      }
    };

    const order = await razorpay.orders.create(options);
    console.log(`${frequency} order created:`, order.id);

    return res.status(200).json({
      type: 'order',
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      isMonthly: frequency === 'Monthly',
      donorData: {
        name,
        email: email || '',
        phone: phone || '',
        amount: parseFloat(amount)
      },
      message: frequency === 'Monthly' ? 
        'Order created for monthly subscription first payment' : 
        'One-time donation order created'
    });

  } catch (error) {
    console.error('=== CRITICAL ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    res.status(500).json({ 
      error: 'Payment processing failed',
      message: 'Unable to process your donation at this time. Please try again.',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}