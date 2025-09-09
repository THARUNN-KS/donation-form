import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';

// Near the top of your App.js file
const API_BASE_URL = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001' 
  : 'https://donation-form-j142.vercel.app';

// Icons as simple SVG components
const ArrowLeft = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7" />
  </svg>
);

const Heart = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const Globe = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CreditCard = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
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

// Payment Method enumeration
const PaymentMethod = {
  RAZORPAY: 'razorpay',
  STRIPE: 'stripe'
};

// Available currencies with symbols
const AVAILABLE_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'SEK', symbol: 'kr', name: 'Swedish Krona' }
];

// Default donation amounts
const DEFAULT_DONATION_AMOUNTS = {
  INR: [42000, 12000, 2000],
  USD: [500, 300, 100]
};

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

// Countries list
const COUNTRIES = [
  { name: "India", code: "IN", flag: "🇮🇳" },
  { name: "United States", code: "US", flag: "🇺🇸" },
  { name: "United Kingdom", code: "GB", flag: "🇬🇧" },
  { name: "Canada", code: "CA", flag: "🇨🇦" },
  { name: "Australia", code: "AU", flag: "🇦🇺" },
  { name: "Germany", code: "DE", flag: "🇩🇪" },
  { name: "France", code: "FR", flag: "🇫🇷" },
  { name: "Japan", code: "JP", flag: "🇯🇵" },
  { name: "Singapore", code: "SG", flag: "🇸🇬" },
  { name: "UAE", code: "AE", flag: "🇦🇪" }
];

// Exchange rates (simplified - in production, fetch from API)
const DEFAULT_EXCHANGE_RATES = {
  'USD': 1,
  'EUR': 0.85,
  'GBP': 0.73,
  'INR': 83.15,
  'CAD': 1.35,
  'AUD': 1.52,
  'JPY': 149.50,
  'CHF': 0.88,
  'CNY': 7.24,
  'SEK': 10.87
};

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
const getCurrencySymbol = (currencyCode) => {
  const currency = AVAILABLE_CURRENCIES.find(c => c.code === currencyCode);
  return currency ? currency.symbol : '$';
};

const convertCurrency = (amount, fromCurrency, toCurrency, rates = DEFAULT_EXCHANGE_RATES) => {
  if (fromCurrency === toCurrency) return amount;
  
  // Convert to USD first, then to target currency
  const usdAmount = fromCurrency === 'USD' ? amount : amount / rates[fromCurrency];
  const convertedAmount = toCurrency === 'USD' ? usdAmount : usdAmount * rates[toCurrency];
  
  return convertedAmount;
};

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

// Location detection mock (replace with actual geolocation service)
const detectUserLocation = async () => {
  try {
    // Mock location detection - replace with actual service
    return {
      country: 'IN',
      country_name: 'India',
      currency: 'INR',
      continent: 'AS'
    };
  } catch (error) {
    console.error('Location detection failed:', error);
    return {
      country: 'IN',
      country_name: 'India',
      currency: 'INR',
      continent: 'AS'
    };
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
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: 0,
    localAmount: 0,
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
    user_donated_currency: 'INR'
  });
  
  // UI state
  const [uiState, setUiState] = useState({
    isSubmitting: false,
    isCustomAmount: false,
    showCountryDropdown: false,
    showCountryCodeDropdown: false,
    showCurrencyDropdown: false,
    countryCodeSearchQuery: '',
    countrySearchQuery: '',
    currencySearchQuery: '',
    isConverting: false
  });
  
  // Other state
  const [userLocation, setUserLocation] = useState({
    country: 'IN',
    country_name: 'India',
    currency: 'INR',
    continent: 'AS'
  });
  
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [message, setMessage] = useState('');
  const [hasTouchedPhone, setHasTouchedPhone] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState("");
  const [hasEmailTouched, setHasEmailTouched] = useState(false);

  // Refs
  const userChangedDonorType = useRef(false);
  const isOutsideIndia = useRef(false);

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

  // Detect location on component mount
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const location = await detectUserLocation();
        setUserLocation(location);
        
        const isIndianLocation = location.country === 'IN';
        isOutsideIndia.current = !isIndianLocation;
        
        if (!userChangedDonorType.current) {
          setFormData(prev => ({
            ...prev,
            country: isIndianLocation ? 'India' : location.country_name || 'United States',
            countryCode: isIndianLocation ? '+91' : '+1',
            paymentMethod: isIndianLocation ? PaymentMethod.RAZORPAY : PaymentMethod.STRIPE,
            selectedCurrency: isIndianLocation ? 'INR' : 'USD',
            user_donated_currency: isIndianLocation ? 'INR' : 'USD'
          }));
        }
      } catch (error) {
        console.error('Error detecting location:', error);
      }
    };
    
    detectLocation();
  }, []);

  // Get predefined amounts based on currency
  const predefinedAmounts = useMemo(() => {
    if (formData.selectedCurrency === 'INR') {
      return DEFAULT_DONATION_AMOUNTS.INR;
    } else if (formData.selectedCurrency === 'USD') {
      return DEFAULT_DONATION_AMOUNTS.USD;
    } else {
      // Convert USD amounts to selected currency
      return DEFAULT_DONATION_AMOUNTS.USD.map(amount => {
        const converted = convertCurrency(amount, 'USD', formData.selectedCurrency);
        return Math.round(converted);
      });
    }
  }, [formData.selectedCurrency]);

  // Get currency symbol
  const currencySymbol = useMemo(() => {
    if (formData.isIndian && formData.paymentMethod === PaymentMethod.RAZORPAY) {
      return "₹";
    }
    return getCurrencySymbol(formData.selectedCurrency);
  }, [formData.isIndian, formData.paymentMethod, formData.selectedCurrency]);

  // Filter countries based on search query
  const filteredCountries = useMemo(() => {
    let filtered = [...COUNTRIES];
    
    if (uiState.countrySearchQuery && uiState.countrySearchQuery.trim() !== '') {
      const query = uiState.countrySearchQuery.toLowerCase().trim();
      filtered = filtered.filter(country => 
        country.name.toLowerCase().includes(query) || 
        country.code.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [uiState.countrySearchQuery]);

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

  // Filter currencies based on search query
  const filteredCurrencies = useMemo(() => {
    let filtered = [...AVAILABLE_CURRENCIES];
    
    if (uiState.currencySearchQuery && uiState.currencySearchQuery.trim() !== '') {
      const query = uiState.currencySearchQuery.toLowerCase().trim();
      filtered = filtered.filter(currency => 
        currency.code.toLowerCase().includes(query) || 
        currency.symbol.toLowerCase().includes(query) || 
        currency.name.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [uiState.currencySearchQuery]);

  // Check if all mandatory fields are filled
  const areRequiredFieldsFilled = useCallback(() => {
    if (!formData.amount || formData.amount <= 0) return false;
    if (!formData.name || !formData.email || !formData.phone) return false;
    if (!formData.email || !isValidEmail(formData.email)) return false;
    if (!formData.address || !formData.city || !formData.state || !formData.pincode) return false;
    
    return true;
  }, [
    formData.amount, 
    formData.name, 
    formData.email, 
    formData.phone, 
    formData.address, 
    formData.city, 
    formData.state, 
    formData.pincode
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
    
    if (!value) {
      setEmailError("Email is required");
    } else if (!isValidEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  }, []);

  const handleEmailBlur = useCallback(() => {
    setHasEmailTouched(true);
    if (!formData.email) {
      setEmailError("Email is required");
    } else if (!isValidEmail(formData.email)) {
      setEmailError("Please enter a valid email address");
    }
  }, [formData.email]);

  const handlePincodeChange = useCallback((e) => {
    if (formData.country === "India") {
      const numericValue = e.target.value.replace(/\D/g, '');
      if (numericValue.length <= 6) {
        setFormData(prev => ({ ...prev, pincode: numericValue }));
      }
    } else {
      const value = e.target.value;
      if (value.length <= 10) {
        setFormData(prev => ({ ...prev, pincode: value }));
      }
    }
  }, [formData.country]);

  const handlePanNumberChange = useCallback((e) => {
    setFormData(prev => ({ ...prev, panNumber: e.target.value.toUpperCase() }));
  }, []);

  const handleAnonymousToggle = useCallback((checked) => {
    setFormData(prev => ({ ...prev, isAnonymous: checked }));
  }, []);

  // Handle citizenship selection
  const handleCitizenshipSelect = useCallback((isIndian) => {
    if (!isIndian) {
      const defaultCurrency = "USD";
      
      setFormData(prev => ({
        ...prev,
        isIndian: isIndian,
        country: isIndian ? "India" : userLocation.country_name || "United States",
        countryCode: isIndian ? "+91" : "+1",
        paymentMethod: isIndian ? PaymentMethod.RAZORPAY : PaymentMethod.STRIPE,
        selectedCurrency: isIndian ? "INR" : defaultCurrency,
        user_donated_currency: isIndian ? "INR" : defaultCurrency
      }));
      
      setCurrentStep(3);
      
      setTimeout(() => {
        const defaultAmounts = isIndian ? DEFAULT_DONATION_AMOUNTS.INR : DEFAULT_DONATION_AMOUNTS.USD;
        const defaultAmount = defaultAmounts[1];
        
        setFormData(prev => ({
          ...prev,
          amount: defaultAmount,
          localAmount: defaultAmount,
          customAmount: ""
        }));
        
        setUiState(prev => ({
          ...prev,
          isCustomAmount: false
        }));
      }, 50);
    } else {
      setCurrentStep(2);
      
      setFormData(prev => ({
        ...prev,
        isIndian: true,
        country: "India",
        countryCode: "+91",
        paymentMethod: PaymentMethod.RAZORPAY,
        selectedCurrency: "INR",
        user_donated_currency: "INR"
      }));
    }
    
    userChangedDonorType.current = true;
  }, [userLocation]);

  // Handle payment method selection
  const handlePaymentMethodSelect = useCallback((method) => {
    const isRazorpay = method === PaymentMethod.RAZORPAY;
    
    setFormData(prev => ({
      ...prev,
      isIndian: isRazorpay,
      paymentMethod: method,
      selectedCurrency: isRazorpay ? 'INR' : 'USD',
      user_donated_currency: isRazorpay ? 'INR' : 'USD'
    }));
    
    setCurrentStep(3);

    setTimeout(() => {
      const defaultAmounts = isRazorpay ? DEFAULT_DONATION_AMOUNTS.INR : DEFAULT_DONATION_AMOUNTS.USD;
      const defaultAmount = defaultAmounts[1];
      
      setFormData(prev => ({
        ...prev,
        amount: defaultAmount,
        localAmount: defaultAmount,
        customAmount: ""
      }));
      
      setUiState(prev => ({
        ...prev,
        isCustomAmount: false
      }));
    }, 50);
  }, []);

  // Toggle dropdown visibility
  const toggleCountryDropdown = useCallback((e) => {
    e.preventDefault();
    const newState = !uiState.showCountryDropdown;
    
    setUiState(prev => ({
      ...prev,
      showCountryDropdown: newState,
      showCountryCodeDropdown: false,
      showCurrencyDropdown: false,
      countrySearchQuery: ''
    }));
  }, [uiState.showCountryDropdown]);

  const toggleCountryCodeDropdown = useCallback((e) => {
    e.preventDefault();
    const newState = !uiState.showCountryCodeDropdown;
    
    setUiState(prev => ({
      ...prev,
      showCountryCodeDropdown: newState,
      showCountryDropdown: false,
      showCurrencyDropdown: false,
      countryCodeSearchQuery: ''
    }));
  }, [uiState.showCountryCodeDropdown]);

  const toggleCurrencyDropdown = useCallback((e) => {
    e.preventDefault();
    const newState = !uiState.showCurrencyDropdown;
    
    setUiState(prev => ({
      ...prev,
      showCurrencyDropdown: newState,
      showCountryDropdown: false,
      showCountryCodeDropdown: false,
      currencySearchQuery: ''
    }));
  }, [uiState.showCurrencyDropdown]);

  // Handle country selection
  const selectCountry = useCallback((country) => {
    const countryCodeEntry = COUNTRY_CODES.find(
      code => code.country === country.name
    );
    setFormData(prev => ({
      ...prev, 
      country: country.name,
      countryCode: countryCodeEntry ? countryCodeEntry.code : prev.countryCode 
    }));
    setUiState(prev => ({
      ...prev,
      showCountryDropdown: false,
      countrySearchQuery: ''
    }));
  }, []);

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

  const handleCurrencySelect = useCallback((currencyCode) => {
    setFormData(prev => ({
      ...prev,
      selectedCurrency: currencyCode,
      user_donated_currency: currencyCode
    }));
    
    setUiState(prev => ({
      ...prev,
      showCurrencyDropdown: false,
      currencySearchQuery: '',
      isCustomAmount: false
    }));

    // Reset amounts when currency changes
    const defaultAmounts = currencyCode === 'INR' ? DEFAULT_DONATION_AMOUNTS.INR : 
                          currencyCode === 'USD' ? DEFAULT_DONATION_AMOUNTS.USD :
                          DEFAULT_DONATION_AMOUNTS.USD.map(amount => Math.round(convertCurrency(amount, 'USD', currencyCode)));
    
    const defaultAmount = defaultAmounts[1];
    
    setFormData(prev => ({
      ...prev,
      amount: defaultAmount,
      localAmount: defaultAmount,
      customAmount: ""
    }));
  }, []);

  // Navigate back
  const handleBack = useCallback(() => {
    if (currentStep === 1) {
      setIsModalOpen(false);
    } else if (currentStep === 3 && !formData.isIndian) {
      setCurrentStep(1);
    } else {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, formData.isIndian]);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    if (e) e.preventDefault();
    
    if (uiState.isSubmitting) return;
    
    const isPhoneValid = validatePhoneNumber(formData.phone, formData.countryCode);

    if (formData.isIndian && formData.paymentMethod === PaymentMethod.RAZORPAY) {
      if (!isPhoneValid) {
        setMessage('Please enter a valid phone number');
        return;
      }
    }
    
    if (!areRequiredFieldsFilled()) {
      setMessage('Please fill in all required fields.');
      return;
    }
    
    setUiState(prev => ({ ...prev, isSubmitting: true }));
    setMessage('Processing your donation...');
    
    // Initiate payment based on selected payment method
    if (formData.paymentMethod === PaymentMethod.RAZORPAY) {
      try {
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
            frequency: 'One-time'
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || data.error || 'Failed to process payment');
        }

        const options = {
          key: 'rzp_test_4nEyceM4GUQmPk',
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
            setMessage('Thank you for your generous donation!');
            setUiState(prev => ({ ...prev, isSubmitting: false }));
            
            // Reset form
            setTimeout(() => {
              setFormData({
                amount: 0,
                localAmount: 0,
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
                user_donated_currency: 'INR'
              });
              setMessage('');
              setIsModalOpen(false);
            }, 3000);
          },
          modal: {
            ondismiss: function() {
              setMessage('Payment cancelled');
              setUiState(prev => ({ ...prev, isSubmitting: false }));
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

      } catch (error) {
        console.error('Razorpay payment error:', error);
        setMessage(`Error: ${error.message}`);
        setUiState(prev => ({ ...prev, isSubmitting: false }));
      }
    } else if (formData.paymentMethod === PaymentMethod.STRIPE) {
        if (!stripeLoaded) {
            setMessage('Stripe is still loading. Please try again in a moment.');
            setUiState(prev => ({ ...prev, isSubmitting: false }));
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/api/create-stripe-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    amount: formData.amount,
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    currency: formData.selectedCurrency,
                    frequency: 'One-time'
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Failed to process payment');
            }

            const stripe = window.Stripe('pk_test_51HvTSXFpsHIe6pnDbw5m9BPMOsB2jyH8daLjSU5Bnh58CaRtpTpgCMebRcW06Ccy9rGYP5RM2l1Toz8u3JeWGoGR00WpEFaF5M');

            if (data.type === 'checkout') {
                stripe.redirectToCheckout({
                    sessionId: data.id
                }).then(function (result) {
                    if (result.error) {
                        setMessage(`Error: ${result.error.message}`);
                        setUiState(prev => ({ ...prev, isSubmitting: false }));
                    }
                });
            }

        } catch (error) {
            console.error('Stripe payment error:', error);
            setMessage(`Error: ${error.message}`);
            setUiState(prev => ({ ...prev, isSubmitting: false }));
        }
    }
  }, [formData, areRequiredFieldsFilled, uiState.isSubmitting, stripeLoaded]);

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
      
      if (uiState.showCurrencyDropdown) {
        const dropdown = document.querySelector('.currency-dropdown-container');
        if (dropdown && !dropdown.contains(event.target)) {
          setUiState(prev => ({
            ...prev,
            showCurrencyDropdown: false,
            currencySearchQuery: ''
          }));
        }
      }
      
      if (uiState.showCountryDropdown) {
        const dropdown = document.querySelector('.country-dropdown-container');
        if (dropdown && !dropdown.contains(event.target)) {
          setUiState(prev => ({
            ...prev,
            showCountryDropdown: false,
            countrySearchQuery: ''
          }));
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [uiState.showCountryDropdown, uiState.showCountryCodeDropdown, uiState.showCurrencyDropdown]);

  // Set default amount on load
  useEffect(() => {
    if (formData.amount === 0) {
      const amounts = formData.selectedCurrency === 'INR' ? DEFAULT_DONATION_AMOUNTS.INR : DEFAULT_DONATION_AMOUNTS.USD;
      const defaultAmount = amounts[1]; // Middle value
      
      setFormData(prev => ({
        ...prev,
        amount: defaultAmount,
        localAmount: defaultAmount
      }));
    }
  }, [formData.amount, formData.selectedCurrency]);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f5f5f5',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    }}>
      {/* Main Donation Button */}
      {!isModalOpen && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '24px'
            }}>
              Support Our Cause
            </h1>
            <p style={{
              color: '#666',
              marginBottom: '32px',
              maxWidth: '400px'
            }}>
              Your donation makes a difference in the lives of those who need it most. Every contribution counts.
            </p>
            
            <button
              onClick={() => setIsModalOpen(true)}
              style={{
                background: 'linear-gradient(to right, #f59e0b, #f97316)',
                color: 'white',
                fontWeight: 'bold',
                padding: '16px 32px',
                borderRadius: '16px',
                fontSize: '18px',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                margin: '0 auto'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 15px 35px rgba(245, 158, 11, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 10px 25px rgba(245, 158, 11, 0.3)';
              }}
            >
              <Heart style={{ height: '24px', width: '24px', marginRight: '12px' }} />
              Donate Now
            </button>
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div style={{
          position: 'fixed',
          inset: '0',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: '50',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '95vh',
            overflow: 'auto'
          }}>
            
            {/* Step 1: Citizenship Selection */}
            {currentStep === 1 && (
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
                    onClick={() => setIsModalOpen(false)}
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
                    Back to Campaign
                  </button>
                </div>

                <div style={{ padding: '0 24px 24px', textAlign: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#f59e0b',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}>
                    <Globe style={{ height: '32px', width: '32px', color: 'white' }} />
                  </div>
                  
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    Choose Your Citizenship
                  </h2>
                  <p style={{
                    color: '#6b7280',
                    fontSize: '14px',
                    marginBottom: '32px'
                  }}>
                    This helps us provide the best payment options for you
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button
                      onClick={() => handleCitizenshipSelect(true)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '2px solid #f59e0b',
                        backgroundColor: '#fef3c7',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontSize: '32px', marginRight: '16px' }}>🇮🇳</div>
                      <div style={{ textAlign: 'left', flex: '1' }}>
                        <h3 style={{
                          fontWeight: '600',
                          color: '#d97706',
                          fontSize: '18px',
                          marginBottom: '4px'
                        }}>
                          Indian Citizen
                        </h3>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280',
                          marginBottom: '4px'
                        }}>
                          Indian passport holder or resident
                        </p>
                        <p style={{
                          fontSize: '12px',
                          color: '#059669',
                          fontWeight: '500'
                        }}>
                          ✓ Tax benefits available
                        </p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleCitizenshipSelect(false)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ fontSize: '32px', marginRight: '16px' }}>🌎</div>
                      <div style={{ textAlign: 'left', flex: '1' }}>
                        <h3 style={{
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '18px',
                          marginBottom: '4px'
                        }}>
                          Foreign Citizen
                        </h3>
                        <p style={{
                          fontSize: '14px',
                          color: '#6b7280'
                        }}>
                          Non-Indian passport holder
                        </p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Currency Selection */}
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
                    Back to Citizenship
                  </button>
                </div>

                <div style={{ padding: '0 24px 24px', textAlign: 'center' }}>
                  <div style={{
                    width: '64px',
                    height: '64px',
                    backgroundColor: '#f59e0b',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 24px'
                  }}>
                    <CreditCard style={{ height: '32px', width: '32px', color: 'white' }} />
                  </div>
                  
                  <h2 style={{
                    fontSize: '24px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '32px'
                  }}>
                    Choose Your Donation Currency
                  </h2>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <button
                      onClick={() => handlePaymentMethodSelect(PaymentMethod.RAZORPAY)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '2px solid #f59e0b',
                        backgroundColor: '#fef3c7',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: '#f59e0b',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '16px'
                      }}>
                        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '18px' }}>₹</span>
                      </div>
                      <div style={{ textAlign: 'left', flex: '1' }}>
                        <h3 style={{
                          fontWeight: '600',
                          color: '#d97706',
                          fontSize: '18px'
                        }}>
                          Donate in INR
                        </h3>
                      </div>
                    </button>

                    <button
                      onClick={() => handlePaymentMethodSelect(PaymentMethod.STRIPE)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{
                        width: '48px',
                        height: '48px',
                        backgroundColor: '#f59e0b',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: '16px'
                      }}>
                        <Globe style={{ height: '24px', width: '24px', color: 'white' }} />
                      </div>
                      <div style={{ textAlign: 'left', flex: '1' }}>
                        <h3 style={{
                          fontWeight: '600',
                          color: '#374151',
                          fontSize: '18px'
                        }}>
                          Donate in Other Currencies
                        </h3>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Donation Form */}
            {currentStep === 3 && (
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
                    {formData.isIndian ? "Back to Payment Gateway" : "Back to Citizenship"}
                  </button>
                </div>

                <div style={{ padding: '0 24px 24px' }}>
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
                          <span style={{ fontWeight: 'bold' }}>
                            {formData.paymentMethod === PaymentMethod.RAZORPAY ? '₹' : getCurrencySymbol(formData.selectedCurrency)}
                          </span>
                        </div>
                        <div>
                          <p style={{
                            fontWeight: 'bold',
                            fontSize: '14px',
                            marginBottom: '2px'
                          }}>
                            {formData.isIndian 
                              ? (formData.paymentMethod === PaymentMethod.RAZORPAY 
                                ? 'Indian Citizen - INR Payment' 
                                : 'Indian Citizen - International Payment')
                              : 'Foreign Citizen'}
                          </p>
                          <p style={{
                            fontSize: '12px',
                            opacity: '0.8',
                            margin: '0'
                          }}>
                            {formData.paymentMethod === PaymentMethod.RAZORPAY 
                              ? 'Secure payment via Razorpay in INR' 
                              : `International payment via Stripe in ${formData.selectedCurrency}`}
                          </p>
                        </div>
                      </div>
                      {formData.isIndian && (
                        <button 
                          onClick={() => setCurrentStep(2)}
                          style={{
                            fontSize: '12px',
                            color: 'white',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            padding: '6px 12px',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.2)',
                            cursor: 'pointer'
                          }}
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Currency Selector - Only for Stripe */}
                  {formData.paymentMethod === PaymentMethod.STRIPE && (
                    <div style={{ marginBottom: '24px' }}>
                      <label style={{
                        display: 'block',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: '#374151',
                        marginBottom: '8px'
                      }}>
                        Currency <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <div className="currency-dropdown-container" style={{ position: 'relative' }}>
                        <button
                          type="button"
                          onClick={toggleCurrencyDropdown}
                          style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '2px solid #e5e7eb',
                            backgroundColor: 'white',
                            cursor: 'pointer',
                            fontSize: '16px'
                          }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ marginRight: '8px', fontSize: '18px' }}>{currencySymbol}</span>
                            <span style={{ fontWeight: '600', color: '#374151' }}>{formData.selectedCurrency}</span>
                            <span style={{ marginLeft: '8px', color: '#6b7280', fontSize: '14px' }}>
                              - {AVAILABLE_CURRENCIES.find(c => c.code === formData.selectedCurrency)?.name}
                            </span>
                          </span>
                          <CssChevronDown />

                        </button>
                        
                        {uiState.showCurrencyDropdown && (
                          <div style={{
                            position: 'absolute',
                            zIndex: '10',
                            marginTop: '8px',
                            width: '100%',
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                            border: '1px solid #e5e7eb',
                            maxHeight: '256px',
                            overflowY: 'auto'
                          }}>
                            <div style={{
                              padding: '8px',
                              borderBottom: '1px solid #e5e7eb'
                            }}>
                              <input
                                type="text"
                                value={uiState.currencySearchQuery}
                                onChange={(e) => setUiState(prev => ({ ...prev, currencySearchQuery: e.target.value }))}
                                placeholder="Search currency..."
                                style={{
                                  width: '100%',
                                  padding: '8px 12px',
                                  borderRadius: '8px',
                                  border: '1px solid #e5e7eb',
                                  fontSize: '14px'
                                }}
                              />
                            </div>
                            <div style={{ padding: '4px' }}>
                              {filteredCurrencies.map((currency) => (
                                <button
                                  key={currency.code}
                                  type="button"
                                  onClick={() => handleCurrencySelect(currency.code)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    width: '100%',
                                    padding: '12px 16px',
                                    textAlign: 'left',
                                    fontSize: '14px',
                                    border: 'none',
                                    backgroundColor: 'transparent',
                                    cursor: 'pointer',
                                    borderRadius: '8px'
                                  }}
                                  onMouseOver={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                                  onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                                >
                                  <span style={{ marginRight: '12px', fontSize: '18px' }}>{currency.symbol}</span>
                                  <span style={{ fontWeight: '500', color: '#374151' }}>{currency.code}</span>
                                  <span style={{ marginLeft: '8px', color: '#6b7280' }}>- {currency.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

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
                        Every contribution makes a meaningful difference
                      </p>
                    </div>
                    
                    {/* Amount buttons */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '12px',
                      marginBottom: '16px'
                    }}>
                      {predefinedAmounts.map((amount, index) => (
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
                          {currencySymbol}{Math.round(Number(amount)).toLocaleString()}
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Amount Input */}
                    <div style={{ position: 'relative' }}>
                      <input
                        type="number"
                        value={formData.customAmount}
                        onChange={(e) => handleCustomAmount(e.target.value)}
                        placeholder="Enter custom amount"
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
                          outline: 'none'
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
                        {currencySymbol}
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
                        {formData.selectedCurrency}
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
                            outline: 'none'
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
                                      fontSize: '14px'
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
                                outline: 'none'
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
                          Email Address <span style={{ color: '#ef4444' }}>*</span>
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
                            outline: 'none'
                          }}
                          required
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
                            resize: 'none'
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
                            outline: 'none'
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
                            outline: 'none'
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
                          {formData.country === "India" ? "Pin Code" : "Zip Code"} <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.pincode}
                          onChange={handlePincodeChange}
                          placeholder={formData.country === "India" ? "eg : 110001" : "eg : 10001"}
                          maxLength={formData.country === "India" ? 6 : 10}
                          style={{
                            width: '100%',
                            padding: '12px 16px',
                            borderRadius: '12px',
                            border: '2px solid #e5e7eb',
                            fontSize: '16px',
                            outline: 'none'
                          }}
                          required
                        />
                      </div>

                      {/* PAN Number (Only for Razorpay) */}
                      {formData.paymentMethod === PaymentMethod.RAZORPAY && (
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
                              textTransform: 'uppercase'
                            }}
                          />
                        </div>
                      )}

                      {/* Country Dropdown (For international) */}
                      {formData.paymentMethod !== PaymentMethod.RAZORPAY && (
                        <div>
                          <label style={{
                            display: 'block',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#374151',
                            marginBottom: '6px'
                          }}>
                            Country <span style={{ color: '#ef4444' }}>*</span>
                          </label>
                          <div className="country-dropdown-container" style={{ position: 'relative' }}>
                            <button
                              type="button"
                              onClick={toggleCountryDropdown}
                              style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '12px 16px',
                                borderRadius: '12px',
                                border: '2px solid #e5e7eb',
                                backgroundColor: 'white',
                                cursor: 'pointer',
                                fontSize: '16px'
                              }}
                            >
                              <span style={{ display: 'flex', alignItems: 'center' }}>
                                <span style={{ marginRight: '12px', fontSize: '18px' }}>
                                  {COUNTRIES.find(c => c.name === formData.country)?.flag || '🌎'}
                                </span>
                                <span style={{ fontWeight: '600', color: '#374151' }}>{formData.country}</span>
                              </span>
                                <CssChevronDown />
                            </button>
                            
                            {uiState.showCountryDropdown && (
                              <div style={{
                                position: 'absolute',
                                zIndex: '10',
                                marginTop: '8px',
                                width: '100%',
                                backgroundColor: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                                border: '1px solid #e5e7eb',
                                maxHeight: '192px',
                                overflowY: 'auto'
                              }}>
                                <div style={{
                                  padding: '8px',
                                  borderBottom: '1px solid #e5e7eb'
                                }}>
                                  <input
                                    type="text"
                                    value={uiState.countrySearchQuery}
                                    onChange={(e) => setUiState(prev => ({ ...prev, countrySearchQuery: e.target.value }))}
                                    placeholder="Search country..."
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      borderRadius: '8px',
                                      border: '1px solid #e5e7eb',
                                      fontSize: '14px'
                                    }}
                                  />
                                </div>
                                <div style={{ padding: '4px' }}>
                                  {filteredCountries.map((country) => (
                                    <button
                                      key={country.code}
                                      type="button"
                                      onClick={() => selectCountry(country)}
                                      style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        width: '100%',
                                        padding: '8px 16px',
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
                                      <span style={{ marginRight: '12px', fontSize: '18px' }}>{country.flag}</span>
                                      <span style={{ color: '#374151', fontWeight: '500' }}>{country.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

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
                    disabled={!areRequiredFieldsFilled() || uiState.isSubmitting}
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
                      cursor: areRequiredFieldsFilled() && !uiState.isSubmitting ? 'pointer' : 'not-allowed',
                      backgroundColor: areRequiredFieldsFilled() && !uiState.isSubmitting
                        ? '#f59e0b' 
                        : '#e5e7eb',
                      color: areRequiredFieldsFilled() && !uiState.isSubmitting
                        ? 'white'
                        : '#9ca3af',
                      marginBottom: '16px',
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
                        <Heart style={{ height: '20px', width: '20px', marginRight: '12px' }} />
                        Donate {currencySymbol}{Math.round(formData.localAmount).toLocaleString()}
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
                      {formData.paymentMethod === PaymentMethod.RAZORPAY 
                        ? <span style={{ backgroundColor: '#6366f1', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Razorpay</span>
                        : <span style={{ backgroundColor: '#3b82f6', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>Stripe</span>}
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
                ...(message.includes('successful') || message.includes('Thank you') 
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
      )}
    </div>
  );
}
    
export default App;

