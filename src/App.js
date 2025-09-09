import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Near the top of your App.js file
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001' 
  : 'https://donation-form-j142-git-stripe-tharunn-ks-projects.vercel.app';

// Icons as simple SVG components
const ArrowLeft = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7" />
  </svg>
);

const ArrowRight = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
  </svg>
);

const Heart = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const Lock = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const Loader2 = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const ShieldCheck = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const Shield = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const Building = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const CheckCircle = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
  </svg>
);

const Star = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" />
  </svg>
);

const Repeat = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

// Payment Method enumeration
const PaymentMethod = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe'
};

// Default donation amounts (INR)
const DEFAULT_DONATION_AMOUNTS = [42000, 12000, 2000];

// Country codes for phone validation
const COUNTRY_CODES = [
  { country: "India", code: "+91", flag: "🇮🇳" },
  { country: "United States", code: "+1", flag: "🇺🇸" },
  { country: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { country: "Canada", code: "+1", flag: "🇨🇦" },
  { country: "Australia", code: "+61", flag: "🇦🇺" },
  { country: "Germany", code: "+49", flag: "🇩🇪" },
  { country: "France", code: "+33", flag: "🇫🇷" },
  { country: "Japan", code: "+81", flag: "🇯🇵" },
  { country: "Singapore", code: "+65", flag: "🇸🇬" },
  { country: "UAE", code: "+971", flag: "🇦🇪" }
];

// Trust badges with premium design
const TRUST_BADGES = [
  {
    icon: ShieldCheck,
    title: "Bank-Level Security",
    description: "256-bit SSL encryption"
  },
  {
    icon: Shield,
    title: "Tax Benefits",
    description: "80G tax exemption"
  },
  {
    icon: Building,
    title: "Verified NGO",
    description: "Government registered"
  }
];

// Utility functions
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (phone, countryCode) => {
  if (!phone) return false;
  
  // Remove all non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Basic validation based on country code
  switch (countryCode) {
    case '+91': // India
      return cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone);
    case '+1': // US/Canada
      return cleanPhone.length === 10;
    case '+44': // UK
      return cleanPhone.length >= 10 && cleanPhone.length <= 11;
    default:
      return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  }
};

function CssChevronDown() {
  return (
    <div style={{
      width: '12px',
      height: '12px',
      border: '2px solid #9ca3af',
      borderTop: 'none',
      borderLeft: 'none',
      transform: 'rotate(45deg)',
      marginTop: '-2px'
    }} />
  );
}

// Main App component
function App() {
  // Form state - defaults to Indian citizen with INR
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: 12000, // Default middle amount
    localAmount: 12000,
    customAmount: "",
    name: "",
    email: "",
    phone: "",
    isAnonymous: false,
    country: "India",
    countryCode: "+91",
    isIndian: true,
    address: '',
    city: '',
    state: '',
    pincode: '',
    panNumber: '',
    paymentMethod: PaymentMethod.RAZORPAY,
    selectedCurrency: 'INR',
    user_donated_currency: 'INR',
                      frequency: 'Monthly'
  });
  
  // UI state
  const [uiState, setUiState] = useState({
    isSubmitting: false,
    isCustomAmount: false,
    showCountryCodeDropdown: false,
    countryCodeSearchQuery: ''
  });
  
  // Other state
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [hasTouchedPhone, setHasTouchedPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState("");
  const [hasEmailTouched, setHasEmailTouched] = useState(false);

  // Load payment gateway scripts dynamically
  useEffect(() => {
    // Load Razorpay script
    const razorpayScript = document.createElement('script');
    razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
    razorpayScript.async = true;
    document.body.appendChild(razorpayScript);

    // Load Stripe script
    const stripeScript = document.createElement('script');
    stripeScript.src = 'https://js.stripe.com/v3/';
    stripeScript.async = true;
    stripeScript.onload = () => setStripeLoaded(true);
    document.body.appendChild(stripeScript);
  }, []);

  // Filter country codes based on search query
  const filteredCountryCodes = useMemo(() => {
    let filtered = [...COUNTRY_CODES];
    
    if (uiState.countryCodeSearchQuery && uiState.countryCodeSearchQuery.trim() !== '') {
      const query = uiState.countryCodeSearchQuery.toLowerCase().trim();
      filtered = filtered.filter(code => 
        code.country.toLowerCase().includes(query) || 
        code.code.replace('+', '').includes(query)
      );
    }
    
    return filtered;
  }, [uiState.countryCodeSearchQuery]);

  // Check if required fields for step 2 are filled
  const areStep2FieldsFilled = useCallback(() => {
    if (!formData.name || !formData.phone) return false;
    if (!formData.address || !formData.city || !formData.state || !formData.pincode) return false;
    
    // Email is required for monthly donations
    if (formData.frequency === 'Monthly' && (!formData.email || !isValidEmail(formData.email))) return false;
    if (hasEmailTouched && formData.email && !isValidEmail(formData.email)) return false;
    
    return true;
  }, [
    formData.name, 
    formData.email, 
    formData.phone, 
    formData.address, 
    formData.city, 
    formData.state, 
    formData.pincode,
    formData.frequency,
    hasEmailTouched
  ]);

  // Event handlers
  const handleAmountSelect = useCallback((amount) => {
    setFormData(prev => ({ 
      ...prev, 
      amount: amount,
      localAmount: amount,
      customAmount: ""
    }));
    setUiState(prev => ({ ...prev, isCustomAmount: false }));
  }, []);

  const handleCustomAmount = useCallback((value) => {
    setFormData(prev => ({ 
      ...prev, 
      customAmount: value
    }));
    
    if (value) {
      setUiState(prev => ({ ...prev, isCustomAmount: true }));
      
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue >= 0) {
        const roundedAmount = Math.round(numValue);
        
        setFormData(prev => ({
          ...prev,
          localAmount: roundedAmount,
          amount: roundedAmount
        }));
      }
    } else {
      setUiState(prev => ({ ...prev, isCustomAmount: false }));
      setFormData(prev => ({ 
        ...prev, 
        amount: 0,
        localAmount: 0
      }));
    }
  }, []);

  const handleFormFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handlePhoneChange = useCallback((e) => {
    const value = e.target.value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, phone: value }));
    setHasTouchedPhone(true);
    setPhoneError(validatePhoneNumber(value, formData.countryCode) ? '' : 'Invalid phone number');
  }, [formData.countryCode]);

  const handleEmailChange = useCallback((e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, email: value }));
    setHasEmailTouched(true);
    
    if (formData.frequency === 'Monthly') {
      if (!value) {
        setEmailError("Email is required for monthly donations");
      } else if (!isValidEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    } else {
      if (value && !isValidEmail(value)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    }
  }, [formData.frequency]);

  const handleEmailBlur = useCallback(() => {
    setHasEmailTouched(true);
    if (formData.frequency === 'Monthly') {
      if (!formData.email) {
        setEmailError("Email is required for monthly donations");
      } else if (!isValidEmail(formData.email)) {
        setEmailError("Please enter a valid email address");
      }
    } else if (formData.email && !isValidEmail(formData.email)) {
      setEmailError("Please enter a valid email address");
    }
  }, [formData.email, formData.frequency]);

  const handlePincodeChange = useCallback((e) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    if (numericValue.length <= 6) {
      setFormData(prev => ({ ...prev, pincode: numericValue }));
    }
  }, []);

  const handlePanNumberChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }));
  }, []);

  const handleAnonymousToggle = useCallback((checked) => {
    setFormData(prev => ({ ...prev, isAnonymous: checked }));
  }, []);

  // Handle frequency selection
  const handleFrequencyChange = useCallback((frequency) => {
    setFormData(prev => ({ ...prev, frequency }));
    
    // If switching to monthly, ensure email validation
    if (frequency === 'Monthly' && hasEmailTouched) {
      if (!formData.email) {
        setEmailError("Email is required for monthly donations");
      } else if (!isValidEmail(formData.email)) {
        setEmailError("Please enter a valid email address");
      } else {
        setEmailError("");
      }
    } else if (frequency === 'One-time') {
      // Clear email error if switching to one-time (email becomes optional)
      if (formData.email && isValidEmail(formData.email)) {
        setEmailError("");
      } else if (formData.email && !isValidEmail(formData.email)) {
        setEmailError("Please enter a valid email address");
      } else if (!formData.email) {
        setEmailError("");
      }
    }
  }, [formData.email, hasEmailTouched]);

  // Toggle dropdown visibility
  const toggleCountryCodeDropdown = useCallback((e) => {
    e.preventDefault();
    const newState = !uiState.showCountryCodeDropdown;
    
    setUiState(prev => ({
      ...prev,
      showCountryCodeDropdown: newState,
      countryCodeSearchQuery: ''
    }));
  }, [uiState.showCountryCodeDropdown]);

  const selectCountryCode = useCallback((countryCode) => {
    setFormData(prev => ({
      ...prev, 
      countryCode: countryCode.code
    }));
    setUiState(prev => ({
      ...prev,
      showCountryCodeDropdown: false,
      countryCodeSearchQuery: ''
    }));
  }, []);

  // Navigate to next step
  const handleNext = useCallback(() => {
    if (currentStep === 1 && formData.amount > 0) {
      setCurrentStep(2);
    }
  }, [currentStep, formData.amount]);

  // Navigate back
  const handleBack = useCallback(() => {
    if (currentStep === 2) {
      setCurrentStep(1);
    }
  }, [currentStep]);

  // Form validation for submission
  const validateForm = useCallback(() => {
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

    const isPhoneValid = validatePhoneNumber(formData.phone, formData.countryCode);
    if (!isPhoneValid) {
      setMessage('Please enter a valid phone number');
      return false;
    }

    return true;
  }, [formData]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    if (uiState.isSubmitting) return;
    
    if (!validateForm()) return;
    
    if (!areStep2FieldsFilled()) {
      setMessage('Please fill in all required fields.');
      return;
    }
    
    setUiState(prev => ({ ...prev, isSubmitting: true }));
    setMessage('Processing your donation...');
    
    // Since we're defaulting to Indian/INR, use Razorpay
    try {
      console.log('Sending payment request:', formData);

      const response = await fetch(`${API_BASE_URL}/api/create-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: formData.amount,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          currency: 'INR',
          frequency: formData.frequency
        })
      });

      const data = await response.json();
      console.log('Payment response:', data);

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to process payment');
      }

      // Handle different response types properly
      if (data.type === 'subscription') {
        // For subscriptions, use Razorpay popup with subscription_id
        const subscriptionOptions = {
          key: 'rzp_test_4nEyceM4GUQmPk',
          subscription_id: data.subscription_id,
          amount: data.amount,
          currency: data.currency,
          name: 'Your Organization',
          description: `Monthly Donation - ₹${formData.amount}`,
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
            setMessage('Monthly subscription activated successfully! Thank you for your recurring donation.');
            setUiState(prev => ({ ...prev, isSubmitting: false }));
            
            // Reset form after successful payment
            setTimeout(() => {
              setFormData({
                amount: 12000,
                localAmount: 12000,
                customAmount: "",
                name: "",
                email: "",
                phone: "",
                isAnonymous: false,
                country: "India",
                countryCode: "+91",
                isIndian: true,
                address: '',
                city: '',
                state: '',
                pincode: '',
                panNumber: '',
                paymentMethod: PaymentMethod.RAZORPAY,
                selectedCurrency: 'INR',
                user_donated_currency: 'INR',
                frequency: 'One-time'
              });
              setCurrentStep(1);
              setMessage('');
            }, 3000);
          },
          modal: {
            ondismiss: function() {
              setMessage('Subscription payment cancelled');
              setUiState(prev => ({ ...prev, isSubmitting: false }));
            }
          }
        };

        console.log('Opening Razorpay subscription with options:', subscriptionOptions);
        const rzpSubscription = new window.Razorpay(subscriptionOptions);
        rzpSubscription.open();

      } else if (data.type === 'order' || data.type === 'order_with_recurring_intent') {
        // For regular orders, use Razorpay popup
        const options = {
          key: 'rzp_test_4nEyceM4GUQmPk',
          amount: data.amount,
          currency: data.currency,
          name: 'Your Organization',
          description: formData.frequency === 'Monthly' ? 
            `Monthly Donation - ₹${formData.amount}` : 
            `Donation - ₹${formData.amount}`,
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
            const successMessage = formData.frequency === 'Monthly' ? 
              'Monthly donation processed successfully! We will set up recurring payments.' :
              'Thank you for your generous donation!';
            setMessage(successMessage);
            setUiState(prev => ({ ...prev, isSubmitting: false }));
            
            // Reset form after successful payment
            setTimeout(() => {
              setFormData({
                amount: 12000,
                localAmount: 12000,
                customAmount: "",
                name: "",
                email: "",
                phone: "",
                isAnonymous: false,
                country: "India",
                countryCode: "+91",
                isIndian: true,
                address: '',
                city: '',
                state: '',
                pincode: '',
                panNumber: '',
                paymentMethod: PaymentMethod.RAZORPAY,
                selectedCurrency: 'INR',
                user_donated_currency: 'INR',
                frequency: 'One-time'
              });
              setCurrentStep(1);
              setMessage('');
            }, 3000);
          },
          modal: {
            ondismiss: function() {
              setMessage('Payment cancelled');
              setUiState(prev => ({ ...prev, isSubmitting: false }));
            }
          }
        };

        console.log('Opening Razorpay with options:', options);
        const rzp = new window.Razorpay(options);
        rzp.open();

      } else {
        throw new Error('Unexpected response type from server');
      }

    } catch (error) {
      console.error('Razorpay payment error:', error);
      setMessage(`Error: ${error.message}`);
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formData, areStep2FieldsFilled, uiState.isSubmitting, validateForm]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (uiState.showCountryCodeDropdown) {
        const dropdown = document.querySelector('.country-code-dropdown-container');
        if (dropdown && !dropdown.contains(event.target)) {
          setUiState(prev => ({
            ...prev,
            showCountryCodeDropdown: false,
            countryCodeSearchQuery: ''
          }));
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [uiState.showCountryCodeDropdown]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '500px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '24px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}>
        
        {/* Step 1: Amount and Frequency Selection */}
        {currentStep === 1 && (
          <div>
            {/* Header */}
            <div style={{
              background: 'linear-gradient(to right, #f59e0b, #f97316)',
              color: 'white',
              padding: '24px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'rgba(255,255,255,0.2)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Heart style={{ height: '32px', width: '32px', color: 'white' }} />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
                Support Our Cause
              </h1>
              <p style={{ fontSize: '16px', opacity: '0.9', margin: 0 }}>
                Your donation makes a meaningful difference
              </p>
            </div>

            <div style={{ padding: '24px' }}>
              {/* Payment Method Header */}
              <div style={{
                background: 'linear-gradient(to right, #f59e0b, #f97316)',
                color: 'white',
                padding: '16px',
                borderRadius: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: '12px'
                  }}>
                    <span style={{ fontWeight: 'bold', fontSize: '18px' }}>₹</span>
                  </div>
                  <div>
                    <p style={{
                      fontWeight: 'bold',
                      fontSize: '14px',
                      marginBottom: '2px',
                      margin: 0
                    }}>
                      Indian Citizen - INR Payment
                    </p>
                    <p style={{
                      fontSize: '12px',
                      opacity: '0.8',
                      margin: 0
                    }}>
                      Secure payment via Razorpay in INR
                    </p>
                  </div>
                </div>
              </div>

              {/* Frequency Selection */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Donation Type
                  </h2>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    Choose your preferred donation frequency
                  </p>
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  <button
                    type="button"
                    onClick={() => handleFrequencyChange('One-time')}
                    style={{
                      flex: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: formData.frequency === 'One-time' ? '2px solid #f59e0b' : '1px solid #e5e7eb',
                      backgroundColor: formData.frequency === 'One-time' ? '#fef3c7' : 'white',
                      color: formData.frequency === 'One-time' ? '#d97706' : '#374151',
                      cursor: 'pointer',
                      fontWeight: formData.frequency === 'One-time' ? 'bold' : 'normal',
                      fontSize: '14px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Heart style={{ height: '16px', width: '16px', marginRight: '8px' }} />
                    One-time
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleFrequencyChange('Monthly')}
                    style={{
                      flex: '1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: formData.frequency === 'Monthly' ? '2px solid #10b981' : '1px solid #e5e7eb',
                      backgroundColor: formData.frequency === 'Monthly' ? '#d1fae5' : 'white',
                      color: formData.frequency === 'Monthly' ? '#047857' : '#374151',
                      cursor: 'pointer',
                      fontWeight: formData.frequency === 'Monthly' ? 'bold' : 'normal',
                      fontSize: '14px',
                      transition: 'all 0.2s ease',
                      position: 'relative'
                    }}
                  >
                    <Repeat style={{ height: '16px', width: '16px', marginRight: '8px' }} />
                    Monthly
                    {formData.frequency === 'Monthly' && (
                      <div style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        backgroundColor: '#10b981',
                        fontSize: '10px',
                        fontWeight: 'bold',
                        padding: '2px 6px',
                        borderRadius: '20px',
                        color: 'white'
                      }}>
                        Recurring
                      </div>
                    )}
                  </button>
                </div>
                
                {formData.frequency === 'Monthly' && (
                  <div style={{
                    backgroundColor: '#d1fae5',
                    borderRadius: '8px',
                    padding: '12px',
                    border: '1px solid #a7f3d0'
                  }}>
                    <p style={{
                      fontSize: '12px',
                      color: '#047857',
                      margin: '0',
                      textAlign: 'center'
                    }}>
                      Monthly donations help us plan better and have greater impact. You can cancel anytime.
                    </p>
                  </div>
                )}
              </div>

              {/* Amount Selection */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Choose Your Donation Amount
                  </h2>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    {formData.frequency === 'Monthly' 
                      ? 'Every contribution makes a recurring difference' 
                      : 'Every contribution makes a meaningful difference'}
                  </p>
                </div>
                
                {/* Amount buttons */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px',
                  marginBottom: '16px'
                }}>
                  {DEFAULT_DONATION_AMOUNTS.map((amount, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleAmountSelect(amount)}
                      style={{
                        position: 'relative',
                        padding: '16px 12px',
                        borderRadius: '12px',
                        border: Math.round(Number(formData.localAmount)) === Math.round(Number(amount)) && !uiState.isCustomAmount
                          ? '2px solid #f59e0b'
                          : '1px solid #e5e7eb',
                        backgroundColor: Math.round(Number(formData.localAmount)) === Math.round(Number(amount)) && !uiState.isCustomAmount
                          ? '#f59e0b'
                          : 'white',
                        color: Math.round(Number(formData.localAmount)) === Math.round(Number(amount)) && !uiState.isCustomAmount
                          ? 'white'
                          : '#374151',
                        cursor: 'pointer',
                        fontWeight: 'bold',
                        fontSize: '16px',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {index === 1 && (
                        <div style={{
                          position: 'absolute',
                          top: '-4px',
                          left: '0',
                          right: '0',
                          display: 'flex',
                          justifyContent: 'center'
                        }}>
                          <span style={{
                            backgroundColor: '#10b981',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            padding: '2px 8px',
                            borderRadius: '20px',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            <Star style={{ height: '10px', width: '10px' }} />
                            Popular
                          </span>
                        </div>
                      )}
                      <div style={{ marginBottom: '4px' }}>
                        ₹{Math.round(Number(amount)).toLocaleString()}
                      </div>
                      {formData.frequency === 'Monthly' && (
                        <div style={{ fontSize: '10px', opacity: '0.8' }}>
                          per month
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                {/* Custom Amount Input */}
                <div style={{ position: 'relative' }}>
                  <input
                    type="number"
                    value={formData.customAmount}
                    onChange={(e) => handleCustomAmount(e.target.value)}
                    placeholder={`Enter custom amount ${formData.frequency === 'Monthly' ? '(per month)' : ''}`}
                    min="1"
                    step="1"
                    style={{
                      width: '100%',
                      paddingLeft: '48px',
                      paddingRight: '60px',
                      paddingTop: '12px',
                      paddingBottom: '12px',
                      borderRadius: '12px',
                      border: uiState.isCustomAmount 
                        ? '2px solid #f59e0b' 
                        : '2px solid #e5e7eb',
                      backgroundColor: uiState.isCustomAmount ? '#fef3c7' : 'white',
                      fontSize: '16px',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6b7280',
                    fontWeight: 'bold',
                    pointerEvents: 'none'
                  }}>
                    ₹
                  </div>
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#9ca3af',
                    fontSize: '14px',
                    pointerEvents: 'none'
                  }}>
                    INR
                  </div>
                </div>
              </div>

              {/* Next Button */}
              <button
                type="button"
                onClick={handleNext}
                disabled={!formData.amount || formData.amount <= 0}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '16px 24px',
                  borderRadius: '12px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: formData.amount && formData.amount > 0 ? 'pointer' : 'not-allowed',
                  backgroundColor: formData.amount && formData.amount > 0
                    ? (formData.frequency === 'Monthly' ? '#10b981' : '#f59e0b')
                    : '#e5e7eb',
                  color: formData.amount && formData.amount > 0
                    ? 'white'
                    : '#9ca3af',
                  transition: 'all 0.2s ease'
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center' }}>
                  Continue to Details
                  <ArrowRight style={{ height: '20px', width: '20px', marginLeft: '12px' }} />
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Personal Details */}
        {currentStep === 2 && (
          <div>
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '24px 24px 0',
              borderBottom: '1px solid #e5e7eb',
              paddingBottom: '16px',
              marginBottom: '24px'
            }}>
              <button
                onClick={handleBack}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  color: '#3b82f6',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                <ArrowLeft style={{ height: '16px', width: '16px', marginRight: '8px' }} />
                Back to Payment Gateway
              </button>
            </div>

            <div style={{ padding: '0 24px 24px' }}>
              {/* Amount Summary */}
              <div style={{
                background: 'linear-gradient(to right, #f59e0b, #f97316)',
                color: 'white',
                padding: '16px',
                borderRadius: '16px',
                marginBottom: '24px'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      {formData.frequency === 'Monthly' ? (
                        <Repeat style={{ height: '16px', width: '16px' }} />
                      ) : (
                        <Heart style={{ height: '16px', width: '16px' }} />
                      )}
                    </div>
                    <div>
                      <p style={{
                        fontWeight: 'bold',
                        fontSize: '16px',
                        marginBottom: '2px',
                        margin: 0
                      }}>
                        ₹{Math.round(formData.localAmount).toLocaleString()} {formData.frequency === 'Monthly' && '/month'}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        opacity: '0.8',
                        margin: 0
                      }}>
                        {formData.frequency} Donation
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Details */}
              <div style={{ marginBottom: '24px' }}>
                <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                  <h2 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Your Details
                  </h2>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '14px'
                  }}>
                    We'll use this information for your donation receipt
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Name */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Full Name <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleFormFieldChange('name', e.target.value)}
                      placeholder="Enter your full name"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '2px solid #e5e7eb',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>
                  
                  {/* Phone Number */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Mobile Number <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {/* Country Code Dropdown */}
                      <div className="country-code-dropdown-container" style={{ position: 'relative', width: '80px', flexShrink: '0' }}>
                        <button
                          type="button"
                          onClick={toggleCountryCodeDropdown}
                          style={{
                            width: '100%',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '0 8px',
                            borderRadius: '12px',
                            border: '2px solid #e5e7eb',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: '600'
                          }}
                        >
                          {formData.countryCode}
                        </button>
                        
                        {uiState.showCountryCodeDropdown && (
                          <div style={{
                            position: 'absolute',
                            zIndex: '30',
                            marginTop: '8px',
                            width: '256px',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e5e7eb',
                            maxHeight: '192px',
                            overflowY: 'auto',
                            left: '0'
                          }}>
                            <div style={{
                              padding: '8px',
                              borderBottom: '1px solid #e5e7eb'
                            }}>
                              <input
                                type="text"
                                value={uiState.countryCodeSearchQuery}
                                onChange={(e) => setUiState(prev => ({ ...prev, countryCodeSearchQuery: e.target.value }))}
                                placeholder="Search country..."
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                  fontSize: '14px',
                                  boxSizing: 'border-box'
                                }}
                              />
                            </div>
                            <div style={{ padding: '4px' }}>
                              {filteredCountryCodes.map((countryCode) => (
                                <button
                                  key={countryCode.code + countryCode.country}
                                  type="button"
                                  onClick={() => selectCountryCode(countryCode)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    padding: '8px 12px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    borderRadius: '6px'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                  <span style={{ marginRight: '8px', fontSize: '16px' }}>{countryCode.flag}</span>
                                  <span style={{ fontSize: '12px', color: '#6b7280', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{countryCode.country}</span>
                                  <span style={{ marginLeft: 'auto', fontWeight: '600', color: '#374151', fontSize: '12px' }}>{countryCode.code}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* Phone Input */}
                      <div style={{ flex: '1', minWidth: '0' }}>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={handlePhoneChange}
                          placeholder="Enter your mobile number"
                          style={{
                            width: '100%',
                            height: '48px',
                            padding: '0 16px',
                            borderRadius: '12px',
                            border: hasTouchedPhone && phoneError
                              ? '2px solid #ef4444'
                              : '2px solid #e5e7eb',
                            fontSize: '16px',
                            outline: 'none',
                            boxSizing: 'border-box'
                          }}
                          required
                        />
                      </div>
                    </div>
                    {hasTouchedPhone && phoneError && (
                      <p style={{
                        fontSize: '12px',
                        color: '#ef4444',
                        marginTop: '4px'
                      }}>
                        {phoneError}
                      </p>
                    )}
                  </div>
                  
                  {/* Email */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Email Address {formData.frequency === 'Monthly' ? <span style={{ color: '#ef4444' }}>*</span> : '(Optional)'}
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={handleEmailChange}
                      onBlur={handleEmailBlur}
                      placeholder="Enter your email address"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: hasEmailTouched && emailError
                          ? '2px solid #ef4444'
                          : '2px solid #e5e7eb',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required={formData.frequency === 'Monthly'}
                    />
                    {hasEmailTouched && emailError && (
                      <p style={{
                        fontSize: '12px',
                        color: '#ef4444',
                        marginTop: '4px'
                      }}>
                        {emailError}
                      </p>
                    )}
                    {formData.frequency === 'Monthly' && (
                      <p style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginTop: '4px'
                      }}>
                        Email required for monthly subscription management
                      </p>
                    )}
                  </div>

                  {/* Address */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Address <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => handleFormFieldChange('address', e.target.value)}
                      placeholder="Enter your street address"
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '2px solid #e5e7eb',
                        fontSize: '16px',
                        outline: 'none',
                        resize: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>
                  
                  {/* City */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      City <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleFormFieldChange('city', e.target.value)}
                      placeholder="Enter your city"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '2px solid #e5e7eb',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>
                  
                  {/* State */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      State <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleFormFieldChange('state', e.target.value)}
                      placeholder="Enter your state"
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '2px solid #e5e7eb',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>
                  
                  {/* Pincode */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      Pin Code <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={handlePincodeChange}
                      placeholder="eg : 110001"
                      maxLength={6}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '2px solid #e5e7eb',
                        fontSize: '16px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      required
                    />
                  </div>

                  {/* PAN Number */}
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151',
                      marginBottom: '6px'
                    }}>
                      PAN Number (If you want to avail 80G tax exemption, please provide PAN )
                    </label>
                    <input
                      type="text"
                      value={formData.panNumber}
                      placeholder="ENTER PAN NUMBER (E.G., ABCTY1234D)"
                      onChange={handlePanNumberChange}
                      maxLength={10}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        border: '2px solid #e5e7eb',
                        fontSize: '16px',
                        outline: 'none',
                        textTransform: 'uppercase',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  {/* Anonymous Donation Checkbox */}
                  <div style={{ marginTop: '16px' }}>
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      cursor: 'pointer'
                    }}>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type="checkbox" 
                          checked={formData.isAnonymous}
                          onChange={(e) => handleAnonymousToggle(e.target.checked)}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '4px',
                          border: '2px solid ' + (formData.isAnonymous ? '#3b82f6' : '#d1d5db'),
                          backgroundColor: formData.isAnonymous ? '#3b82f6' : 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          {formData.isAnonymous && (
                            <CheckCircle style={{ height: '16px', width: '16px', color: 'white' }} />
                          )}
                        </div>
                      </div>
                      <span style={{
                        marginLeft: '12px',
                        fontSize: '14px',
                        color: '#374151'
                      }}>
                        Make my donation anonymous ( your name won't be displayed publicly )
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Donate Button */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!areStep2FieldsFilled() || uiState.isSubmitting}
                style={{
                  width: '80%', // smaller width
                  maxWidth: '280px', // limit max width
                  minWidth: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px 16px', // smaller padding
                  borderRadius: '10px', // slightly smaller radius
                  fontSize: '15px', // smaller font
                  fontWeight: 'bold',
                  border: 'none',
                  cursor: areStep2FieldsFilled() && !uiState.isSubmitting ? 'pointer' : 'not-allowed',
                  backgroundColor: areStep2FieldsFilled() && !uiState.isSubmitting
                    ? (formData.frequency === 'Monthly' ? '#10b981' : '#f59e0b')
                    : '#e5e7eb',
                  color: areStep2FieldsFilled() && !uiState.isSubmitting
                    ? 'white'
                    : '#9ca3af',
                  margin: '12px auto 16px auto', // center and reduce margin
                  transition: 'all 0.2s ease'
                }}
              >
             
                {uiState.isSubmitting ? (
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <Loader2 style={{ animation: 'spin 1s linear infinite', height: '20px', width: '20px', marginRight: '12px' }} />
                    Processing...
                  </div>
                ) : (
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {formData.frequency === 'Monthly' ? (
                      <Repeat style={{ height: '16px', width: '16px', marginRight: '8px' }} />
                    ) : (
                      <Heart style={{ height: '16px', width: '16px', marginRight: '8px' }} />
                    )}
                    {formData.frequency === 'Monthly' ? 'Start Monthly Donation' : 'Donate'} ₹{Math.round(formData.localAmount).toLocaleString()}
                    {formData.frequency === 'Monthly' && <span style={{ fontSize: '14px', marginLeft: '4px', opacity: '0.8' }}>/month</span>}
                  </span>
                )}
              </button>

              {/* Security Notice */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <div style={{
                  backgroundColor: '#f3f4f6',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '14px',
                  color: '#374151'
                }}>
                  <Lock style={{ height: '16px', width: '16px', marginRight: '8px', color: '#10b981' }} />
                  <span style={{ marginRight: '8px' }}>Secure payment powered by</span>
                  <span style={{ backgroundColor: '#6366f1', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Razorpay</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                {TRUST_BADGES.map((badge, index) => (
                  <div key={index} style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    padding: '12px',
                    textAlign: 'center',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #f3f4f6'
                  }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px'
                    }}>
                      <badge.icon style={{ height: '16px', width: '16px', color: '#f59e0b' }} />
                    </div>
                    <h4 style={{
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: '#374151',
                      marginBottom: '2px'
                    }}>
                      {badge.title}
                    </h4>
                    <p style={{
                      fontSize: '10px',
                      color: '#6b7280'
                    }}>
                      {badge.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div style={{
            margin: '16px 24px',
            padding: '12px 16px',
            borderRadius: '12px',
            textAlign: 'center',
            fontSize: '14px',
            fontWeight: '500',
            ...(message.includes('successful') || message.includes('Thank you') || message.includes('activated')
              ? { backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }
              : message.includes('Error') || message.includes('cancelled') 
              ? { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }
              : { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' })
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
    
export default App;