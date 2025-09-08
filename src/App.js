import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// --- Helper Components & Data ---

// Base URL for the API
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? 'http://localhost:5001'
  : 'https://donation-form-j142.vercel.app';

// --- SVG Icons ---
const ArrowLeft = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>);
const Heart = ({ className }) => (<svg className={className} fill="currentColor" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" /></svg>);
const Globe = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>);
const CreditCard = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>);
const ChevronDown = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>);
const ChevronRight = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>);
const Lock = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>);
const Loader2 = ({ className }) => (<svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>);
const X = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>);
const ShieldCheck = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>);
const Shield = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>);
const Building = ({ className }) => (<svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>);
const CheckCircle = ({ className }) => (<svg className={className} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>);
const Star = ({ className }) => (<svg className={className} fill="currentColor" viewBox="0 0 24 24"><path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006z" clipRule="evenodd" /></svg>);

// --- Constants & Data ---
const PaymentMethod = { RAZORPAY: 'razorpay', STRIPE: 'stripe' };
const AVAILABLE_CURRENCIES = [ { code: 'USD', symbol: '$', name: 'US Dollar' }, { code: 'EUR', symbol: '€', name: 'Euro' }, { code: 'GBP', symbol: '£', name: 'British Pound' }, { code: 'INR', symbol: '₹', name: 'Indian Rupee' }, { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' }, { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' }, { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }];
const DEFAULT_DONATION_AMOUNTS = { INR: [42000, 12000, 2000], USD: [500, 300, 100] };
const COUNTRY_CODES = [{ country: "India", code: "+91", flag: "🇮🇳" }, { country: "United States", code: "+1", flag: "🇺🇸" }, { country: "United Kingdom", code: "+44", flag: "🇬🇧" }, { country: "Canada", code: "+1", flag: "🇨🇦" }, { country: "Australia", code: "+61", flag: "🇦🇺" }];
const COUNTRIES = [{ name: "India", code: "IN", flag: "🇮🇳" }, { name: "United States", code: "US", flag: "🇺🇸" }, { name: "United Kingdom", code: "GB", flag: "🇬🇧" }, { name: "Canada", code: "CA", flag: "🇨🇦" }, { name: "Australia", code: "AU", flag: "🇦🇺" }];
const DEFAULT_EXCHANGE_RATES = { 'USD': 1, 'EUR': 0.85, 'GBP': 0.73, 'INR': 83.15, 'CAD': 1.35, 'AUD': 1.52, 'JPY': 149.50 };
const TRUST_BADGES = [{ icon: ShieldCheck, title: "Bank-Level Security", description: "256-bit SSL encryption" }, { icon: Shield, title: "Tax Benefits", description: "80G tax exemption" }, { icon: Building, title: "Verified NGO", description: "Government registered" }];

// --- Utility Functions ---
const getCurrencySymbol = (currencyCode) => AVAILABLE_CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';
const convertCurrency = (amount, from, to, rates = DEFAULT_EXCHANGE_RATES) => {
  if (from === to) return amount;
  const usdAmount = from === 'USD' ? amount : amount / (rates[from] || 1);
  return to === 'USD' ? usdAmount : usdAmount * (rates[to] || 1);
};
const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePhoneNumber = (phone, countryCode) => {
  if (!phone) return false;
  const cleanPhone = phone.replace(/\D/g, '');
  switch (countryCode) {
    case '+91': return cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone);
    case '+1': return cleanPhone.length === 10;
    default: return cleanPhone.length >= 7 && cleanPhone.length <= 15;
  }
};
const detectUserLocation = async () => ({ country: 'IN', country_name: 'India', currency: 'INR' }); // Mock location

// --- Main App Component ---
function App() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: 0, localAmount: 0, customAmount: "", name: "", email: "", phone: "",
    isAnonymous: false, country: "India", countryCode: "+91", isIndian: true,
    address: '', city: '', state: '', pincode: '', panNumber: '',
    paymentMethod: PaymentMethod.RAZORPAY, selectedCurrency: 'INR'
  });
  const [uiState, setUiState] = useState({
    isSubmitting: false, isCustomAmount: false, showCountryDropdown: false,
    showCountryCodeDropdown: false, showCurrencyDropdown: false,
    countryCodeSearchQuery: '', countrySearchQuery: '', currencySearchQuery: ''
  });
  const [modalState, setModalState] = useState({ isOpen: false, status: '', message: '' }); // 'loading', 'success', 'error'
  const [validationErrors, setValidationErrors] = useState({});
  const userChangedDonorType = useRef(false);

  // --- Memos and Callbacks for Performance ---
  const predefinedAmounts = useMemo(() => {
    const baseAmounts = formData.selectedCurrency === 'INR' ? DEFAULT_DONATION_AMOUNTS.INR : DEFAULT_DONATION_AMOUNTS.USD;
    if (['INR', 'USD'].includes(formData.selectedCurrency)) return baseAmounts;
    return baseAmounts.map(amount => Math.round(convertCurrency(amount, 'USD', formData.selectedCurrency)));
  }, [formData.selectedCurrency]);

  const currencySymbol = useMemo(() => getCurrencySymbol(formData.selectedCurrency), [formData.selectedCurrency]);
  
  const filteredCountries = useMemo(() => COUNTRIES.filter(c => c.name.toLowerCase().includes(uiState.countrySearchQuery.toLowerCase())), [uiState.countrySearchQuery]);
  const filteredCountryCodes = useMemo(() => COUNTRY_CODES.filter(c => c.country.toLowerCase().includes(uiState.countryCodeSearchQuery.toLowerCase()) || c.code.includes(uiState.countryCodeSearchQuery)), [uiState.countryCodeSearchQuery]);
  const filteredCurrencies = useMemo(() => AVAILABLE_CURRENCIES.filter(c => c.name.toLowerCase().includes(uiState.currencySearchQuery.toLowerCase()) || c.code.toLowerCase().includes(uiState.currencySearchQuery)), [uiState.currencySearchQuery]);

  const areRequiredFieldsFilled = useCallback(() => {
    const errors = {};
    if (!formData.amount || formData.amount <= 0) errors.amount = "Please select an amount.";
    if (!formData.name.trim()) errors.name = "Full name is required.";
    if (!formData.email.trim() || !isValidEmail(formData.email)) errors.email = "A valid email is required.";
    if (!formData.phone.trim() || !validatePhoneNumber(formData.phone, formData.countryCode)) errors.phone = "A valid phone number is required.";
    if (!formData.address.trim()) errors.address = "Address is required.";
    if (!formData.city.trim()) errors.city = "City is required.";
    if (!formData.state.trim()) errors.state = "State is required.";
    if (!formData.pincode.trim()) errors.pincode = "Pincode is required.";
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // --- Event Handlers ---
  const handleAmountSelect = useCallback((amount) => {
    setFormData(prev => ({ ...prev, amount, localAmount: amount, customAmount: "" }));
    setUiState(prev => ({ ...prev, isCustomAmount: false }));
  }, []);

  const handleCustomAmount = useCallback((value) => {
    const numValue = Number(value);
    setFormData(prev => ({ ...prev, customAmount: value, amount: numValue, localAmount: numValue }));
    setUiState(prev => ({ ...prev, isCustomAmount: !!value }));
  }, []);

  const handleFormFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if(validationErrors[field]) setValidationErrors(prev => ({...prev, [field]: null}));
  }, [validationErrors]);

  const handleCitizenshipSelect = useCallback((isIndian) => {
    userChangedDonorType.current = true;
    if (isIndian) {
      setFormData(prev => ({ ...prev, isIndian: true, country: "India", countryCode: "+91", paymentMethod: PaymentMethod.RAZORPAY, selectedCurrency: 'INR' }));
      setCurrentStep(2);
    } else {
      setFormData(prev => ({ ...prev, isIndian: false, country: "United States", countryCode: "+1", paymentMethod: PaymentMethod.STRIPE, selectedCurrency: 'USD' }));
      setCurrentStep(3);
    }
  }, []);
  
  const handlePaymentMethodSelect = useCallback((method) => {
    const isRazorpay = method === PaymentMethod.RAZORPAY;
    setFormData(prev => ({ ...prev, paymentMethod: method, selectedCurrency: isRazorpay ? 'INR' : 'USD' }));
    setCurrentStep(3);
  }, []);

  const handleBack = useCallback(() => {
    if (currentStep === 1) return; // Or navigate away
    if (currentStep === 3 && !formData.isIndian) setCurrentStep(1);
    else setCurrentStep(prev => prev - 1);
  }, [currentStep, formData.isIndian]);
  
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!areRequiredFieldsFilled()) return;
    setModalState({ isOpen: true, status: 'loading', message: 'Processing your donation...' });
    
    // Mock payment processing
    setTimeout(() => {
        setModalState({ isOpen: true, status: 'success', message: 'Thank you for your generous donation!' });
    }, 2000);
  }, [formData, areRequiredFieldsFilled]);

  // --- Effects ---
  useEffect(() => {
    const detect = async () => {
      const location = await detectUserLocation();
      if (!userChangedDonorType.current) {
        const isIndian = location.country === 'IN';
        setFormData(prev => ({ ...prev, isIndian, country: isIndian ? 'India' : 'United States', countryCode: isIndian ? '+91' : '+1', paymentMethod: isIndian ? PaymentMethod.RAZORPAY : PaymentMethod.STRIPE, selectedCurrency: isIndian ? 'INR' : 'USD' }));
      }
    };
    detect();
  }, []);

  useEffect(() => {
    const defaultAmount = predefinedAmounts[1];
    if (formData.amount === 0) {
      handleAmountSelect(defaultAmount);
    }
  }, [predefinedAmounts, formData.amount, handleAmountSelect]);

  const getBackButtonText = () => {
    if (currentStep === 1) return "Back to Campaign";
    if (currentStep === 3 && !formData.isIndian) return "Back to Citizenship";
    return "Back";
  };
  
  // --- UI Components ---
  const Step1_Citizenship = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><Globe className="h-7 w-7 text-white" /></div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Choose Your Citizenship</h2>
          <p className="text-gray-500 text-sm">This helps us provide the best payment options.</p>
        </div>
        <div className="space-y-3">
          <button onClick={() => handleCitizenshipSelect(true)} className="w-full flex items-center p-4 md:p-5 rounded-2xl border bg-white/50 hover:border-yellow-300 hover:bg-yellow-50/50 transition-all group shadow-lg">
            <span className="text-3xl mr-4">🇮🇳</span>
            <div className="text-left flex-1">
              <h3 className="font-semibold text-slate-800 group-hover:text-yellow-600">Indian Citizen</h3>
              <p className="text-xs text-slate-500 mt-1">Indian passport holder or resident.</p>
              <p className="text-xs text-emerald-600 mt-1 font-medium">✓ Tax benefits available</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-yellow-500" />
          </button>
          <button onClick={() => handleCitizenshipSelect(false)} className="w-full flex items-center p-4 md:p-5 rounded-2xl border bg-white/50 hover:border-blue-300 hover:bg-blue-50/50 transition-all group shadow-lg">
            <span className="text-3xl mr-4">🌎</span>
            <div className="text-left flex-1">
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-600">Foreign Citizen</h3>
              <p className="text-xs text-slate-500 mt-1">Non-Indian passport holder.</p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-500" />
          </button>
        </div>
      </div>
    </div>
  );

  const Step2_PaymentMethod = () => (
    <div className="max-w-md mx-auto">
      <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 md:p-8">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"><CreditCard className="h-7 w-7 text-white" /></div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-2">Choose Donation Currency</h2>
        </div>
        <div className="space-y-3">
          <button onClick={() => handlePaymentMethodSelect(PaymentMethod.RAZORPAY)} className="w-full flex items-center p-4 md:p-5 rounded-2xl border bg-white/50 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all group shadow-lg">
            <div className="mr-4 w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"><span className="text-2xl text-white font-bold">₹</span></div>
            <div className="text-left flex-1"><h3 className="font-semibold text-slate-800 group-hover:text-indigo-600">Donate in INR</h3></div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
          </button>
          <button onClick={() => handlePaymentMethodSelect(PaymentMethod.STRIPE)} className="w-full flex items-center p-4 md:p-5 rounded-2xl border bg-white/50 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group shadow-lg">
            <div className="mr-4 w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg"><Globe className="h-6 w-6 text-white"/></div>
            <div className="text-left flex-1"><h3 className="font-semibold text-slate-800 group-hover:text-emerald-600">Donate in Other Currencies</h3></div>
            <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-500" />
          </button>
        </div>
      </div>
    </div>
  );

  const Step3_DonationForm = () => (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      {/* Form Column */}
      <div className="lg:col-span-3">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden">
            {/* Form Content Here */}
            <PaymentMethodIndicator />
            <div className="p-6 md:p-10">
                {formData.paymentMethod === PaymentMethod.STRIPE && <CurrencySelector />}
                <AmountOptions />
                <div className="border-t border-gray-200/50 pt-8 mt-8">
                    <div className="text-center mb-6">
                        <h2 className="text-xl lg:text-2xl font-bold text-gray-800 mb-2">Your Details</h2>
                        <p className="text-gray-500 text-sm">For your donation receipt.</p>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <FormField label="Full Name" error={validationErrors.name}><TextInput id="name" value={formData.name} onChange={(e) => handleFormFieldChange('name', e.target.value)} placeholder="Enter your full name" required /></FormField>
                        <FormField label="Mobile Number" error={validationErrors.phone}><PhoneInput /></FormField>
                        <FormField label="Email Address" error={validationErrors.email}><TextInput id="email" type="email" value={formData.email} onChange={(e) => handleFormFieldChange('email', e.target.value)} placeholder="Enter your email address" required /></FormField>
                        <FormField label="Address" error={validationErrors.address}><textarea id="address" value={formData.address} onChange={(e) => handleFormFieldChange('address', e.target.value)} placeholder="Enter your street address" rows="2" className="w-full px-5 py-4 rounded-2xl border-2 border-gray-200/50 bg-white/70 focus:outline-none focus:ring-4 focus:ring-blue-200/50 focus:border-blue-300 shadow-lg" required /></FormField>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField label="City" error={validationErrors.city}><TextInput id="city" value={formData.city} onChange={(e) => handleFormFieldChange('city', e.target.value)} required /></FormField>
                            <FormField label="State" error={validationErrors.state}><TextInput id="state" value={formData.state} onChange={(e) => handleFormFieldChange('state', e.target.value)} required /></FormField>
                            <FormField label="Pincode" error={validationErrors.pincode}><TextInput id="pincode" value={formData.pincode} onChange={(e) => handleFormFieldChange('pincode', e.target.value)} required /></FormField>
                        </div>
                        {formData.paymentMethod === PaymentMethod.RAZORPAY && <FormField label="PAN Number (for tax benefits)"><TextInput id="panNumber" value={formData.panNumber} onChange={(e) => handleFormFieldChange('panNumber', e.target.value.toUpperCase())} maxLength={10} placeholder="ABCDE1234F" className="uppercase" /></FormField>}
                        <AnonymousToggle />
                    </form>
                </div>
                <div className="mt-10">
                    <button type="button" onClick={handleSubmit} disabled={uiState.isSubmitting} className="w-full flex items-center justify-center px-8 py-5 rounded-2xl text-xl font-bold transition-all shadow-xl disabled:bg-gray-300 disabled:cursor-not-allowed bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 text-white hover:shadow-2xl">
                        {uiState.isSubmitting ? <Loader2 className="h-6 w-6" /> : <><Heart className="h-6 w-6 mr-3" /> Donate {currencySymbol}{formData.localAmount.toLocaleString()}</>}
                    </button>
                </div>
            </div>
        </div>
      </div>
      {/* Summary Column */}
      <div className="hidden lg:block lg:col-span-2">
        <div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden sticky top-8">
            <div className="h-56 bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-600 flex items-center justify-center"><Heart className="h-16 w-16 text-white/80" /></div>
            <div className="p-8">
                <div className="mb-8 text-center bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200/50 shadow-lg">
                    <p className="text-sm text-slate-500 mb-2 font-medium">Your donation amount</p>
                    <p className="text-4xl font-bold bg-gradient-to-r from-yellow-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-1">{currencySymbol}{formData.localAmount.toLocaleString()}</p>
                    <div className="h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full mt-3"></div>
                </div>
                 <div className="mt-8 grid grid-cols-3 gap-4">
                    {TRUST_BADGES.map((badge, index) => (
                      <div key={index} className="bg-white/70 backdrop-blur-md rounded-2xl p-5 text-center flex flex-col items-center shadow-lg border border-white/30">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-3 shadow-lg"><badge.icon className="h-6 w-6 text-white" /></div>
                        <h4 className="text-sm font-bold text-slate-700">{badge.title}</h4>
                      </div>
                    ))}
                  </div>
            </div>
        </div>
      </div>
    </div>
  );

  // --- Sub-Components for Step 3 ---
  const PaymentMethodIndicator = () => (
    <div className={`p-6 text-white ${formData.paymentMethod === PaymentMethod.RAZORPAY ? 'bg-gradient-to-r from-indigo-600 to-pink-600' : 'bg-gradient-to-r from-emerald-500 to-cyan-600'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
            <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center mr-4 shadow-lg"><span className="font-bold text-lg">{currencySymbol}</span></div>
            <div>
                <p className="font-bold text-lg">{formData.isIndian ? 'Indian Citizen' : 'Foreign Citizen'}</p>
                <p className="text-sm text-white/80 mt-1">Payment via {formData.paymentMethod === PaymentMethod.RAZORPAY ? 'Razorpay' : 'Stripe'} in {formData.selectedCurrency}</p>
            </div>
        </div>
        {formData.isIndian && <button onClick={() => setCurrentStep(2)} className="text-sm text-white/80 hover:text-white bg-white/10 px-4 py-2 rounded-full border border-white/20">Change</button>}
      </div>
    </div>
  );

  const CurrencySelector = () => {
    const selectedCurrencyInfo = useMemo(() => AVAILABLE_CURRENCIES.find(c => c.code === formData.selectedCurrency), [formData.selectedCurrency]);
    
    return (
        <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Currency <span className="text-rose-500">*</span></label>
            <div className="relative dropdown-container">
                <button type="button" onClick={() => setUiState(p => ({...p, showCurrencyDropdown: !p.showCurrencyDropdown}))} className="w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 border-gray-200/50 bg-white/70 shadow-lg">
                    <span>
                        <span className="mr-2 text-xl">{currencySymbol}</span>
                        <span className="font-semibold text-slate-700">{formData.selectedCurrency}</span>
                        <span className="ml-2 text-gray-500">- {selectedCurrencyInfo?.name}</span>
                    </span>
                    <ChevronDown className="h-5 w-5 text-slate-400" />
                </button>
                {uiState.showCurrencyDropdown && (
                    <div className="absolute z-10 mt-2 w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/30 max-h-64 overflow-y-auto">
                        <div className="p-2 sticky top-0 bg-white/95 border-b"><input type="text" value={uiState.currencySearchQuery} onChange={e => setUiState(p => ({...p, currencySearchQuery: e.target.value}))} placeholder="Search..." className="w-full px-3 py-2 rounded-lg border"/></div>
                        <div className="py-1">
                            {filteredCurrencies.map(c => <button key={c.code} type="button" onClick={() => { handleFormFieldChange('selectedCurrency', c.code); setUiState(p => ({...p, showCurrencyDropdown: false})); }} className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-blue-50/50"><span>{c.symbol}</span><span className="ml-3 font-medium">{c.code}</span><span className="ml-2 text-gray-500">- {c.name}</span></button>)}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };
  
  const AmountOptions = () => (
    <div className="mb-10">
        <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Donation Amount</h2>
            <p className="text-gray-500">Every contribution makes a difference.</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mb-6">
            {predefinedAmounts.map((amount, index) => (
                <button key={index} type="button" onClick={() => handleAmountSelect(amount)} className={`relative py-4 px-4 rounded-2xl transition-all shadow-lg ${formData.localAmount === amount && !uiState.isCustomAmount ? 'bg-gradient-to-br from-yellow-400 to-orange-500 text-white shadow-yellow-200/50' : 'bg-white/70 hover:bg-gray-100/50'}`}>
                    {index === 1 && <div className="absolute -top-2 left-0 right-0 flex justify-center"><span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-bold px-3 py-0.5 rounded-full text-white shadow-lg flex items-center gap-1"><Star className="h-2.5 w-2.5"/>Popular</span></div>}
                    <div className="text-xl font-bold">{currencySymbol}{amount.toLocaleString()}</div>
                </button>
            ))}
        </div>
        <div className="relative">
            <input type="number" value={formData.customAmount} onChange={(e) => handleCustomAmount(e.target.value)} placeholder="Enter custom amount" min="1" className={`w-full pl-16 pr-6 py-5 rounded-2xl border-2 text-lg shadow-lg ${uiState.isCustomAmount ? 'border-yellow-300 bg-yellow-50/50' : 'border-gray-200/50 bg-white/70'}`} />
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"><span className="text-gray-500 font-bold text-xl">{currencySymbol}</span></div>
        </div>
    </div>
  );
  
  const FormField = ({ label, children, error }) => (
    <div>
        <label className="block text-sm font-semibold text-slate-700 mb-2">{label} <span className="text-rose-500">*</span></label>
        {children}
        {error && <p className="text-xs text-rose-500 mt-2 font-medium">{error}</p>}
    </div>
  );
  
  const TextInput = ({ id, value, onChange, placeholder, required, type = "text", className = "" }) => (
    <input id={id} type={type} value={value} onChange={onChange} placeholder={placeholder} required={required} className={`w-full px-5 py-4 rounded-2xl border-2 border-gray-200/50 bg-white/70 focus:outline-none focus:ring-4 focus:ring-blue-200/50 focus:border-blue-300 shadow-lg ${className}`} />
  );

  const PhoneInput = () => (
    <div className="flex space-x-3">
        <div className="relative dropdown-container w-28 flex-shrink-0">
            <button type="button" onClick={() => setUiState(p => ({...p, showCountryCodeDropdown: !p.showCountryCodeDropdown}))} className="w-full h-full flex items-center justify-between px-4 rounded-2xl border-2 border-gray-200/50 bg-white/70 shadow-lg">
                <span className="text-sm font-semibold truncate">{formData.countryCode}</span>
                <ChevronDown className="h-4 w-4 ml-1 text-slate-400" />
            </button>
            {uiState.showCountryCodeDropdown && (
                <div className="absolute z-30 mt-2 w-72 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border max-h-64 overflow-y-auto">
                    <div className="p-2 sticky top-0 bg-white/95 border-b"><input type="text" value={uiState.countryCodeSearchQuery} onChange={e => setUiState(p => ({...p, countryCodeSearchQuery: e.target.value}))} placeholder="Search..." className="w-full px-3 py-2 rounded-lg border"/></div>
                    <div className="py-1">
                        {filteredCountryCodes.map(c => <button key={c.code+c.country} type="button" onClick={() => { handleFormFieldChange('countryCode', c.code); setUiState(p => ({...p, showCountryCodeDropdown: false})); }} className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-blue-50/50"><span className="mr-3 text-lg">{c.flag}</span><span className="truncate max-w-[120px]">{c.country}</span><span className="ml-auto font-semibold">{c.code}</span></button>)}
                    </div>
                </div>
            )}
        </div>
        <div className="flex-1 min-w-0">
            <TextInput id="phone" type="tel" value={formData.phone} onChange={(e) => handleFormFieldChange('phone', e.target.value)} placeholder="Enter mobile number" required />
        </div>
    </div>
  );
  
  const AnonymousToggle = () => (
    <label className="flex items-center group cursor-pointer">
        <div className="relative">
            <input type="checkbox" checked={formData.isAnonymous} onChange={(e) => handleFormFieldChange('isAnonymous', e.target.checked)} className="sr-only" />
            <div className={`w-5 h-5 rounded-lg border-2 transition-all ${formData.isAnonymous ? 'bg-blue-500 border-blue-500' : 'bg-white border-gray-300'}`}>
                {formData.isAnonymous && <CheckCircle className="h-5 w-5 text-white absolute -inset-0"/>}
            </div>
        </div>
        <span className="ml-3 text-sm text-slate-600">Make my donation anonymous</span>
    </label>
  );

  const PaymentStatusModal = () => (
    modalState.isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 text-center max-w-sm w-full">
                {modalState.status === 'loading' && <Loader2 className="h-12 w-12 text-blue-500 mx-auto mb-4" />}
                {modalState.status === 'success' && <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />}
                {modalState.status === 'error' && <X className="h-12 w-12 text-red-500 mx-auto mb-4" />}
                <h3 className="text-lg font-bold text-gray-800 mb-2">{modalState.message}</h3>
                {modalState.status === 'success' && <button onClick={() => setModalState({isOpen: false})} className="mt-4 bg-green-500 text-white px-6 py-2 rounded-lg">Done</button>}
                {modalState.status === 'error' && <button onClick={() => setModalState({isOpen: false})} className="mt-4 bg-red-500 text-white px-6 py-2 rounded-lg">Try Again</button>}
            </div>
        </div>
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 text-slate-800">
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-yellow-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8">
          <button onClick={handleBack} className="flex items-center text-slate-600 hover:text-slate-800 transition-all group">
            <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">{getBackButtonText()}</span>
          </button>
        </div>

        {currentStep === 1 && <Step1_Citizenship />}
        {currentStep === 2 && <Step2_PaymentMethod />}
        {currentStep === 3 && <Step3_DonationForm />}
      </div>
      <PaymentStatusModal />
    </div>
  );
}

export default App;
