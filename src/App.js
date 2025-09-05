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
      setMessage('Failed to load payment gateway. Please refresh the page.');
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

  // Function to create subscription after successful payment
  const createSubscriptionAfterPayment = async (paymentResponse, donorData) => {
    try {
      console.log('Creating subscription after successful payment...');
      
      const subscriptionData = {
        amount: donorData.amount,
        name: donorData.name,
        email: donorData.email,
        phone: donorData.phone,
        paymentId: paymentResponse.razorpay_payment_id,
        orderId: paymentResponse.razorpay_order_id
      };

      const response = await fetch('/api/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData)
      });

      const subscriptionResult = await response.json();
      console.log('Subscription creation response:', subscriptionResult);

      if (response.ok && subscriptionResult.success) {
        console.log('Subscription created successfully:', subscriptionResult.subscription_id);
        return subscriptionResult;
      } else {
        throw new Error(subscriptionResult.message || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Error creating subscription after payment:', error);
      // Don't throw error - payment was successful, just log the subscription creation failure
      return { error: error.message };
    }
  };

  const openRazorpayCheckout = async (paymentData) => {
    try {
      // Wait for Razorpay to be available
      await waitForRazorpay();

      const isMonthly = paymentData.isMonthly;
      const donorData = paymentData.donorData;

      const options = {
        key: 'rzp_test_NkZWk4SLJaXiCx', // Your Razorpay key
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Your Organization',
        description: isMonthly ? 
          `Monthly Subscription First Payment - ₹${formData.amount}` : 
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
        handler: async function(response) {
          console.log('Payment successful:', response);
          
          setMessage('Payment successful! Processing...');
          
          if (isMonthly) {
            // For monthly donations, create subscription after payment
            const subscriptionResult = await createSubscriptionAfterPayment(response, donorData);
            
            if (subscriptionResult.error) {
              setMessage('Payment successful! Note: Subscription setup encountered an issue. Please contact support.');
            } else {
              setMessage(`Payment successful! Monthly subscription activated. Subscription ID: ${subscriptionResult.subscription_id}`);
            }
          } else {
            setMessage('Thank you for your generous donation!');
          }
          
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
          }, 8000);
        },
        modal: {
          ondismiss: function() {
            setMessage('Payment cancelled');
            setIsLoading(false);
          }
        }
      };

      console.log('Opening Razorpay with options:', options);
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Razorpay initialization error:', error);
      setMessage(`Payment gateway error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const initializePayment = async () => {
    if (!validateForm()) return;

    if (!razorpayLoaded) {
      setMessage('Payment gateway is still loading. Please wait a moment and try again.');
      return;
    }

    setIsLoading(true);
    setMessage('Creating payment order...');

    try {
      console.log('Sending payment request:', formData);

      // Create order for both one-time and monthly donations
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

      // Open Razorpay popup immediately for all payments
      setMessage('Opening payment gateway...');
      await openRazorpayCheckout(data);

    } catch (error) {
      console.error('Payment initiation error:', error);
      setMessage(`Error: ${error.message}`);
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
              Loading payment gateway...
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
            <div className={`message ${
              message.includes('successful') || message.includes('activated') ? 'success' : 
              message.includes('Error') || message.includes('Failed') || message.includes('cancelled') ? 'error' : 
              'info'
            }`}>
              {message}
            </div>
          )}

          <div className="info-text">
            <p>
              {formData.frequency === 'Monthly' 
                ? 'Monthly donations help us plan better and have greater impact.'
                : 'Your one-time donation makes a difference.'
              }
            </p>
            <p>Secure payment powered by Razorpay</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;