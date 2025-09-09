const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
    console.log('=== STRIPE API CALLED ===');
    console.log('Request body:', req.body);

    const { amount, name, email, phone, frequency, currency } = req.body;

    // Validate required fields
    if (!amount || !name) {
      return res.status(400).json({ error: 'Amount and name are required' });
    }

    if (frequency === 'Monthly' && !email) {
      return res.status(400).json({ error: 'Email is required for monthly donations' });
    }

    // Check environment variables
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PUBLISHABLE_KEY) {
      console.error('Missing Stripe credentials');
      return res.status(500).json({ error: 'Payment gateway not configured' });
    }

    // Convert amount to cents/smallest currency unit
    const stripeAmount = Math.round(parseFloat(amount) * 100);

    console.log('Processing frequency:', frequency);

    if (frequency === 'Monthly') {
      console.log('=== PROCESSING MONTHLY SUBSCRIPTION VIA STRIPE ===');
      
      try {
        // Get or create product for monthly donations
        const product = await getOrCreateStripeProduct(stripe);
        
        // Create a price for this specific amount
        const price = await createStripePriceForSubscription(stripe, product.id, stripeAmount, currency);
        
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
          success_url: 'https://donation-form-j142-git-stripe-tharunn-ks-projects.vercel.app/success?session_id={CHECKOUT_SESSION_ID}',
          cancel_url: 'https://donation-form-j142-git-stripe-tharunn-ks-projects.vercel.app/cancel',
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

        return res.status(200).json({
          type: 'subscription',
          id: session.id,
          message: 'Monthly subscription checkout session created successfully'
        });

      } catch (subscriptionError) {
        console.error('=== STRIPE SUBSCRIPTION CREATION FAILED ===');
        console.error('Error details:', subscriptionError);
        
        return res.status(500).json({ 
          error: 'Subscription creation failed',
          message: 'Unable to set up monthly donation. Please try again.',
          details: process.env.NODE_ENV === 'development' ? subscriptionError.message : 'Internal server error'
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
        success_url: 'https://donation-form-j142-git-stripe-tharunn-ks-projects.vercel.app/success?session_id={CHECKOUT_SESSION_ID}',
        cancel_url: 'https://donation-form-j142-git-stripe-tharunn-ks-projects.vercel.app/cancel',
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

      return res.status(200).json({
        type: 'checkout',
        id: session.id,
        message: 'One-time donation checkout session created'
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

// Function to get or create a Stripe product for donations
async function getOrCreateStripeProduct(stripe) {
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
}

// Function to create a Stripe price for subscription
async function createStripePriceForSubscription(stripe, productId, amount, currency) {
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
}