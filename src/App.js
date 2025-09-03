import React, { useState } from 'react';
import './App.css';

const scriptURL = "https://checkout.razorpay.com/v1/checkout.js";

const App = () => {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError('');
  };

  // Validate form data
  const validateForm = () => {
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid donation amount');
      return false;
    }
    if (parseFloat(formData.amount) < 1) {
      setError('Minimum donation amount is ₹1');
      return false;
    }
    return true;
  };

  // Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      
      const script = document.createElement('script');
      script.src = scriptURL;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle form submission
  const handleFormSubmit = async (event) => {
    event.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load payment gateway');
      }

      await initiateRazorpayPayment();
    } catch (error) {
      console.error('Payment initiation error:', error);
      setError(error.message || 'Failed to initiate payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initialize Razorpay payment
  const initiateRazorpayPayment = async () => {
    try {
      // Create order on backend - UPDATED FOR VERCEL (relative path)
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: formData.amount,
          name: formData.name,
          email: formData.email,
          phone: formData.phone
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create order');
      }

      const orderData = await response.json();

      // Razorpay payment options
      const options = {
        key: 'rzp_test_4nEyceM4GUQmPk',
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.id,
        name: 'Donation Campaign',
        description: 'Thank you for your generous donation!',
        image: '/logo192.png',
        handler: function (response) {
          handlePaymentSuccess(response);
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#3399cc",
        },
        modal: {
          ondismiss: function() {
            setLoading(false);
            console.log('Payment modal closed');
          }
        }
      };

      // Open Razorpay modal
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      throw error;
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = async (response) => {
    try {
      console.log('Payment successful:', response);
      
      // Optional: Verify payment on backend - UPDATED FOR VERCEL
      await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        }),
      });

      alert(`Thank you ${formData.name}! Your donation of ₹${formData.amount} has been received successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        amount: '',
        email: '',
        phone: ''
      });
      
    } catch (error) {
      console.error('Payment verification error:', error);
      alert('Payment completed but verification failed. Please contact support.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="donation-container">
        <h1>Donate to Our Cause</h1>
        <p>Your contribution makes a difference in someone's life!</p>
        
        <form onSubmit={handleFormSubmit} className="donation-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label htmlFor="name">Full Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email (Optional)</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number (Optional)</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Enter your phone number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Donation Amount (₹) *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="Enter amount in rupees"
              min="1"
              step="1"
              required
            />
          </div>

          <div className="quick-amounts">
            <p>Quick select:</p>
            {[100, 500, 1000, 2000, 5000].map(amount => (
              <button
                key={amount}
                type="button"
                className="quick-amount-btn"
                onClick={() => setFormData(prev => ({ ...prev, amount: amount.toString() }))}
              >
                ₹{amount}
              </button>
            ))}
          </div>

          <button 
            type="submit" 
            className="donate-btn"
            disabled={loading}
          >
            {loading ? 'Processing...' : `Donate ₹${formData.amount || '0'}`}
          </button>
        </form>

        <div className="info-section">
          <p>Secure payment powered by Razorpay</p>
          <p>All donations are processed securely</p>
        </div>
      </div>
    </div>
  );
};

export default App;