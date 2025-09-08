const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');
require('dotenv').config();
const app = express();
const PORT = process.env.PORT || 5001;

// Initialize Stripe only if the API key is available
let stripe;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized successfully');
  } else {
    console.warn('STRIPE_SECRET_KEY not found in environment variables. Stripe functionality will be disabled.');
  }
} catch (error) {
  console.error('Failed to initialize Stripe:', error.message);
}

// Determine allowed origins based on environment
const allowedOrigins = [
  'http://localhost:3000',  // Development
  'https://donation-form-j142.vercel.app',  // Production
  // Add any other domains you might use
];

// CORS Configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Raw body parser middleware for Stripe webhooks (only if Stripe is available)
if (stripe) {
  app.use('/api/webhook', express.raw({ type: 'application/json' }));
}

// JSON parsing middleware for other routes
app.use(express.json());

// Initialize Razorpay with your keys
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_4nEyceM4GUQmPk', // Use environment variable if available, fallback to hardcoded value
  key_secret: process.env.RAZORPAY_SECRET_KEY || 'VOEc6TmHfMUWVvaxJcFsTHj9' // Use environment variable if available, fallback to hardcoded value
});

// Create Razorpay order endpoint
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, name, email, phone, frequency } = req.body;
    
    // Validate input
    if (!amount || !name) {
      return res.status(400).json({
        error: 'Amount and name are required'
      });
    }

    // Validate amount is a positive number
    if (isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        error: 'Invalid amount. Please enter a valid positive number.'
      });
    }

    if (frequency === 'Monthly') {
      console.log('=== PROCESSING MONTHLY SUBSCRIPTION VIA RAZORPAY ===');
      
      try {
        // Use the Supabase approach for creating subscriptions
        const subscriptionResult = await createRazorpaySubscription(
          razorpay, 
          parseFloat(amount), 
          name, 
          email, 
          phone
        );

        return res.status(200).json({
          type: 'subscription',
          subscription_id: subscriptionResult.id,
          customer_id: subscriptionResult.customer_id,
          plan_id: subscriptionResult.plan_id,
          amount: parseInt(amount) * 100,
          currency: 'INR',
          short_url: subscriptionResult.short_url,
          status: subscriptionResult.status,
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
      console.log('=== PROCESSING ONE-TIME DONATION VIA RAZORPAY ===');
      
      // Create order with Razorpay
      const options = {
        amount: Math.round(parseFloat(amount) * 100), // Amount in paisa (multiply by 100)
        currency: 'INR',
        receipt: `donation_${Date.now()}_${Math.random().toString(36).substring(7)}`,
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
      
      console.log('Order created successfully:', {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        donorName: name
      });
      
      res.json({
        type: 'order',
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        key: razorpay.key_id,
        message: 'One-time donation order created'
      });
    }
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      error: 'Failed to create order',
      details: error.message
    });
  }
});

// Create Stripe payment endpoint (only if Stripe is available)
if (stripe) {
  app.post('/api/create-stripe-payment', async (req, res) => {
    try {
      console.log('=== STRIPE API CALLED ===');
      console.log('Request body:', req.body);

      const { amount, name, email, phone, frequency, currency } = req.body;
      
      // Validate input
      if (!amount || !name) {
        return res.status(400).json({
          error: 'Amount and name are required'
        });
      }

      if (frequency === 'Monthly' && !email) {
        return res.status(400).json({ error: 'Email is required for monthly donations' });
      }

      // Validate amount is a positive number
      if (isNaN(amount) || parseFloat(amount) <= 0) {
        return res.status(400).json({
          error: 'Invalid amount. Please enter a valid positive number.'
        });
      }

      // Convert amount to cents/smallest currency unit
      const stripeAmount = Math.round(parseFloat(amount) * 100);

      if (frequency === 'Monthly') {
        console.log('=== PROCESSING MONTHLY SUBSCRIPTION VIA STRIPE ===');
        
        try {
          // Get or create product for monthly donations
          const product = await getOrCreateStripeProduct();
          
          // Create a price for this specific amount
          const price = await createStripePriceForSubscription(product.id, stripeAmount, currency);
          
          // Create a Stripe Checkout Session for the subscription
          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
              {
                price: price.id,
                quantity: 1,
              },
            ],
            mode: 'subscription',
            success_url: 'https://donation-form-j142.vercel.app/success?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'https://donation-form-j142.vercel.app/cancel',
            customer_email: email,
            metadata: {
              donation_type: 'monthly_recurring',
              donor_name: name,
              donor_phone: phone || '',
              frequency: 'Monthly',
              amount: amount,
              currency: currency
            }
          });

          res.json({
            type: 'subscription',
            id: session.id,
            message: 'Monthly subscription checkout session created successfully'
          });
        } catch (error) {
          console.error('=== STRIPE SUBSCRIPTION CREATION FAILED ===');
          console.error('Error details:', error);
          
          return res.status(500).json({ 
            error: 'Subscription creation failed',
            message: 'Unable to set up monthly donation. Please try again.',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
          });
        }
      } else {
        console.log('=== PROCESSING ONE-TIME DONATION VIA STRIPE ===');
        
        // Create a Stripe Checkout Session for one-time payment
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: [
            {
              price_data: {
                currency: currency.toLowerCase(),
                product_data: {
                  name: 'One-time Donation',
                  description: `Donation to Team Everest`,
                },
                unit_amount: stripeAmount,
              },
              quantity: 1,
            },
          ],
          mode: 'payment',
          success_url: 'https://donation-form-j142.vercel.app/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'https://donation-form-j142.vercel.app/cancel',
          customer_email: email || undefined,
          metadata: {
            donation_type: 'one_time',
            donor_name: name,
            donor_email: email || '',
            donor_phone: phone || '',
            frequency: 'One-time',
            amount: amount,
            currency: currency
          }
        });

        res.json({
          type: 'checkout',
          id: session.id,
          message: 'One-time donation checkout session created'
        });
      }
    } catch (error) {
      console.error('Error creating Stripe payment:', error);
      res.status(500).json({
        error: 'Failed to create Stripe payment',
        details: error.message
      });
    }
  });
} else {
  // Fallback route for when Stripe is not configured
  app.post('/api/create-stripe-payment', (req, res) => {
    return res.status(501).json({
      error: 'Stripe not configured',
      message: 'Stripe payment gateway is not configured. Please set the STRIPE_SECRET_KEY environment variable.'
    });
  });
}

// Verify Razorpay payment endpoint
app.post('/api/verify-payment', (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    // Here you can verify the payment signature
    // For now, just log the successful payment
    console.log('Payment completed:', {
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id,
      signature: razorpay_signature
    });
    
    res.json({ status: 'Payment verified successfully' });
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
});

// Stripe webhook endpoint (only if Stripe is available)
if (stripe) {
  app.post('/api/webhook', async (req, res) => {
    try {
      // Get the signature sent by Stripe
      const signature = req.headers['stripe-signature'];
      
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.warn('STRIPE_WEBHOOK_SECRET not found, skipping signature verification');
        return res.status(200).json({ received: true, verified: false });
      }
      
      // Verify webhook signature and extract the event
      let event;
      
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
      } catch (err) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }
      
      // Handle the event
      console.log('Stripe webhook received:', event.type);
      
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object;
          
          console.log('Checkout session completed:', {
            session_id: session.id,
            payment_status: session.payment_status,
            metadata: session.metadata
          });
          
          // Process the successful payment based on session.metadata
          // e.g., update database, send confirmation email, etc.
          break;
          
        case 'invoice.paid':
          const invoice = event.data.object;
          
          console.log('Subscription invoice paid:', {
            invoice_id: invoice.id,
            subscription_id: invoice.subscription,
            customer_id: invoice.customer
          });
          
          // Process the successful subscription payment
          break;
          
        case 'invoice.payment_failed':
          const failedInvoice = event.data.object;
          
          console.log('Subscription invoice payment failed:', {
            invoice_id: failedInvoice.id,
            subscription_id: failedInvoice.subscription,
            customer_id: failedInvoice.customer
          });
          
          // Handle failed subscription payment
          break;
          
        default:
          // Unexpected event type
          console.log(`Unhandled event type: ${event.type}`);
      }
      
      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Stripe webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  });
}

// Health check endpoint
app.get('/health', (req, res) => {
  const stripeStatus = stripe ? 'available' : 'not configured';
  
  res.json({ 
    status: 'Server is running successfully!',
    timestamp: new Date().toISOString(),
    port: PORT,
    payment_gateways: {
      razorpay: 'available',
      stripe: stripeStatus
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  const endpoints = {
    health: '/health',
    createRazorpayOrder: 'POST /api/create-order',
    verifyRazorpayPayment: 'POST /api/verify-payment'
  };
  
  if (stripe) {
    endpoints.createStripePayment = 'POST /api/create-stripe-payment';
    endpoints.stripeWebhook = 'POST /api/webhook';
  }
  
  res.json({
    message: 'Donation Backend Server',
    status: 'Running',
    endpoints: endpoints
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Function to get or create a Stripe product for donations
// Only define this function if Stripe is available
const getOrCreateStripeProduct = stripe ? async function() {
  const productName = 'Monthly Donation For Team Everest';
  
  try {
    // Check if product already exists
    const products = await stripe.products.list({
      limit: 100,
      active: true
    });
    
    // Find the product with matching name
    const existingProduct = products.data.find(p => p.name === productName);
    
    if (existingProduct) {
      console.log(`Found existing Stripe product: ${existingProduct.id}`);
      return existingProduct;
    }
    
    // If not found, create a new product
    const newProduct = await stripe.products.create({
      name: productName,
      description: 'Monthly recurring donation to Team Everest',
      metadata: {
        type: 'donation',
        recurring: 'true',
        created_by: 'donation_system',
        creation_timestamp: new Date().toISOString()
      }
    });
    
    console.log(`Created new Stripe product: ${newProduct.id}`);
    return newProduct;
  } catch (error) {
    console.error('Stripe product creation/retrieval error:', error);
    throw new Error(`Product creation/retrieval failed: ${error.message}`);
  }
} : null;

// Function to create a Stripe price for subscription
// Only define this function if Stripe is available
const createStripePriceForSubscription = stripe ? async function(productId, amount, currency) {
  try {
    // Check if price already exists for this amount
    const prices = await stripe.prices.list({
      product: productId,
      active: true,
      type: 'recurring',
      currency: currency.toLowerCase()
    });
    
    // Find price with matching amount
    const existingPrice = prices.data.find(
      p => p.unit_amount === amount && 
           p.currency.toLowerCase() === currency.toLowerCase() && 
           p.recurring && 
           p.recurring.interval === 'month'
    );
    
    if (existingPrice) {
      console.log(`Found existing Stripe price: ${existingPrice.id}`);
      return existingPrice;
    }
    
    // If not found, create a new price
    const newPrice = await stripe.prices.create({
      product: productId,
      unit_amount: amount,
      currency: currency.toLowerCase(),
      recurring: {
        interval: 'month'
      },
      metadata: {
        type: 'donation',
        created_by: 'donation_system',
        creation_timestamp: new Date().toISOString()
      }
    });
    
    console.log(`Created new Stripe price: ${newPrice.id}`);
    return newPrice;
  } catch (error) {
    console.error('Stripe price creation/retrieval error:', error);
    throw new Error(`Price creation/retrieval failed: ${error.message}`);
  }
} : null;

// Start server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Razorpay API endpoint: http://localhost:${PORT}/api/create-order`);
  
  if (stripe) {
    console.log(`Stripe API endpoint: http://localhost:${PORT}/api/create-stripe-payment`);
    console.log('Stripe is configured and ready to use');
  } else {
    console.log('Stripe is NOT configured. Only Razorpay payments will be available.');
    console.log('To enable Stripe, set the STRIPE_SECRET_KEY environment variable');
  }
  
  console.log('Make sure to replace Razorpay and Stripe keys with your actual keys!');
});

// Import the createRazorpaySubscription function from the original code
async function createRazorpaySubscription(razorpay, amount, name = '', email = '', phone = '') {
  try {
    // Step 1: Get or create a plan
    const planId = await getOrCreateRazorpayPlan(razorpay, amount, `Monthly donation of INR ${amount}`);
    
    // Step 2: Get or create a customer
    let customerId = '';
    if (email || phone) {
      customerId = await getOrCreateRazorpayCustomer(razorpay, name, email, phone);
    }

    // Step 3: Create subscription
    const subscriptionData = {
      plan_id: planId,
      total_count: 360, // 30 years like in Supabase
      quantity: 1,
      customer_notify: 1,
      start_at: Math.floor(Date.now() / 1000) + 300, // Start in 5 minutes
      notes: {
        donation_amount: amount,
        created_by: 'donation_system',
        source: 'Donation Website'
      }
    };

    // Add customer_id if available
    if (customerId) {
      subscriptionData.customer_id = customerId;
      subscriptionData.notes.customer_name = name;
      subscriptionData.notes.customer_email = email;
    }

    // Create subscription
    console.log('Creating Razorpay subscription with data:', JSON.stringify(subscriptionData));
    const subscriptionResult = await razorpay.subscriptions.create(subscriptionData);

    // If no short_url, try to create payment link as fallback (like Supabase does)
    if (!subscriptionResult.short_url) {
      console.log('No short_url found, creating payment link as fallback...');
      try {
        const paymentLinkData = {
          amount: amount * 100,
          currency: 'INR',
          accept_partial: false,
          description: `Monthly donation of INR ${amount}`,
          customer: {
            name: name || 'Donor',
            email: email || '',
            contact: phone || ''
          },
          notes: {
            subscription_id: subscriptionResult.id,
            plan_id: planId,
            donation_type: 'recurring',
            source: 'Donation Website'
          },
          callback_url: 'https://donation-form-j142.vercel.app',
          callback_method: 'get'
        };

        const paymentLink = await razorpay.paymentLink.create(paymentLinkData);
        if (paymentLink.short_url) {
          console.log('Created payment link as fallback:', paymentLink.short_url);
          subscriptionResult.short_url = paymentLink.short_url;
        }
      } catch (linkError) {
        console.error('Failed to create payment link fallback:', linkError);
      }
    }

    return subscriptionResult;
  } catch (error) {
    console.error('Error in createRazorpaySubscription:', error);
    throw error;
  }
}

// Function to get or create a Razorpay plan (adapted from Supabase)
async function getOrCreateRazorpayPlan(razorpay, amount, description) {
  // First, check if plan with this amount already exists
  try {
    const plans = await razorpay.plans.all({ count: 100 });
    
    // Check if a matching plan exists
    if (plans && plans.items && plans.items.length > 0) {
      for (const plan of plans.items) {
        // Check if amount matches
        if (plan.item && plan.item.amount === amount * 100) {
          console.log(`Found existing Razorpay plan: ${plan.id}`);
          return plan.id;
        }
      }
    }
  } catch (error) {
    console.log('Error fetching plans, will create new one:', error.message);
  }

  // If no matching plan found, create a new one
  const planData = {
    period: 'monthly',
    interval: 1,
    item: {
      name: description || `Monthly donation of INR ${amount}`,
      amount: amount * 100,
      currency: 'INR',
      description: description || `Monthly donation of INR ${amount}`
    },
    notes: {
      created_by: 'donation_system',
      creation_timestamp: new Date().toISOString()
    }
  };

  try {
    const newPlan = await razorpay.plans.create(planData);
    console.log(`Created new Razorpay plan: ${newPlan.id}`);
    return newPlan.id;
  } catch (error) {
    console.error('Razorpay plan creation error:', error);
    throw new Error(`Plan creation failed: ${error.message}`);
  }
}

// Function to find or create a Razorpay customer (adapted from Supabase)
async function getOrCreateRazorpayCustomer(razorpay, name, email, phone) {
  // If email is missing, create a new customer
  if (!email) {
    return createNewRazorpayCustomer(razorpay, name, email, phone);
  }

  // First, check if customer already exists by email
  try {
    const customers = await razorpay.customers.all({ 
      count: 10,
      skip: 0 
    });

    // Check if a matching customer exists
    if (customers && customers.items && customers.items.length > 0) {
      for (const customer of customers.items) {
        if (customer.email && customer.email.toLowerCase() === email.toLowerCase()) {
          console.log(`Found existing Razorpay customer by email: ${customer.id}`);
          return customer.id;
        }
      }
    }
  } catch (error) {
    console.log('Error fetching customers, will create new one:', error.message);
  }

  // If no matching customer found, create a new one
  return createNewRazorpayCustomer(razorpay, name, email, phone);
}

// Helper to create a new Razorpay customer
async function createNewRazorpayCustomer(razorpay, name, email, phone) {
  const customerData = {
    name: name || 'Donor',
    email: email || '',
    contact: phone || '',
    fail_existing: 0,
    notes: {
      source: 'Donation Website',
      creation_date: new Date().toISOString()
    }
  };

  try {
    const newCustomer = await razorpay.customers.create(customerData);
    console.log(`Created new Razorpay customer: ${newCustomer.id}`);
    return newCustomer.id;
  } catch (error) {
    console.error('Razorpay customer creation error:', error);
    throw new Error(`Customer creation failed: ${error.message}`);
  }
}