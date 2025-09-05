import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    customAmount: '',
    currency: 'INR',
    frequency: 'One-time',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Preset amount options
  const presetAmounts = ['1000', '2000', '5000', '10000', '25000', '50000'];
  
  // Currency options
  const currencies = [
    { value: 'INR', label: 'Indian Rupee (₹)', symbol: '₹' },
    { value: 'USD', label: 'US Dollar ($)', symbol: '$' },
    { value: 'EUR', label: 'Euro (€)', symbol: '€' },
    { value: 'GBP', label: 'British Pound (£)', symbol: '£' }
  ];

  // Countries list (simplified)
  const countries = [
    'India', 'United States', 'United Kingdom', 'Canada', 'Australia', 
    'Germany', 'France', 'Japan', 'Singapore', 'UAE', 'Other'
  ];

  // Load Razorpay script dynamically
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve, reject) => {
        if (window.Razorpay) {
          setRazorpayLoaded(true);
          resolve(true);
          return;
        }

        const existingScript = document.getElementById('razorpay-script');
        if (existingScript) {
          existingScript.onload = () => {
            setRazorpayLoaded(true);
            resolve(true);
          };
          return;
        }

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

    // Only load Razorpay for INR currency
    if (formData.currency === 'INR') {
      loadRazorpay().catch(error => {
        console.error('Razorpay loading error:', error);
        setMessage('❌ Failed to load payment gateway. Please refresh the page.');
      });
    }
  }, [formData.currency]);

  const handleAmountSelect = (amount) => {
    setFormData(prev => ({ 
      ...prev, 
      amount: amount,
      customAmount: '' 
    }));
  };

  const handleCustomAmount = (value) => {
    setFormData(prev => ({ 
      ...prev, 
      customAmount: value,
      amount: value 
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getCurrentAmount = () => {
    return formData.customAmount || formData.amount;
  };

  const getCurrentCurrencySymbol = () => {
    const currency = currencies.find(c => c.value === formData.currency);
    return currency ? currency.symbol : '₹';
  };

  const validateStep = (stepNumber) => {
    switch (stepNumber) {
      case 1:
        if (!getCurrentAmount()) {
          setMessage('Please select or enter an amount');
          return false;
        }
        if (isNaN(getCurrentAmount()) || parseFloat(getCurrentAmount()) <= 0) {
          setMessage('Please enter a valid amount');
          return false;
        }
        break;
      case 2:
        if (!formData.name || !formData.email || !formData.country) {
          setMessage('Please fill in all required fields');
          return false;
        }
        if (formData.frequency === 'Monthly' && !formData.email) {
          setMessage('Email is required for monthly donations');
          return false;
        }
        break;
    }
    setMessage('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
    setMessage('');
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

  const openRazorpaySubscriptionCheckout = async (subscriptionData) => {
    try {
      await waitForRazorpay();

      const options = {
        key: 'rzp_test_NkZWk4SLJaXiCx',
        subscription_id: subscriptionData.subscription_id,
        name: 'Your Organization',
        description: `Monthly Subscription - ${getCurrentCurrencySymbol()}${getCurrentAmount()}`,
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#3399cc'
        },
        handler: function(response) {
          console.log('Subscription payment successful:', response);
          setMessage('✅ Monthly subscription activated successfully! Your recurring donations are now set up.');
          setIsLoading(false);
          
          // Reset form after successful payment
          setTimeout(() => {
            setStep(1);
            setFormData({
              amount: '',
              customAmount: '',
              currency: 'INR',
              frequency: 'One-time',
              name: '',
              email: '',
              phone: '',
              address: '',
              city: '',
              country: ''
            });
            setMessage('');
          }, 5000);
        },
        modal: {
          ondismiss: function() {
            setMessage('Subscription payment cancelled');
            setIsLoading(false);
          }
        }
      };

      console.log('Opening Razorpay subscription popup with options:', options);
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Razorpay subscription popup error:', error);
      setMessage(`❌ Payment gateway error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const openRazorpayCheckout = async (paymentData, isMonthly = false) => {
    try {
      await waitForRazorpay();

      const options = {
        key: 'rzp_test_NkZWk4SLJaXiCx',
        amount: paymentData.amount,
        currency: paymentData.currency,
        name: 'Your Organization',
        description: isMonthly ? 
          `Monthly Donation - ${getCurrentCurrencySymbol()}${getCurrentAmount()}` : 
          `Donation - ${getCurrentCurrencySymbol()}${getCurrentAmount()}`,
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
          
          // Reset form after successful payment
          setTimeout(() => {
            setStep(1);
            setFormData({
              amount: '',
              customAmount: '',
              currency: 'INR',
              frequency: 'One-time',
              name: '',
              email: '',
              phone: '',
              address: '',
              city: '',
              country: ''
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
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Razorpay initialization error:', error);
      setMessage(`❌ Payment gateway error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const handleStripePayment = async () => {
    // TODO: Implement Stripe payment for foreign currencies
    setMessage('💳 Stripe payment integration coming soon for foreign currencies!');
    setIsLoading(false);
  };

  const processDonation = async () => {
    if (!validateStep(2)) return;

    setIsLoading(true);
    setMessage('Processing your donation...');

    try {
      if (formData.currency === 'INR') {
        // Process with Razorpay
        console.log('Processing with Razorpay for INR');
        
        const paymentData = {
          amount: getCurrentAmount(),
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          frequency: formData.frequency
        };

        const response = await fetch('/api/create-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData)
        });

        const data = await response.json();
        console.log('Payment response:', data);

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Failed to process payment');
        }

        // Handle different response types
        if (data.type === 'subscription') {
          // For subscriptions, redirect to Razorpay's payment page
          if (data.short_url) {
            console.log('Redirecting to subscription payment:', data.short_url);
            setMessage('✅ Subscription created! Redirecting to payment page...');
            
            // Open payment page in the same window
            setTimeout(() => {
              window.location.href = data.short_url;
            }, 1500);
          } else {
            setMessage(`✅ Monthly subscription set up successfully! Subscription ID: ${data.subscription_id}`);
          }
          setIsLoading(false);
        } else if (data.type === 'order_with_recurring_intent') {
          console.log('Using fallback method for monthly donation');
          await openRazorpayCheckout(data, true);
        } else if (data.type === 'order') {
          await openRazorpayCheckout(data, false);
        } else {
          throw new Error('Unexpected response type from server');
        }

      } else {
        // Process with Stripe for foreign currencies
        console.log('Processing with Stripe for foreign currency');
        await handleStripePayment();
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      setMessage(`❌ Error: ${error.message}`);
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="step-content">
      <div className="step-indicator">
        <div className="step active">1</div>
        <div className="step">2</div>
        <div className="step">3</div>
      </div>

      <div className="amount-selection">
        <div className="preset-amounts">
          {presetAmounts.map(amount => (
            <button
              key={amount}
              className={`amount-btn ${formData.amount === amount && !formData.customAmount ? 'selected' : ''}`}
              onClick={() => handleAmountSelect(amount)}
            >
              {getCurrentCurrencySymbol()}{parseInt(amount).toLocaleString()}
            </button>
          ))}
        </div>

        <div className="custom-amount">
          <input
            type="number"
            placeholder="Enter custom amount"
            value={formData.customAmount}
            onChange={(e) => handleCustomAmount(e.target.value)}
            className="custom-amount-input"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Currency</label>
        <select
          value={formData.currency}
          onChange={(e) => handleInputChange('currency', e.target.value)}
          className="currency-select"
        >
          {currencies.map(currency => (
            <option key={currency.value} value={currency.value}>
              {currency.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Donation Frequency</label>
        <div className="frequency-buttons">
          <button
            type="button"
            className={formData.frequency === 'One-time' ? 'active' : ''}
            onClick={() => handleInputChange('frequency', 'One-time')}
          >
            One-time
          </button>
          <button
            type="button"
            className={formData.frequency === 'Monthly' ? 'active' : ''}
            onClick={() => handleInputChange('frequency', 'Monthly')}
          >
            Monthly
          </button>
        </div>
      </div>

      <button className="continue-btn" onClick={nextStep}>
        Continue →
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="step-content">
      <div className="step-indicator">
        <div className="step completed">1</div>
        <div className="step active">2</div>
        <div className="step">3</div>
      </div>

      <div className="form-row">
        <div className="form-group full-width">
          <label>Full Name*</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Email Address*</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Address</label>
        <input
          type="text"
          value={formData.address}
          onChange={(e) => handleInputChange('address', e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
          />
        </div>
        <div className="form-group">
          <label>Country*</label>
          <select
            value={formData.country}
            onChange={(e) => handleInputChange('country', e.target.value)}
            required
          >
            <option value="">Select Country</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="step-buttons">
        <button className="back-btn" onClick={prevStep}>
          ← Back
        </button>
        <button className="continue-btn" onClick={nextStep}>
          Continue →
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="step-content">
      <div className="step-indicator">
        <div className="step completed">1</div>
        <div className="step completed">2</div>
        <div className="step active">3</div>
      </div>

      <h3>Confirm Your Donation</h3>

      <div className="confirmation-details">
        <div className="detail-row">
          <span>Donation Amount:</span>
          <span className="amount">{getCurrentCurrencySymbol()}{parseInt(getCurrentAmount()).toLocaleString()}</span>
        </div>
        <div className="detail-row">
          <span>Frequency:</span>
          <span>{formData.frequency}</span>
        </div>
        <div className="detail-row">
          <span>Name:</span>
          <span>{formData.name}</span>
        </div>
        <div className="detail-row">
          <span>Email:</span>
          <span>{formData.email}</span>
        </div>
        {formData.currency !== 'INR' && (
          <div className="detail-row">
            <span>Currency:</span>
            <span>{formData.currency}</span>
          </div>
        )}
      </div>

      {formData.currency !== 'INR' && (
        <div className="stripe-notice">
          💳 Foreign currency payments will be processed via Stripe
        </div>
      )}

      <div className="step-buttons">
        <button className="back-btn" onClick={prevStep}>
          ← Back
        </button>
        <button 
          className="donate-btn"
          onClick={processDonation}
          disabled={isLoading || (formData.currency === 'INR' && !razorpayLoaded)}
        >
          {isLoading 
            ? 'Processing...' 
            : (formData.currency === 'INR' && !razorpayLoaded)
              ? 'Loading...' 
              : 'Donate Now'
          }
        </button>
      </div>
    </div>
  );

  return (
    <div className="App">
      <div className="donation-container">
        <div className="donation-form">
          <div className="form-header">
            <div className="emoji">🤝</div>
            <h2>Embedded Form</h2>
          </div>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}

          {message && (
            <div className={`message ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'}`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;