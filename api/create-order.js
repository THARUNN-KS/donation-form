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
    
    if (!amount || !name) {
      return res.status(400).json({ error: 'Amount and name are required' });
    }

    if (frequency === 'Monthly' && !email) {
      return res.status(400).json({ error: 'Email is required for monthly subscriptions' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_SECRET_KEY
    });

    if (frequency === 'Monthly') {
      console.log('=== CREATING TRUE SUBSCRIPTION ===');
      
      // Step 1: Create or fetch plan
      const planId = `monthly_${amount}`;
      let plan;
      
      try {
        console.log('Checking if plan exists:', planId);
        plan = await razorpay.plans.fetch(planId);
        console.log('Plan found:', plan.id);
      } catch (planError) {
        console.log('Plan not found, creating new plan:', planId);
        try {
          plan = await razorpay.plans.create({
            id: planId,
            name: `Monthly Donation ₹${amount}`,
            amount: parseInt(amount) * 100, // Amount in paisa
            currency: 'INR',
            interval: 1,
            period: 'monthly',
            notes: {
              created_by: 'donation_form',
              amount_inr: amount,
              created_at: new Date().toISOString()
            }
          });
          console.log('Plan created successfully:', plan.id);
        } catch (createError) {
          console.error('Plan creation failed:', createError);
          throw new Error(`Failed to create subscription plan: ${createError.message}`);
        }
      }

      // Step 2: Create customer (required for subscriptions)
      let customer;
      try {
        console.log('Creating customer for subscription...');
        customer = await razorpay.customers.create({
          name: name,
          email: email,
          contact: phone || '',
          notes: {
            donor_type: 'monthly_subscriber',
            source: 'donation_form'
          }
        });
        console.log('Customer created:', customer.id);
      } catch (customerError) {
        console.error('Customer creation failed:', customerError);
        throw new Error(`Failed to create customer: ${customerError.message}`);
      }

      // Step 3: Create subscription
      try {
        console.log('Creating subscription...');
        const subscription = await razorpay.subscriptions.create({
          plan_id: planId,
          customer_notify: 1,
          quantity: 1,
          total_count: 60, // 5 years of monthly donations
          start_at: Math.floor(Date.now() / 1000) + 86400, // Start after 24 hours
          expire_by: Math.floor(Date.now() / 1000) + (86400 * 7), // Expire in 7 days if not paid
          notes: {
            donor_name: name,
            donor_email: email,
            donor_phone: phone || '',
            donation_type: 'monthly_subscription',
            source: 'embedded_donation_form'
          }
        });

        console.log('Subscription created successfully:', subscription.id);

        res.status(200).json({
          type: 'subscription',
          subscription_id: subscription.id,
          customer_id: customer.id,
          plan_id: planId,
          amount: parseInt(amount) * 100,
          currency: 'INR',
          short_url: subscription.short_url
        });

      } catch (subscriptionError) {
        console.error('Subscription creation failed:', subscriptionError);
        throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
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
      
      res.status(200).json({
        type: 'order',
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        is_monthly: false
      });
    }
    
  } catch (error) {
    console.error('=== API ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    res.status(500).json({ 
      error: 'Failed to process payment',
      details: error.message,
      type: 'subscription_error'
    });
  }
}