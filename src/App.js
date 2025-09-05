import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [formData, setFormData] = useState({
    amount: '',
    name: '',
    email: '',
    phone: '',
    frequency: 'One-time'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script dynamically
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve, reject) => {
        // Check if Razorpay is already loaded
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        // Check if script already exists
        const existingScript = document.getElementById('razorpay-script');
        if (existingScript) {
          existingScript.onload = () => {
            setRazorpayLoaded(true);
            resolve(true);
          };
          return;
        }

        // Create and load script
        const script = document.createElement('script');
        script.id = 'razorpay-script';
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          console.log('Razorpay script loaded successfully');
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => {
          console.error('Failed to load Razorpay script');
          reject(new Error('Failed to load payment gateway'));
        };
        
        document.body.appendChild(script);
      });
    };

    loadRazorpay().catch(error => {
      console.error('Razorpay loading error:', error);
      setMessage('❌ Failed to load payment gateway. Please refresh the page.');
    });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    if (!formData.amount || !formData.name) {
      setMessage('Please fill in all required fields');
      return false;
    }

    if (formData.frequency === 'Monthly' && !formData.email) {
      setMessage('Email is required for monthly donations');
      return false;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      setMessage('Please enter a valid amount');
      return false;
    }

    return true;
  };

  const waitForRazorpay = () => {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) {
        resolve();
        return;
      }

      let attempts = 0;
      const maxAttempts = 10;
      
      const checkRazorpay = setInterval(() => {
        attempts++;
        console.log(`Checking for Razorpay... Attempt ${attempts}`);
        
        if (window.Razorpay) {
          clearInterval(checkRazorpay);
          resolve();
        } else if (attempts >= maxAttempts) {
          clearInterval(checkRazorpay);
          reject(new Error('Razorpay failed to load'));
        }
      }, 500);
    });
  };

  const openRazorpayCheckout = async (paymentData, isMonthly = false) => {
    try {
      // Wait for Razorpay to be available
      await waitForRazorpay();

      const options = {
        key: 'rzp_test_NkZWk4SLJaXiCx', // Your Razorpay key
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Your Organization',
        description: isMonthly ? 
          `Monthly Donation - ₹${formData.amount}` : 
          `Donation - ₹${formData.amount}`,
        order_id: paymentData.id,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#3399cc'
        },
        handler: function(response) {
          console.log('Payment successful:', response);
          const successMessage = isMonthly ? 
            '✅ Monthly donation processed successfully! We will set up recurring payments for you.' :
            '✅ Thank you for your generous donation!';
          setMessage(successMessage);
          setIsLoading(false);
          
          // Reset form on successful payment
          setTimeout(() => {
            setFormData({
              amount: '',
              name: '',
              email: '',
              phone: '',
              frequency: 'One-time'
            });
            setMessage('');
          }, 5000);
        },
        modal: {
          ondismiss: function() {
            setMessage('Payment cancelled');
            setIsLoading(false);
          }
        }
      };

      console.log('Opening Razorpay with options:', options);
      const rzp = new Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Razorpay initialization error:', error);
      setMessage(`❌ Payment gateway error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const initializePayment = async () => {
    if (!validateForm()) return;

    if (!razorpayLoaded) {
      setMessage('❌ Payment gateway is still loading. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    setMessage('Processing your donation...');

    try {
      console.log('Sending payment request:', formData);

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      console.log('Payment response:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to process payment');
      }

      // Handle different response types
      if (data.type === 'subscription') {
        // True subscription created
        setMessage(`✅ Monthly subscription set up successfully! Subscription ID: ${data.subscription_id}`);
        
        if (data.short_url) {
          setMessage(prev => prev + ` You can manage your subscription here: ${data.short_url}`);
        }
        setIsLoading(false);

      } else if (data.type === 'order_with_recurring_intent') {
        // Fallback: one-time order with monthly intent
        console.log('Using fallback method for monthly donation');
        await openRazorpayCheckout(data, true);

      } else if (data.type === 'order') {
        // Regular one-time donation
        await openRazorpayCheckout(data, false);

      } else {
        throw new Error('Unexpected response type from server');
      }

    } catch (error) {
      console.error('Payment initiation error:', error);
      setMessage(`❌ Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="donation-container">
        <div className="donation-form">
          <h2>Make a Donation</h2>
          
          {!razorpayLoaded && (
            <div className="loading-message">
              🔄 Loading payment gateway...
            </div>
          )}
          
          <div className="form-group">
            <label>Donation Type:</label>
            <div className="frequency-buttons">
              <button
                type="button"
                className={formData.frequency === 'One-time' ? 'active' : ''}
                onClick={() => setFormData(prev => ({ ...prev, frequency: 'One-time' }))}
              >
                One-time
              </button>
              <button
                type="button"
                className={formData.frequency === 'Monthly' ? 'active' : ''}
                onClick={() => setFormData(prev => ({ ...prev, frequency: 'Monthly' }))}
              >
                Monthly
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount (₹) *:</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="Enter amount"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Full Name *:</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email {formData.frequency === 'Monthly' ? '*' : ''}:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required={formData.frequency === 'Monthly'}
            />
            {formData.frequency === 'Monthly' && (
              <small className="help-text">Email required for monthly donations</small>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone (Optional):</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>

          <button 
            className="donate-button" 
            onClick={initializePayment}
            disabled={isLoading || !razorpayLoaded}
          >
            {isLoading 
              ? 'Processing...' 
              : !razorpayLoaded 
                ? 'Loading...' 
                : `Donate ₹${formData.amount || '0'} ${formData.frequency}`
            }
          </button>

          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'}`}>
              {message}
            </div>
          )}

          <div className="info-text">
            <p>
              {formData.frequency === 'Monthly' 
                ? '🔄 Monthly donations help us plan better and have greater impact.'
                : '💝 Your one-time donation makes a difference.'
              }
            </p>
            <p>🔒 Secure payment powered by Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;