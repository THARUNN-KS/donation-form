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
    console.log('=== API CALLED ===');
    console.log('Request body:', req.body);

    const { amount, name, email, phone, frequency } = req.body;
    
    if (!amount || !name) {
      return res.status(400).json({ error: 'Amount and name are required' });
    }

    if (frequency === 'Monthly' && !email) {
      return res.status(400).json({ error: 'Email is required for monthly subscriptions' });
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_SECRET_KEY) {
      return res.status(500).json({ error: 'Razorpay credentials not configured' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY
    });

    if (frequency === 'Monthly') {
      console.log('=== ATTEMPTING TRUE SUBSCRIPTION ===');
      
      try {
        // Step 1: Create or fetch plan
        const planId = `monthly_${amount}`;
        let plan;
        
        try {
          console.log('Checking if plan exists:', planId);
          plan = await razorpay.plans.fetch(planId);
          console.log('Plan found:', plan.id);
        } catch (planError) {
          console.log('Plan not found, creating new plan:', planId);
          plan = await razorpay.plans.create({
            id: planId,
            name: `Monthly Donation ₹${amount}`,
            amount: parseInt(amount) * 100,
            currency: 'INR',
            interval: 1,
            period: 'monthly',
            notes: {
              created_by: 'donation_form',
              amount_inr: amount
            }
          });
          console.log('Plan created successfully:', plan.id);
        }

        // Step 2: Create subscription (simplified - no customer creation in test mode)
        console.log('Creating subscription...');
        const subscription = await razorpay.subscriptions.create({
          plan_id: planId,
          customer_notify: 1,
          quantity: 1,
          total_count: 60, // 5 years
          notes: {
            donor_name: name,
            donor_email: email,
            donor_phone: phone || '',
            donation_type: 'monthly_subscription'
          }
        });

        console.log('Subscription created successfully:', subscription.id);

        return res.status(200).json({
          type: 'subscription',
          subscription_id: subscription.id,
          plan_id: planId,
          amount: parseInt(amount) * 100,
          currency: 'INR'
        });

      } catch (subscriptionError) {
        console.error('=== SUBSCRIPTION FAILED, USING FALLBACK ===');
        console.error('Subscription error:', subscriptionError.message);
        
        // FALLBACK: Create one-time order with monthly flags (this always works)
        console.log('Creating fallback one-time order with monthly flags...');
        
        const options = {
          amount: Math.round(parseFloat(amount) * 100),
          currency: 'INR',
          receipt: `monthly_fallback_${Date.now()}`,
          payment_capture: 1,
          notes: {
            donation_type: 'monthly_recurring',
            donor_name: name,
            donor_email: email,
            donor_phone: phone || '',
            recurring_setup_needed: 'true',
            frequency: 'Monthly',
            subscription_failed: 'true',
            fallback_reason: subscriptionError.message,
            original_intent: 'subscription'
          }
        };

        const order = await razorpay.orders.create(options);
        console.log('Fallback order created successfully:', order.id);
        
        return res.status(200).json({
          type: 'order',
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          is_monthly: true,
          fallback: true,
          message: 'Monthly donation created (subscription fallback)'
        });
      }

    } else {
      // Handle one-time payment (existing working code)
      console.log('=== CREATING ONE-TIME PAYMENT ===');
      
      const options = {
        amount: Math.round(parseFloat(amount) * 100),
        currency: 'INR',
        receipt: `onetime_${Date.now()}`,
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
        is_monthly: false
      });
    }
    
  } catch (error) {
    console.error('=== CRITICAL API ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body that caused error:', req.body);
    
    res.status(500).json({ 
      error: 'Failed to process payment',
      details: error.message,
      type: 'api_error'
    });
  }
}