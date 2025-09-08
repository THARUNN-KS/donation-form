const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Stripe-Signature');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawBody = await buffer(req);
  
  try {
    // Get the signature sent by Stripe
    const signature = req.headers['stripe-signature'];
    
    // Verify webhook signature and extract the event
    let event;
    
    try {
      event = stripe.webhooks.constructEvent(
        rawBody,
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
}

// Helper function to get raw body for Stripe webhook verification
async function buffer(req) {
  const chunks = [];
  
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  
  return Buffer.concat(chunks);
}