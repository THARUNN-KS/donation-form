import React, { useState } from 'react';
import './App.css';

const scriptURL = "https://checkout.razorpay.com/v1/checkout.js";

const App = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    frequency: 'One-time',
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const predefinedAmounts = [1000, 2000, 5000, 10000, 25000, 50000];

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError('');
  };

  // Handle amount selection
  const handleAmountSelect = (amount) => {
    setFormData(prev => ({
      ...prev,
      amount: amount.toString()
    }));
  };

  // Validate current step
  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
          setError('Please select or enter a donation amount');
          return false;
        }
        if (parseFloat(formData.amount) < 100) {
          setError('Minimum donation amount is ₹100');
          return false;
        }
        return true;
      case 2:
        if (!formData.name.trim()) {
          setError('Full Name is required');
          return false;
        }
        if (!formData.email.trim()) {
          setError('Email Address is required');
          return false;
        }
        // Email is required for monthly subscriptions
        if (formData.frequency === 'Monthly' && !formData.email.trim()) {
          setError('Email is required for monthly donations');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  // Go to next step
  const nextStep = () => {
    setError('');
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
    }
  };

  // Go to previous step
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
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

  // Handle donation submission
  const handleDonation = async () => {
    setLoading(true);
    setError('');

    try {
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
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: formData.amount,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          frequency: formData.frequency
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const paymentData = await response.json();
      console.log('Payment data received:', paymentData);

      if (paymentData.type === 'subscription') {
        // Handle TRUE subscription
        const options = {
          key: 'rzp_test_4nEyceM4GUQmPk',
          subscription_id: paymentData.subscription_id,
          name: 'Monthly Donation Subscription',
          description: `Monthly recurring donation of ₹${formData.amount}`,
          handler: function (response) {
            handleSubscriptionSuccess(response);
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#3B82F6",
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();

      } else {
        // Handle one-time payment (including monthly fallback)
        const isMonthlyFallback = paymentData.is_monthly || paymentData.fallback;
        
        const options = {
          key: 'rzp_test_4nEyceM4GUQmPk',
          amount: paymentData.amount,
          currency: paymentData.currency,
          order_id: paymentData.id,
          name: isMonthlyFallback ? 'Monthly Donation Setup' : 'One-time Donation',
          description: isMonthlyFallback 
            ? `Setting up monthly donation of ₹${formData.amount}` 
            : 'Thank you for your generous donation!',
          handler: function (response) {
            handlePaymentSuccess(response, isMonthlyFallback);
          },
          prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone,
          },
          theme: {
            color: "#3B82F6",
          },
          modal: {
            ondismiss: function() {
              setLoading(false);
            }
          }
        };

        const razorpay = new window.Razorpay(options);
        razorpay.open();
      }

    } catch (error) {
      throw error;
    }
  };

  // Handle successful subscription
  const handleSubscriptionSuccess = (response) => {
    console.log('Subscription successful:', response);
    alert(`🎉 Thank you ${formData.name}! Your monthly subscription of ₹${formData.amount} has been activated successfully! You will be charged monthly automatically.`);
    
    // Reset form
    setFormData({
      amount: '',
      frequency: 'One-time',
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: ''
    });
    setCurrentStep(1);
    setLoading(false);
  };

  // Handle successful payment (one-time and monthly fallback)
  const handlePaymentSuccess = (response, isMonthlyFallback = false) => {
    console.log('Payment successful:', response);
    
    const message = isMonthlyFallback 
      ? `🎉 Thank you ${formData.name}! Your monthly donation of ₹${formData.amount} has been set up successfully! We'll process your recurring donations monthly.`
      : `🎉 Thank you ${formData.name}! Your donation of ₹${formData.amount} has been received successfully!`;
    
    alert(message);
    
    // Reset form
    setFormData({
      amount: '',
      frequency: 'One-time',
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: ''
    });
    setCurrentStep(1);
    setLoading(false);
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3].map(step => (
        <div 
          key={step}
          className={`step-circle ${currentStep === step ? 'active' : currentStep > step ? 'completed' : ''}`}
        >
          {step}
        </div>
      ))}
    </div>
  );

  // Render Step 1: Amount Selection
  const renderStep1 = () => (
    <div className="step-content">
      <div className="amount-grid">
        {predefinedAmounts.map(amount => (
          <button
            key={amount}
            type="button"
            className={`amount-btn ${formData.amount === amount.toString() ? 'selected' : ''}`}
            onClick={() => handleAmountSelect(amount)}
          >
            ₹{amount.toLocaleString()}
          </button>
        ))}
      </div>
      
      <div className="custom-amount">
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleInputChange}
          placeholder="Enter custom amount"
          className="amount-input"
          min="100"
        />
      </div>

      <div className="currency-section">
        <label>Currency</label>
        <div className="currency-dropdown">
          <select disabled>
            <option>Indian Rupee (₹)</option>
          </select>
        </div>
      </div>

      <div className="frequency-section">
        <label>Donation Frequency</label>
        <div className="frequency-toggle">
          <button
            type="button"
            className={`frequency-btn ${formData.frequency === 'One-time' ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, frequency: 'One-time' }))}
          >
            One-time
          </button>
          <button
            type="button"
            className={`frequency-btn ${formData.frequency === 'Monthly' ? 'active' : ''}`}
            onClick={() => setFormData(prev => ({ ...prev, frequency: 'Monthly' }))}
          >
            Monthly
          </button>
        </div>
        {formData.frequency === 'Monthly' && (
          <div className="impact-badge">Recurring Donation</div>
        )}
      </div>
    </div>
  );

  // Render Step 2: Personal Information
  const renderStep2 = () => (
    <div className="step-content">
      <div className="form-grid">
        <div className="form-group full-width">
          <label>Full Name*</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Email Address*</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Phone Number</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-group full-width">
          <label>Address</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-group">
          <label>City</label>
          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-group">
          <label>Country*</label>
          <select 
            name="country"
            value={formData.country}
            onChange={handleInputChange}
          >
            <option value="">Select Country</option>
            <option value="IN">India</option>
            <option value="US">United States</option>
            <option value="UK">United Kingdom</option>
            <option value="CA">Canada</option>
            <option value="AU">Australia</option>
          </select>
        </div>
      </div>
    </div>
  );

  // Render Step 3: Confirmation
  const renderStep3 = () => (
    <div className="step-content">
      <h2>Confirm Your Donation</h2>
      <div className="confirmation-details">
        <div className="detail-item">
          <span className="label">Donation Amount:</span>
          <span className="value">₹{parseFloat(formData.amount).toLocaleString()}</span>
        </div>
        <div className="detail-item">
          <span className="label">Frequency:</span>
          <span className="value">{formData.frequency}</span>
        </div>
        <div className="detail-item">
          <span className="label">Name:</span>
          <span className="value">{formData.name}</span>
        </div>
        <div className="detail-item">
          <span className="label">Email:</span>
          <span className="value">{formData.email}</span>
        </div>
        {formData.frequency === 'Monthly' && (
          <div style={{marginTop: '16px', padding: '12px', backgroundColor: '#EFF6FF', borderRadius: '8px', fontSize: '14px', color: '#1E40AF'}}>
            <strong>Monthly Donation:</strong> We'll attempt to create a recurring subscription. If that fails, we'll process this as a one-time donation and set up manual recurring payments.
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="App">
      <div className="donation-modal">
        <div className="modal-header">
          <span className="donation-icon">🤝</span>
          <h1>Embedded Form</h1>
        </div>

        {renderStepIndicator()}

        {error && <div className="error-message">{error}</div>}

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}

        <div className="modal-actions">
          {currentStep > 1 && (
            <button type="button" className="back-btn" onClick={prevStep}>
              ← Back
            </button>
          )}
          
          {currentStep < 3 ? (
            <button type="button" className="continue-btn" onClick={nextStep}>
              Continue →
            </button>
          ) : (
            <button 
              type="button" 
              className="donate-btn" 
              onClick={handleDonation}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Donate Now'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;