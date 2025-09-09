import React, { useState, useEffect, useCallback, useMemo } from 'react';

// Near the top of your App.js file
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001' 
  : 'https://donation-form-j142-git-stripe-tharunn-ks-projects.vercel.app';

// --- SVG ICONS ---
const ArrowLeft = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);
const ArrowRight = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);
const Heart = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
  </svg>
);
const Lock = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);
const Loader2 = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4m-2.83 9.07l-2.83-2.83M7.76 7.76L4.93 4.93" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
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

// --- CONSTANTS AND CONFIG ---
const PaymentMethod = { RAZORPAY: 'razorpay', STRIPE: 'stripe' };
const DEFAULT_DONATION_AMOUNTS = [42000, 12000, 2000];
const COUNTRY_CODES = [
  { country: "India", code: "+91", flag: "🇮🇳" }, { country: "United States", code: "+1", flag: "🇺🇸" },
  { country: "United Kingdom", code: "+44", flag: "🇬🇧" }, { country: "Canada", code: "+1", flag: "🇨🇦" },
  { country: "Australia", code: "+61", flag: "🇦🇺" }, { country: "Germany", code: "+49", flag: "🇩🇪" },
  { country: "France", code: "+33", flag: "🇫🇷" }, { country: "Japan", code: "+81", flag: "🇯🇵" },
  { country: "Singapore", code: "+65", flag: "🇸🇬" }, { country: "UAE", code: "+971", flag: "🇦🇪" }
];
const TRUST_BADGES = [
  { icon: ShieldCheck, title: "Bank-Level Security", description: "256-bit SSL encryption" },
  { icon: Shield, title: "Tax Benefits", description: "80G tax exemption" },
  { icon: Building, title: "Verified NGO", description: "Government registered" }
];

// --- UTILITY FUNCTIONS ---
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhoneNumber = (phone, countryCode) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  switch (countryCode) {
    case '+91': return cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone);
    case '+1': return cleanPhone.length === 10;
    case '+44': return cleanPhone.length >= 10 && cleanPhone.length <= 11;
    default: return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  }
};

// --- RESPONSIVE HOOK ---
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: undefined,
    height: undefined,
  });
  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return windowSize;
};

// --- DESKTOP INFO PANEL COMPONENT ---
const LeftInfoPanel = () => {
    const PRIMARY_COLOR = '#4f46e5';
    const TEXT_COLOR_DARK = '#1f2937';
    const TEXT_COLOR_LIGHT = '#6b7280';

    return (
        <div style={{
            width: '380px',
            backgroundColor: '#f9fafb',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRight: '1px solid #e5e7eb'
        }}>
            <div>
              <div style={{ width: '64px', height: '64px', backgroundColor: PRIMARY_COLOR, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                  <Heart style={{ height: '32px', width: '32px', color: 'white' }} />
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: TEXT_COLOR_DARK, marginBottom: '12px' }}>Support Our Cause</h1>
              <p style={{ fontSize: '16px', color: TEXT_COLOR_LIGHT, lineHeight: '1.6' }}>
                  Your generous donation helps us continue our mission. Every contribution makes a significant impact.
              </p>
            </div>
            <div>
              <h3 style={{fontSize: '14px', color: TEXT_COLOR_DARK, marginBottom: '16px', borderTop: '1px solid #e5e7eb', paddingTop: '24px'}}>Your Donation is Secure</h3>
              {TRUST_BADGES.map((badge, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{
                        width: '32px', height: '32px', backgroundColor: '#eef2ff', borderRadius: '8px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px', flexShrink: 0
                      }}>
                          <badge.icon style={{ height: '16px', width: '16px', color: PRIMARY_COLOR }} />
                      </div>
                      <div>
                          <h4 style={{ fontSize: '14px', fontWeight: '600', color: TEXT_COLOR_DARK, margin: 0 }}>{badge.title}</h4>
                          <p style={{ fontSize: '12px', color: TEXT_COLOR_LIGHT, margin: 0 }}>{badge.description}</p>
                      </div>
                  </div>
              ))}
            </div>
        </div>
    );
};


// --- MAIN APP COMPONENT ---
function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: 12000, localAmount: 12000, customAmount: "", name: "", email: "", phone: "",
    isAnonymous: false, country: "India", countryCode: "+91", isIndian: true,
    address: '', city: '', state: '', pincode: '', panNumber: '',
    paymentMethod: PaymentMethod.RAZORPAY, selectedCurrency: 'INR',
    user_donated_currency: 'INR', frequency: 'One-time'
  });
  const [uiState, setUiState] = useState({
    isSubmitting: false, isCustomAmount: false, showCountryCodeDropdown: false,
    countryCodeSearchQuery: ''
  });
  const [message, setMessage] = useState('');
  const [hasTouchedPhone, setHasTouchedPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState("");
  const [hasEmailTouched, setHasEmailTouched] = useState(false);

  // --- HOOKS & LOGIC ---
  const { width } = useWindowSize();
  const isDesktop = width >= 880;

  useEffect(() => {
    const razorpayScript = document.createElement('script');
    razorpayScript.src = 'https://checkout.razorpay.com/v1/checkout.js';
    razorpayScript.async = true;
    document.body.appendChild(razorpayScript);
    const stripeScript = document.createElement('script');
    stripeScript.src = 'https://js.stripe.com/v3/';
    stripeScript.async = true;
    document.body.appendChild(stripeScript);
  }, []);

  const filteredCountryCodes = useMemo(() => {
    if (!uiState.countryCodeSearchQuery.trim()) return COUNTRY_CODES;
    const query = uiState.countryCodeSearchQuery.toLowerCase().trim();
    return COUNTRY_CODES.filter(c => c.country.toLowerCase().includes(query) || c.code.replace('+', '').includes(query));
  }, [uiState.countryCodeSearchQuery]);

  const areStep2FieldsFilled = useCallback(() => {
    if (!formData.name || !formData.phone || !formData.address || !formData.city || !formData.state || !formData.pincode) return false;
    if (formData.frequency === 'Monthly' && (!formData.email || !isValidEmail(formData.email))) return false;
    if (hasEmailTouched && formData.email && !isValidEmail(formData.email)) return false;
    return true;
  }, [formData, hasEmailTouched]);

  const handleAmountSelect = useCallback((amount) => {
    setFormData(prev => ({ ...prev, amount, localAmount: amount, customAmount: "" }));
    setUiState(prev => ({ ...prev, isCustomAmount: false }));
  }, []);

  const handleCustomAmount = useCallback((value) => {
    setFormData(prev => ({ ...prev, customAmount: value }));
    if (value) {
      setUiState(prev => ({ ...prev, isCustomAmount: true }));
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue >= 0) {
        const roundedAmount = Math.round(numValue);
        setFormData(prev => ({ ...prev, localAmount: roundedAmount, amount: roundedAmount }));
      }
    } else {
      setUiState(prev => ({ ...prev, isCustomAmount: false }));
      setFormData(prev => ({ ...prev, amount: 0, localAmount: 0 }));
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
      setEmailError(!value ? "Email is required for monthly donations" : !isValidEmail(value) ? "Please enter a valid email address" : "");
    } else {
      setEmailError(value && !isValidEmail(value) ? "Please enter a valid email address" : "");
    }
  }, [formData.frequency]);

  const handleEmailBlur = useCallback(() => {
    setHasEmailTouched(true);
    if (formData.frequency === 'Monthly') {
      if (!formData.email || !isValidEmail(formData.email)) setEmailError("Please enter a valid email address");
    } else if (formData.email && !isValidEmail(formData.email)) {
      setEmailError("Please enter a valid email address");
    }
  }, [formData.email, formData.frequency]);

  const handlePincodeChange = useCallback((e) => {
    const numericValue = e.target.value.replace(/\D/g, '');
    if (numericValue.length <= 6) setFormData(prev => ({ ...prev, pincode: numericValue }));
  }, []);

  const handlePanNumberChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }));
  }, []);

  const handleAnonymousToggle = useCallback((checked) => {
    setFormData(prev => ({ ...prev, isAnonymous: checked }));
  }, []);
  
  const handleFrequencyChange = useCallback((frequency) => {
    setFormData(prev => ({ ...prev, frequency }));
    if (frequency === 'Monthly' && hasEmailTouched) {
      setEmailError(!formData.email ? "Email is required for monthly donations" : !isValidEmail(formData.email) ? "Please enter a valid email address" : "");
    } else if (frequency === 'One-time') {
      setEmailError(formData.email && !isValidEmail(formData.email) ? "Please enter a valid email address" : "");
    }
  }, [formData.email, hasEmailTouched]);

  const toggleCountryCodeDropdown = useCallback((e) => {
    e.preventDefault();
    setUiState(prev => ({ ...prev, showCountryCodeDropdown: !prev.showCountryCodeDropdown, countryCodeSearchQuery: '' }));
  }, []);

  const selectCountryCode = useCallback((countryCode) => {
    setFormData(prev => ({ ...prev, countryCode: countryCode.code }));
    setUiState(prev => ({ ...prev, showCountryCodeDropdown: false, countryCodeSearchQuery: '' }));
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep === 1 && formData.amount > 0) setCurrentStep(2);
  }, [currentStep, formData.amount]);

  const handleBack = useCallback(() => {
    if (currentStep === 2) setCurrentStep(1);
  }, [currentStep]);
  
  const validateForm = useCallback(() => {
    if (!formData.amount || !formData.name) { setMessage('Please fill in all required fields'); return false; }
    if (formData.frequency === 'Monthly' && !formData.email) { setMessage('Email is required for monthly donations'); return false; }
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) { setMessage('Please enter a valid amount'); return false; }
    if (!validatePhoneNumber(formData.phone, formData.countryCode)) { setMessage('Please enter a valid phone number'); return false; }
    return true;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    if (uiState.isSubmitting || !validateForm() || !areStep2FieldsFilled()) return;
    setUiState(prev => ({ ...prev, isSubmitting: true }));
    setMessage('Processing your donation...');
    try {
      const response = await fetch(`${API_BASE_URL}/api/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: formData.amount, name: formData.name, email: formData.email,
          phone: formData.phone, currency: 'INR', frequency: formData.frequency
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || data.error || 'Failed to process payment');
      const commonOptions = {
        key: 'rzp_test_4nEyceM4GUQmPk', amount: data.amount, currency: data.currency, name: 'Our Cause',
        prefill: { name: formData.name, email: formData.email, contact: formData.phone },
        theme: { color: '#4f46e5' },
        handler: (response) => {
          console.log('Payment successful:', response);
          setMessage(formData.frequency === 'Monthly' ? 'Monthly subscription activated! Thank you.' : 'Thank you for your generous donation!');
          setUiState(prev => ({ ...prev, isSubmitting: false }));
          setTimeout(() => {
            setFormData({
              amount: 12000, localAmount: 12000, customAmount: "", name: "", email: "", phone: "",
              isAnonymous: false, country: "India", countryCode: "+91", isIndian: true,
              address: '', city: '', state: '', pincode: '', panNumber: '', paymentMethod: PaymentMethod.RAZORPAY,
              selectedCurrency: 'INR', user_donated_currency: 'INR', frequency: 'One-time'
            });
            setCurrentStep(1);
            setMessage('');
          }, 3000);
        },
        modal: { ondismiss: () => { setMessage('Payment cancelled'); setUiState(prev => ({ ...prev, isSubmitting: false })); } }
      };
      let rzp;
      if (data.type === 'subscription') {
        rzp = new window.Razorpay({ ...commonOptions, subscription_id: data.subscription_id, description: `Monthly Donation` });
      } else if (data.type === 'order') {
        rzp = new window.Razorpay({ ...commonOptions, order_id: data.id, description: `One-time Donation` });
      } else {
        throw new Error('Unexpected response type from server');
      }
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      setMessage(`Error: ${error.message}`);
      setUiState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [formData, areStep2FieldsFilled, uiState.isSubmitting, validateForm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.country-code-dropdown-container');
      if (dropdown && !dropdown.contains(event.target)) {
        setUiState(prev => ({ ...prev, showCountryCodeDropdown: false, countryCodeSearchQuery: '' }));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const FONT_FAMILY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'";
  const PRIMARY_COLOR = '#4f46e5';
  const BORDER_COLOR = '#e5e7eb';
  const TEXT_COLOR_DARK = '#1f2937';
  const TEXT_COLOR_LIGHT = '#6b7280';
  const BG_COLOR_LIGHT = '#f9fafb';
  
  // --- RENDER ---
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: FONT_FAMILY, padding: '20px', boxSizing: 'border-box', display:'flex', alignItems:'center' }}>
      <div style={{ 
        maxWidth: isDesktop ? '880px' : '480px', 
        width: '100%',
        margin: 'auto', 
        backgroundColor: 'white', 
        borderRadius: '16px', 
        boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)', 
        overflow: 'hidden',
        display: isDesktop ? 'flex' : 'block'
      }}>
        {isDesktop && <LeftInfoPanel />}

        <div style={{ flex: 1, width: '100%', minWidth: 0 }}>
            {currentStep === 1 && (
              <div>
                {!isDesktop && (
                  <div style={{ padding: '32px', textAlign: 'center', borderBottom: `1px solid ${BORDER_COLOR}` }}>
                    <div style={{ width: '64px', height: '64px', backgroundColor: PRIMARY_COLOR, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Heart style={{ height: '32px', width: '32px', color: 'white' }} />
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: TEXT_COLOR_DARK, marginBottom: '4px', margin: 0 }}>Support Our Cause</h1>
                    <p style={{ fontSize: '16px', color: TEXT_COLOR_LIGHT, margin: 0 }}>Your donation makes a meaningful difference.</p>
                  </div>
                )}
                <div style={{ padding: isDesktop ? '40px' : '24px' }}>
                <div style={{ backgroundColor: BG_COLOR_LIGHT, padding: '12px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${BORDER_COLOR}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                    <select
                      value={formData.selectedCurrency}
                      onChange={e => setFormData(prev => ({ ...prev, selectedCurrency: e.target.value }))}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: `1px solid ${BORDER_COLOR}`,
                        fontSize: '16px',
                        fontWeight: 'bold',
                        backgroundColor: 'white',
                        color: TEXT_COLOR_DARK,
                        cursor: 'pointer'
                      }}
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                    <span style={{ fontSize: '14px', color: TEXT_COLOR_LIGHT }}>
                      {formData.selectedCurrency === 'INR'
                        ? 'Secure payment via Razorpay'
                        : 'Secure payment via Stripe'}
                    </span>
                  </div>
                </div>

                  
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '600', color: TEXT_COLOR_DARK, marginBottom: '12px', textAlign: 'center' }}>Select Donation Type</h2>
                    <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '12px', padding: '4px' }}>
                      {['One-time', 'Monthly'].map(freq => (
                        <button key={freq} type="button" onClick={() => handleFrequencyChange(freq)}
                          style={{
                            flex: '1', padding: '10px 16px', borderRadius: '10px',
                            border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
                            backgroundColor: formData.frequency === freq ? 'white' : 'transparent',
                            color: formData.frequency === freq ? PRIMARY_COLOR : TEXT_COLOR_LIGHT,
                            boxShadow: formData.frequency === freq ? '0 1px 3px 0 rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s ease-in-out'
                          }}>
                          {freq}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '14px', fontWeight: '600', color: TEXT_COLOR_DARK, marginBottom: '12px', textAlign: 'center' }}>Choose an Amount</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
                      {DEFAULT_DONATION_AMOUNTS.map((amount, index) => {
                        const isSelected = Math.round(Number(formData.localAmount)) === amount && !uiState.isCustomAmount;
                        return (
                        <button key={index} type="button" onClick={() => handleAmountSelect(amount)}
                          style={{
                            position: 'relative', padding: '20px 12px', borderRadius: '12px',
                            border: `2px solid ${isSelected ? PRIMARY_COLOR : BORDER_COLOR}`,
                            backgroundColor: isSelected ? '#eef2ff' : 'white',
                            color: isSelected ? PRIMARY_COLOR : TEXT_COLOR_DARK,
                            cursor: 'pointer', fontWeight: 'bold', fontSize: '18px',
                            transition: 'all 0.2s ease-in-out'
                          }}>
                          {index === 1 && (
                            <div style={{ position: 'absolute', top: '-10px', left: '0', right: '0', display: 'flex', justifyContent: 'center' }}>
                              <span style={{ backgroundColor: '#10b981', fontSize: '10px', fontWeight: 'bold', padding: '2px 8px', borderRadius: '20px', color: 'white' }}>Popular</span>
                            </div>
                          )}
                          {formData.selectedCurrency === 'USD' ? '$' : '₹'}{amount.toLocaleString()}
                        </button>
                      )})}
                    </div>
                    
                    <div style={{ position: 'relative' }}>
                      <span style={{
                        position: 'absolute',
                        left: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: TEXT_COLOR_LIGHT,
                        fontWeight: 'bold',
                        pointerEvents: 'none'
                      }}>
                        {formData.selectedCurrency === 'USD' ? '$' : '₹'}
                      </span>
                      <input
                        type="number"
                        value={formData.customAmount}
                        onChange={(e) => handleCustomAmount(e.target.value)}
                        placeholder={`Or enter a custom amount (${formData.selectedCurrency === 'USD' ? '$' : '₹'})`}
                        min="1"
                        step="1"
                        style={{
                          width: '100%',
                          padding: '14px 48px',
                          borderRadius: '12px',
                          border: `2px solid ${uiState.isCustomAmount ? PRIMARY_COLOR : BORDER_COLOR}`,
                          backgroundColor: uiState.isCustomAmount ? '#eef2ff' : 'white',
                          fontSize: '16px',
                          outline: 'none',
                          boxSizing: 'border-box',
                          textAlign: 'center'
                        }}
                      />
                    </div>
                  </div>

                  <button type="button" onClick={handleNext} disabled={!formData.amount || formData.amount <= 0}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '16px 24px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', border: 'none',
                      cursor: formData.amount > 0 ? 'pointer' : 'not-allowed',
                      backgroundColor: formData.amount > 0 ? PRIMARY_COLOR : '#e5e7eb',
                      color: formData.amount > 0 ? 'white' : '#9ca3af',
                      transition: 'all 0.2s ease-in-out'
                    }}>
                    Continue <ArrowRight style={{ height: '16px', width: '16px', marginLeft: '8px' }} />
                  </button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: `1px solid ${BORDER_COLOR}` }}>
                  <button onClick={handleBack} style={{ display: 'flex', alignItems: 'center', color: PRIMARY_COLOR, background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    <ArrowLeft style={{ height: '16px', width: '16px', marginRight: '4px' }} /> Back
                  </button>
                </div>
                <div style={{ padding: isDesktop ? '40px' : '24px' }}>
                  <div style={{ backgroundColor: BG_COLOR_LIGHT, padding: '16px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${BORDER_COLOR}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <p style={{ fontSize: '14px', color: TEXT_COLOR_LIGHT, margin: 0 }}>You are donating</p>
                      <p style={{ fontWeight: 'bold', fontSize: '20px', color: TEXT_COLOR_DARK, margin: 0 }}>
                        {formData.selectedCurrency === 'USD' ? '$' : '₹'}
                        {formData.localAmount.toLocaleString()}
                        <span style={{fontSize: '14px', fontWeight:'500'}}>
                          {formData.frequency === 'Monthly' && '/month'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: TEXT_COLOR_DARK, marginBottom: '16px', textAlign: 'center' }}>Your Details</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: TEXT_COLOR_DARK, marginBottom: '6px' }}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                        <input type="text" value={formData.name} onChange={(e) => handleFormFieldChange('name', e.target.value)} placeholder="Enter your full name" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${BORDER_COLOR}`, fontSize: '16px', outline: 'none', boxSizing: 'border-box' }} required />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: TEXT_COLOR_DARK, marginBottom: '6px' }}>Mobile Number <span style={{ color: '#ef4444' }}>*</span></label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <div className="country-code-dropdown-container" style={{ position: 'relative', width: '80px', flexShrink: '0' }}>
                            <button type="button" onClick={toggleCountryCodeDropdown} style={{ width: '100%', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 8px', borderRadius: '8px', border: `1px solid ${BORDER_COLOR}`, backgroundColor: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                              {formData.countryCode}
                            </button>
                            {uiState.showCountryCodeDropdown && (
                              <div style={{ position: 'absolute', zIndex: '30', marginTop: '4px', width: '256px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: `1px solid ${BORDER_COLOR}`, maxHeight: '192px', overflowY: 'auto', left: '0' }}>
                                <div style={{ padding: '8px', borderBottom: `1px solid ${BORDER_COLOR}` }}>
                                  <input type="text" value={uiState.countryCodeSearchQuery} onChange={(e) => setUiState(prev => ({ ...prev, countryCodeSearchQuery: e.target.value }))} placeholder="Search..." style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: `1px solid ${BORDER_COLOR}`, fontSize: '14px', boxSizing: 'border-box' }} />
                                </div>
                                <div style={{ padding: '4px' }}>
                                  {filteredCountryCodes.map((cc) => (
                                    <button key={cc.code + cc.country} type="button" onClick={() => selectCountryCode(cc)} style={{ display: 'flex', alignItems: 'center', width: '100%', padding: '8px 12px', textAlign: 'left', fontSize: '14px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', borderRadius: '6px' }}>
                                      <span style={{ marginRight: '8px' }}>{cc.flag}</span>
                                      <span style={{ fontSize: '12px', color: TEXT_COLOR_LIGHT, flex: '1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cc.country}</span>
                                      <span style={{ marginLeft: 'auto', fontWeight: '600', color: TEXT_COLOR_DARK, fontSize: '12px', paddingLeft:'8px' }}>{cc.code}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          <div style={{ flex: '1', minWidth: '0' }}>
                            <input type="tel" value={formData.phone} onChange={handlePhoneChange} placeholder="Enter mobile number" style={{ width: '100%', height: '48px', padding: '0 16px', borderRadius: '8px', border: `1px solid ${hasTouchedPhone && phoneError ? '#ef4444' : BORDER_COLOR}`, fontSize: '16px', outline: 'none', boxSizing: 'border-box' }} required />
                          </div>
                        </div>
                        {hasTouchedPhone && phoneError && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{phoneError}</p>}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: TEXT_COLOR_DARK, marginBottom: '6px' }}>Email Address {formData.frequency === 'Monthly' ? <span style={{ color: '#ef4444' }}>*</span> : '(Optional)'}</label>
                        <input type="email" value={formData.email} onChange={handleEmailChange} onBlur={handleEmailBlur} placeholder="Enter your email" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${hasEmailTouched && emailError ? '#ef4444' : BORDER_COLOR}`, fontSize: '16px', outline: 'none', boxSizing: 'border-box' }} required={formData.frequency === 'Monthly'} />
                        {hasEmailTouched && emailError && <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', margin: 0 }}>{emailError}</p>}
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: TEXT_COLOR_DARK, marginBottom: '6px' }}>Address <span style={{ color: '#ef4444' }}>*</span></label>
                        <textarea value={formData.address} onChange={(e) => handleFormFieldChange('address', e.target.value)} placeholder="Enter street address" rows={2} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${BORDER_COLOR}`, fontSize: '16px', outline: 'none', resize: 'none', boxSizing: 'border-box' }} required />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <input type="text" value={formData.city} onChange={(e) => handleFormFieldChange('city', e.target.value)} placeholder="City *" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${BORDER_COLOR}`, fontSize: '16px', outline: 'none', boxSizing: 'border-box' }} required />
                        <input type="text" value={formData.state} onChange={(e) => handleFormFieldChange('state', e.target.value)} placeholder="State *" style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${BORDER_COLOR}`, fontSize: '16px', outline: 'none', boxSizing: 'border-box' }} required />
                      </div>
                      <input type="text" value={formData.pincode} onChange={handlePincodeChange} placeholder="Pin Code *" maxLength={6} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${BORDER_COLOR}`, fontSize: '16px', outline: 'none', boxSizing: 'border-box' }} required />
                      <input type="text" value={formData.panNumber} placeholder="PAN Number (for 80G)" onChange={handlePanNumberChange} maxLength={10} style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: `1px solid ${BORDER_COLOR}`, fontSize: '16px', outline: 'none', textTransform: 'uppercase', boxSizing: 'border-box' }} />
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', marginTop: '8px' }}>
                        <input type="checkbox" checked={formData.isAnonymous} onChange={(e) => handleAnonymousToggle(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: PRIMARY_COLOR }} />
                        <span style={{ marginLeft: '12px', fontSize: '14px', color: TEXT_COLOR_DARK }}>Make my donation anonymous</span>
                      </label>
                    </div>
                  </div>
                  <button type="button" onClick={handleSubmit} disabled={!areStep2FieldsFilled() || uiState.isSubmitting}
                    style={{
                      width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 24px', borderRadius: '12px', fontSize: '16px', fontWeight: 'bold', border: 'none',
                      cursor: areStep2FieldsFilled() && !uiState.isSubmitting ? 'pointer' : 'not-allowed',
                      backgroundColor: areStep2FieldsFilled() && !uiState.isSubmitting ? PRIMARY_COLOR : '#e5e7eb',
                      color: areStep2FieldsFilled() && !uiState.isSubmitting ? 'white' : '#9ca3af',
                      transition: 'all 0.2s ease-in-out'
                    }}>
                    {uiState.isSubmitting ? (
                      <><Loader2 style={{ animation: 'spin 1s linear infinite', height: '20px', width: '20px', marginRight: '12px' }} /> Processing...</>
                    ) : (
                      <>{formData.frequency === 'Monthly' ? 'Start Subscription' : 'Donate Now'}</>
                    )}
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px', alignItems: 'center', fontSize: '12px', color: TEXT_COLOR_LIGHT }}>
                    {/* <Lock style={{ height: '12px', width: '12px', marginRight: '6px' }} /> Secure payment via Razorpay */}
                  </div>
                </div>
              </div>
            )}
            {message && (
              <div style={{
                margin: '0 24px 24px', padding: '12px 16px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: '500',
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
    </div>
  );
}
    
export default App;

