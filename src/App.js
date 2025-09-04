import React, { useState } from 'react';
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

  const initializePayment = async () => {
    if (!validateForm()) return;

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

      } else if (data.type === 'order_with_recurring_intent') {
        // Fallback: one-time order with monthly intent
        console.log('Using fallback method for monthly donation');
        
        const options = {
          key: 'rzp_test_NkZWk4SLJaXiCx', // Your Razorpay key
          amount: data.amount,
          currency: data.currency,
          name: 'Your Organization',
          description: `Monthly Donation - ₹${formData.amount}`,
          order_id: data.id,
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
            setMessage('✅ Monthly donation processed successfully! We will set up recurring payments for you.');
            setIsLoading(false);
          },
          modal: {
            ondismiss: function() {
              setMessage('Payment cancelled');
              setIsLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return; // Don't set loading to false here, let the handler do it

      } else if (data.type === 'order') {
        // Regular one-time donation
        const options = {
          key: 'rzp_test_NkZWk4SLJaXiCx', // Your Razorpay key
          amount: data.amount,
          currency: data.currency,
          name: 'Your Organization',
          description: `Donation - ₹${formData.amount}`,
          order_id: data.id,
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
            setMessage('✅ Thank you for your generous donation!');
            setIsLoading(false);
          },
          modal: {
            ondismiss: function() {
              setMessage('Payment cancelled');
              setIsLoading(false);
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        return; // Don't set loading to false here, let the handler do it

      } else {
        throw new Error('Unexpected response type from server');
      }

    } catch (error) {
      console.error('Payment initiation error:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="donation-container">
        <div className="donation-form">
          <h2>Make a Donation</h2>
          
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
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : `Donate ₹${formData.amount || '0'} ${formData.frequency}`}
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