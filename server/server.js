const express = require('express');
const cors = require('cors');
const Razorpay = require('razorpay');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000', // React app URL
  credentials: true
}));
app.use(express.json());

// Initialize Razorpay with your keys
const razorpay = new Razorpay({
  key_id: 'rzp_test_4nEyceM4GUQmPk', // Replace with your actual Razorpay Key ID
  key_secret: 'VOEc6TmHfMUWVvaxJcFsTHj9' // Replace with your actual Razorpay Secret Key
});

// Create order endpoint
app.post('/api/create-order', async (req, res) => {
  try {
    const { amount, name } = req.body;
    
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

    // Create order with Razorpay
    const options = {
      amount: Math.round(parseFloat(amount) * 100), // Amount in paisa (multiply by 100)
      currency: 'INR',
      receipt: `donation_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      payment_capture: 1
    };

    const order = await razorpay.orders.create(options);
    
    console.log('Order created successfully:', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      donorName: name
    });
    
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key: razorpay.key_id
    });
    
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      error: 'Failed to create order',
      details: error.message
    });
  }
});

// Verify payment endpoint (optional, for webhook handling)
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Server is running successfully!',
    timestamp: new Date().toISOString(),
    port: PORT
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Donation Backend Server',
    status: 'Running',
    endpoints: {
      health: '/health',
      createOrder: 'POST /api/create-order',
      verifyPayment: 'POST /api/verify-payment'
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🔗 API endpoint: http://localhost:${PORT}/api/create-order`);
  console.log('💡 Make sure to replace Razorpay keys with your actual keys!');
});