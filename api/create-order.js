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
        // Step 1: Create customer
        console.log('Creating customer...');
        const customer = await razorpay.customers.create({
          name: name,
          email: email,
          contact: phone || '',
          fail_existing: 0
        });
        console.log('Customer created:', customer.id);

        // Step 2: Ensure plan exists
        const planId = `monthly_${amount}`;
        console.log('Checking for plan:', planId);
        
        let plan;
        try {
          plan = await razorpay.plans.fetch(planId);
          console.log('Plan found:', plan.id);
        } catch (planError) {
          console.log('Plan not found, creating new plan...');
          plan = await razorpay.plans.create({
            id: planId,
            item: {
              name: `Monthly Donation ₹${amount}`,
              amount: parseInt(amount) * 100,
              currency: 'INR'
            },
            period: 'monthly',
            interval: 1,
            notes: {
              donation_type: 'monthly_recurring',
              amount_inr: amount
            }
          });
          console.log('Plan created:', plan.id);
        }

        // Step 3: Create subscription
        console.log('Creating subscription...');
        const subscription = await razorpay.subscriptions.create({
          plan_id: planId,
          customer_notify: 1,
          total_count: 60, // 5 years
          start_at: Math.floor(Date.now() / 1000) + 300, // Start in 5 minutes
          notes: {
            donor_name: name,
            donor_email: email,
            donor_phone: phone || '',
            donation_type: 'monthly_recurring'
          }
        });
        console.log('Subscription created successfully:', subscription.id);

        return res.status(200).json({
          type: 'subscription',
          subscription_id: subscription.id,
          customer_id: customer.id,
          plan_id: planId,
          amount: parseInt(amount) * 100,
          currency: 'INR',
          short_url: subscription.short_url,
          status: subscription.status,
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