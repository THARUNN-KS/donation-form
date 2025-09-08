import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import './App.css';

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

const ChevronDown = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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

const X = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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

  // Razorpay payment handler
  const initializeRazorpayPayment = async () => {
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
  };

  // Stripe payment handler
  const initializeStripePayment = async () => {
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
  };

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
      await initializeRazorpayPayment();
    } else if (formData.paymentMethod === PaymentMethod.STRIPE) {
      await initializeStripePayment();
    }
  }, [formData, areRequiredFieldsFilled, uiState.isSubmitting]);

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
    <div className="min-h-screen bg-gray-100" style={{ fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif' }}>
      {/* Main Donation Button */}
      {!isModalOpen && (
        <div className="flex items-center justify-center min-h-screen p-4">
          <div className="text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-6">
              Support Our Cause
            </h1>
            <p className="text-gray-600 mb-8 max-w-md">
              Your donation makes a difference in the lives of those who need it most. Every contribution counts.
            </p>
            
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 hover:from-yellow-500 hover:via-orange-600 hover:to-red-600 text-white font-bold py-4 px-8 rounded-2xl text-xl shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center mx-auto"
            >
              <Heart className="h-6 w-6 mr-3" />
              Donate Now
            </button>
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  {currentStep === 2 ? "Back to Citizenship" : currentStep === 3 ? (formData.isIndian ? "Back to Currency" : "Back to Citizenship") : "Back to Campaign"}
                </button>
              )}
              
              {currentStep === 1 && (
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex items-center text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Campaign
                </button>
              )}

              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-auto"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Step 1: Citizenship Selection */}
              {currentStep === 1 && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Globe className="h-8 w-8 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-700 mb-2">
                    Choose Your Citizenship
                  </h2>
                  <p className="text-gray-500 text-sm mb-8">
                    This helps us provide the best payment options for you
                  </p>
                  
                  <div className="space-y-4">
                    <button
                      onClick={() => handleCitizenshipSelect(true)}
                      className="w-full flex items-center p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 group"
                    >
                      <div className="text-2xl mr-4">🇮🇳</div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">Indian Citizen</h3>
                        <p className="text-sm text-gray-500 mt-1">Indian passport holder or resident</p>
                        <p className="text-xs text-green-600 mt-1 font-medium">✓ Tax benefits available</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => handleCitizenshipSelect(false)}
                      className="w-full flex items-center p-4 rounded-xl border border-gray-200 hover:bg-gray-50 transition-all duration-200 group"
                    >
                      <div className="text-2xl mr-4">🌎</div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">Foreign Citizen</h3>
                        <p className="text-sm text-gray-500 mt-1">Non-Indian passport holder</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Currency Selection */}
              {currentStep === 2 && (
                <div className="text-center">
                  <div className="w-16 h-16 bg-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <CreditCard className="h-8 w-8 text-white" />
                  </div>
                  
                  <h2 className="text-2xl font-bold text-gray-700 mb-8">
                    Choose Your Donation Currency
                  </h2>
                  
                  <div className="space-y-4">
                    <button
                      onClick={() => handlePaymentMethodSelect(PaymentMethod.RAZORPAY)}
                      className="w-full flex items-center p-4 rounded-xl border border-gray-200 hover:bg-orange-50 transition-all duration-200 group"
                    >
                      <div className="w-12 h-12 bg-orange-400 rounded-xl flex items-center justify-center mr-4">
                        <span className="text-white font-bold text-lg">₹</span>
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">Donate in INR</h3>
                      </div>
                    </button>

                    <button
                      onClick={() => handlePaymentMethodSelect(PaymentMethod.STRIPE)}
                      className="w-full flex items-center p-4 rounded-xl border border-gray-200 hover:bg-orange-50 transition-all duration-200 group"
                    >
                      <div className="w-12 h-12 bg-orange-400 rounded-xl flex items-center justify-center mr-4">
                        <Globe className="h-6 w-6 text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="font-semibold text-gray-800 text-lg">Donate in Other Currencies</h3>
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Donation Form */}
              {currentStep === 3 && (
                <div>
                  {/* Payment Method Header */}
                  <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-4 rounded-2xl mb-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mr-3">
                          <span className="font-bold">
                            {formData.paymentMethod === PaymentMethod.RAZORPAY ? '₹' : getCurrencySymbol(formData.selectedCurrency)}
                          </span>
                        </div>
                        <div>
                          <p className="font-bold text-sm">
                            {formData.isIndian 
                              ? (formData.paymentMethod === PaymentMethod.RAZORPAY 
                                ? 'Indian Citizen - INR Payment' 
                                : 'Indian Citizen - International Payment')
                              : 'Foreign Citizen'}
                          </p>
                          <p className="text-xs text-white text-opacity-80 mt-1">
                            {formData.paymentMethod === PaymentMethod.RAZORPAY 
                              ? 'Secure payment via Razorpay in INR' 
                              : `International payment via Stripe in ${formData.selectedCurrency}`}
                          </p>
                        </div>
                      </div>
                      {formData.isIndian && (
                        <button 
                          onClick={() => setCurrentStep(2)}
                          className="text-xs text-white text-opacity-80 hover:text-white bg-white bg-opacity-10 px-3 py-1 rounded-full border border-white border-opacity-20 hover:bg-opacity-20 transition-all duration-200"
                        >
                          Change
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Currency Selector - Only for Stripe */}
                  {formData.paymentMethod === PaymentMethod.STRIPE && (
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Currency <span className="text-red-500">*</span>
                      </label>
                      <div className="relative dropdown-container currency-dropdown-container">
                        <button
                          type="button"
                          onClick={toggleCurrencyDropdown}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-400 transition-all duration-200"
                        >
                          <span className="flex items-center">
                            <span className="mr-2 text-lg">{currencySymbol}</span>
                            <span className="font-semibold text-gray-700">{formData.selectedCurrency}</span>
                            <span className="ml-2 text-gray-500 text-sm">- {AVAILABLE_CURRENCIES.find(c => c.code === formData.selectedCurrency)?.name}</span>
                          </span>
                          <ChevronDown className="h-4 w-4 text-gray-400" />
                        </button>
                        
                        {uiState.showCurrencyDropdown && (
                          <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-64 overflow-y-auto">
                            <div className="p-2 border-b border-gray-100">
                              <input
                                type="text"
                                value={uiState.currencySearchQuery}
                                onChange={(e) => setUiState(prev => ({ ...prev, currencySearchQuery: e.target.value }))}
                                placeholder="Search currency..."
                                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                              />
                            </div>
                            <div className="py-1">
                              {filteredCurrencies.map((currency) => (
                                <button
                                  key={currency.code}
                                  type="button"
                                  onClick={() => handleCurrencySelect(currency.code)}
                                  className="flex items-center w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-all duration-200"
                                >
                                  <span className="mr-3 text-lg">{currency.symbol}</span>
                                  <span className="font-medium text-gray-700">{currency.code}</span>
                                  <span className="ml-2 text-gray-500">- {currency.name}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Amount Selection */}
                  <div className="mb-6">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold text-gray-700 mb-2">
                        Choose Your Donation Amount
                      </h2>
                      <p className="text-gray-500 text-sm">Every contribution makes a meaningful difference</p>
                    </div>
                    
                    {/* Amount buttons */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {predefinedAmounts.map((amount, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleAmountSelect(amount)}
                          className={`relative py-4 px-3 rounded-xl transition-all duration-200 ${
                            Math.round(Number(formData.localAmount)) === Math.round(Number(amount)) && !uiState.isCustomAmount
                              ? 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-lg'
                              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
                          } focus:outline-none`}
                        >
                          {index === 1 && (
                            <div className="absolute -top-1 left-0 right-0 flex justify-center">
                              <span className="bg-green-500 text-xs font-bold px-2 py-0.5 rounded-full text-white flex items-center gap-1">
                                <Star className="h-2 w-2" />
                                Popular
                              </span>
                            </div>
                          )}
                          <div className="text-lg font-bold">
                            {currencySymbol}{Math.round(Number(amount)).toLocaleString()}
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {/* Custom Amount Input */}
                    <div className="relative">
                      <input
                        type="number"
                        value={formData.customAmount}
                        onChange={(e) => handleCustomAmount(e.target.value)}
                        placeholder="Enter custom amount"
                        min="1"
                        step="1"
                        className={`w-full pl-12 pr-16 py-3 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                          uiState.isCustomAmount 
                            ? 'border-orange-300 bg-orange-50' 
                            : 'border-gray-200 focus:border-blue-400'
                        }`}
                      />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="text-gray-500 font-bold">{currencySymbol}</span>
                      </div>
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-gray-400 text-sm">{formData.selectedCurrency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Personal Details */}
                  <div className="space-y-4 mb-6">
                    <div className="text-center mb-4">
                      <h2 className="text-xl font-bold text-gray-700 mb-2">
                        Your Details
                      </h2>
                      <p className="text-gray-500 text-sm">We'll use this information for your donation receipt</p>
                    </div>

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleFormFieldChange('name', e.target.value)}
                        placeholder="Enter your full name"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-400 transition-all duration-200"
                        required
                      />
                    </div>
                    
                    {/* Phone Number */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Mobile Number <span className="text-red-500">*</span>
                      </label>
                      <div className="flex space-x-2">
                        {/* Country Code Dropdown */}
                        <div className="relative country-code-dropdown-container dropdown-container w-20 flex-shrink-0">
                          <button
                            type="button"
                            onClick={toggleCountryCodeDropdown}
                            className="w-full h-12 flex items-center justify-center px-2 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-400 transition-all duration-200"
                          >
                            <span className="text-xs font-semibold truncate">{formData.countryCode}</span>
                          </button>
                          
                          {uiState.showCountryCodeDropdown && (
                            <div className="absolute z-30 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 overflow-y-auto left-0">
                              <div className="p-2 border-b border-gray-100">
                                <input
                                  type="text"
                                  value={uiState.countryCodeSearchQuery}
                                  onChange={(e) => setUiState(prev => ({ ...prev, countryCodeSearchQuery: e.target.value }))}
                                  placeholder="Search country..."
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                                />
                              </div>
                              <div className="py-1">
                                {filteredCountryCodes.map((countryCode) => (
                                  <button
                                    key={countryCode.code + countryCode.country}
                                    type="button"
                                    onClick={() => selectCountryCode(countryCode)}
                                    className="flex items-center w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-all duration-200"
                                  >
                                    <span className="mr-2 text-sm">{countryCode.flag}</span>
                                    <span className="truncate text-xs text-gray-600">{countryCode.country}</span>
                                    <span className="ml-auto font-semibold text-gray-800 text-xs">{countryCode.code}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Phone Input */}
                        <div className="flex-1 min-w-0">
                          <input
                            type="tel"
                            value={formData.phone}
                            onChange={handlePhoneChange}
                            placeholder="Enter your mobile number"
                            className={`w-full h-12 px-4 rounded-xl border-2 focus:outline-none transition-all duration-200 ${
                              hasTouchedPhone && phoneError
                                ? 'border-red-300 focus:border-red-400'
                                : 'border-gray-200 focus:border-blue-400'
                            }`}
                            required
                          />
                        </div>
                      </div>
                      {hasTouchedPhone && phoneError && (
                        <p className="text-xs text-red-500 mt-1">{phoneError}</p>
                      )}
                    </div>
                    
                    {/* Email */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={handleEmailChange}
                        onBlur={handleEmailBlur}
                        placeholder="Enter your email address"
                        className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-all duration-200 ${
                          hasEmailTouched && emailError
                            ? 'border-red-300 focus:border-red-400'
                            : 'border-gray-200 focus:border-blue-400'
                        }`}
                        required
                      />
                      {hasEmailTouched && emailError && (
                        <p className="text-xs text-red-500 mt-1">{emailError}</p>
                      )}
                    </div>

                    {/* Address */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Address <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => handleFormFieldChange('address', e.target.value)}
                        placeholder="Enter your street address"
                        rows={2}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-400 transition-all duration-200 resize-none"
                        required
                      />
                    </div>
                    
                    {/* City */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        City <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => handleFormFieldChange('city', e.target.value)}
                        placeholder="Enter your city"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-400 transition-all duration-200"
                        required
                      />
                    </div>
                    
                    {/* State */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        State <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.state}
                        onChange={(e) => handleFormFieldChange('state', e.target.value)}
                        placeholder="Enter your state"
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-400 transition-all duration-200"
                        required
                      />
                    </div>
                    
                    {/* Pincode */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {formData.country === "India" ? "Pin Code" : "Zip Code"} <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.pincode}
                        onChange={handlePincodeChange}
                        placeholder={formData.country === "India" ? "eg : 110001" : "eg : 10001"}
                        maxLength={formData.country === "India" ? 6 : 10}
                        className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-400 transition-all duration-200"
                        required
                      />
                    </div>

                    {/* PAN Number (Only for Razorpay) */}
                    {formData.paymentMethod === PaymentMethod.RAZORPAY && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          PAN Number (If you want to avail 80G tax exemption, please provide PAN )
                        </label>
                        <input
                          type="text"
                          value={formData.panNumber}
                          placeholder="ENTER PAN NUMBER (E.G., ABCTY1234D)"
                          onChange={handlePanNumberChange}
                          maxLength={10}
                          className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-400 transition-all duration-200 uppercase placeholder-gray-400"
                        />
                      </div>
                    )}

                    {/* Country Dropdown (For international) */}
                    {formData.paymentMethod !== PaymentMethod.RAZORPAY && (
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Country <span className="text-red-500">*</span>
                        </label>
                        <div className="relative dropdown-container country-dropdown-container">
                          <button
                            type="button"
                            onClick={toggleCountryDropdown}
                            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-400 transition-all duration-200"
                          >
                            <span className="flex items-center">
                              <span className="mr-3 text-lg">
                                {COUNTRIES.find(c => c.name === formData.country)?.flag || '🌎'}
                              </span>
                              <span className="font-semibold text-gray-700">{formData.country}</span>
                            </span>
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          </button>
                          
                          {uiState.showCountryDropdown && (
                            <div className="absolute z-10 mt-2 w-full bg-white rounded-xl shadow-lg border border-gray-200 max-h-48 overflow-y-auto">
                              <div className="p-2 border-b border-gray-100">
                                <input
                                  type="text"
                                  value={uiState.countrySearchQuery}
                                  onChange={(e) => setUiState(prev => ({ ...prev, countrySearchQuery: e.target.value }))}
                                  placeholder="Search country..."
                                  className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-blue-400"
                                />
                              </div>
                              <div className="py-1">
                                {filteredCountries.map((country) => (
                                  <button
                                    key={country.code}
                                    type="button"
                                    onClick={() => selectCountry(country)}
                                    className="flex items-center w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-all duration-200"
                                  >
                                    <span className="mr-3 text-lg">{country.flag}</span>
                                    <span className="text-gray-700 font-medium">{country.name}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Anonymous Donation Checkbox */}
                    <div className="mt-4">
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input 
                            type="checkbox" 
                            checked={formData.isAnonymous}
                            onChange={(e) => handleAnonymousToggle(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                            formData.isAnonymous 
                              ? 'bg-blue-500 border-blue-500' 
                              : 'bg-white border-gray-300'
                          }`}>
                            {formData.isAnonymous && (
                              <CheckCircle className="h-4 w-4 text-white absolute -inset-0" />
                            )}
                          </div>
                        </div>
                        <span className="ml-3 text-sm text-gray-600">
                          Make my donation anonymous ( your name won't be displayed publicly )
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Donate Button */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!areRequiredFieldsFilled() || uiState.isSubmitting}
                    className={`
                      w-full flex items-center justify-center px-6 py-4 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg mb-4
                      ${areRequiredFieldsFilled() && !uiState.isSubmitting
                        ? 'bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-orange-200 hover:shadow-xl' 
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'}
                    `}
                  >
                    {uiState.isSubmitting ? (
                      <div className="flex items-center">
                        <Loader2 className="animate-spin h-5 w-5 mr-3" />
                        Processing...
                      </div>
                    ) : (
                      <span className="flex items-center">
                        <Heart className="h-5 w-5 mr-3" />
                        Donate {currencySymbol}{Math.round(formData.localAmount).toLocaleString()}
                      </span>
                    )}
                  </button>

                  {/* Security Notice */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-gray-50 rounded-xl py-2 px-4 flex items-center text-sm text-gray-600">
                      <Lock className="h-4 w-4 mr-2 text-green-500" />
                      <span className="mr-2">Secure payment powered by</span>
                      {formData.paymentMethod === PaymentMethod.RAZORPAY 
                        ? <span className="bg-indigo-600 text-white px-2 py-1 rounded text-xs font-bold">Razorpay</span>
                        : <span className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-bold">Stripe</span>}
                    </div>
                  </div>

                  {/* Trust Badges */}
                  <div className="grid grid-cols-3 gap-3">
                    {TRUST_BADGES.map((badge, index) => (
                      <div key={index} className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <badge.icon className="h-4 w-4 text-orange-500" />
                        </div>
                        <h4 className="text-xs font-bold text-gray-700">
                          {badge.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {badge.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Message Display */}
              {message && (
                <div className={`mt-4 p-3 rounded-xl text-center text-sm font-medium ${
                  message.includes('successful') || message.includes('Thank you') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : message.includes('Error') || message.includes('cancelled') 
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;