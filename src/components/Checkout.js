import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import styles from './Checkout.module.css';
import { Coffee, AlertTriangle } from 'lucide-react';

export default function Checkout({ onClose, onBack }) {
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState('form');
  const [orderId, setOrderId] = useState(null);
  const [orderStatus, setOrderStatus] = useState('preparing');
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [form, setForm] = useState({
    name: '', email: '',
    cardNumber: '', expiry: '', cvc: '', address: '', phone: '',
    postcode: '', location: '', deliveryType: 'postcode'
  });
  const [orderType, setOrderType] = useState('dine-in');
  const [errors, setErrors] = useState({});
  const [storeRating, setStoreRating] = useState(5);
  const [storeComment, setStoreComment] = useState('');
  const [outOfStockError, setOutOfStockError] = useState(null);

  // Offers State
  const [offers, setOffers] = useState([]);
  const [customerType, setCustomerType] = useState('General');
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offerError, setOfferError] = useState(null);

  const [savedProfiles, setSavedProfiles] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const formatPrice = (n) => {
    const val = parseFloat(n) || 0;
    return "JOD " + val.toFixed(2);
  };
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Fetch active offers from backend
    fetch('/api/offers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOffers(data);
      })
      .catch(err => console.error('Error fetching offers:', err));

    // Load saved customer profiles (array)
    try {
      const raw = localStorage.getItem('caffaine_profiles');
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) setSavedProfiles(arr);
      } else {
        // Migrate old single-profile format
        const savedName = localStorage.getItem('caffaine_customer_name');
        if (savedName) {
          const legacy = {
            name: savedName,
            phone: localStorage.getItem('caffaine_customer_phone') || '',
            email: localStorage.getItem('caffaine_customer_email') || '',
            cardNumber: localStorage.getItem('caffaine_customer_cardNumber') || '',
            expiry: localStorage.getItem('caffaine_customer_expiry') || '',
            cvc: localStorage.getItem('caffaine_customer_cvc') || ''
          };
          setSavedProfiles([legacy]);
          localStorage.setItem('caffaine_profiles', JSON.stringify([legacy]));
        }
      }
    } catch(e) {}
  }, []);

  const showOfferError = (msg) => {
    setOfferError(msg);
    setTimeout(() => setOfferError(null), 4000);
  };

  const handleOfferClick = (offer) => {
    if (selectedOffer?.id === offer.id) {
      setSelectedOffer(null);
      setOfferError(null);
      return;
    }

    // Validation
    const hasItem = items.some(item => {
      const itemName = item.name.toLowerCase();
      const offerProd = offer.product_name.toLowerCase();
      return itemName.includes(offerProd) || offerProd.includes(itemName) || offerProd === 'all';
    });

    const isStudentOffer = offer.reason.toLowerCase().includes('student');
    const isEmployeeOffer = offer.reason.toLowerCase().includes('corporate') || offer.reason.toLowerCase().includes('employee') || offer.reason.toLowerCase().includes('faculty');

    if (!hasItem) {
      showOfferError(`❌ This offer requires "${offer.product_name}" in your cart.`);
      return;
    }

    if (isStudentOffer && customerType !== 'Student') {
      showOfferError('🎓 This offer is for students only — please select the "Student" category.');
      return;
    }

    if (isEmployeeOffer && customerType !== 'Employee') {
      showOfferError('🏢 This offer is for staff/faculty/employees only.');
      return;
    }

    setOfferError(null);
    setSelectedOffer(offer);
  };

  const discountAmount = items.reduce((acc, item) => {
    if (selectedOffer) {
      const itemName = (item.name || "").toLowerCase();
      const offerProd = (selectedOffer.product_name || "").toLowerCase();
      const matches = itemName.includes(offerProd) || offerProd.includes(itemName) || offerProd === 'all';
      if (matches) {
        return acc + (item.priceNum * item.qty * (selectedOffer.discount_percent / 100));
      }
    }
    return acc;
  }, 0);

  const subtotalAfterDiscount = totalPrice - discountAmount;
  const DELIVERY_FEE = 3.00;
  const finalPrice = orderType === 'delivery' ? subtotalAfterDiscount + DELIVERY_FEE : subtotalAfterDiscount;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    let interval;
    if (step === 'success' && orderId) {
      // ✅ Set immediately to 120s so timer starts before server responds
      setTimeRemaining(prev => prev === 0 ? 120 : prev);

      const syncWithServer = async () => {
        try {
          const res = await fetch(`/api/order-status/${orderId}`);
          const data = await res.json();
          if (data.status) setOrderStatus(data.status);

          // ✅ Always accept server value (covers both countdown AND admin extensions)
          if (typeof data.seconds_left === 'number'
              && data.status !== 'ready' && data.status !== 'completed') {
            setTimeRemaining(data.seconds_left > 0 ? data.seconds_left : 0);
          }
        } catch (err) {
          console.error('Sync Error:', err);
        }
      };

      syncWithServer();
      interval = setInterval(syncWithServer, 2000); // ✅ Every 2s for fast extension response
    }
    return () => clearInterval(interval);
  }, [step, orderId]);

  useEffect(() => {
    if (step === 'success' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(t => t - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeRemaining]);

  function formatCardNumber(v) {
    return v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  }
  function formatExpiry(v) {
    const d = v.replace(/\D/g, '').slice(0, 4);
    if (d.length >= 3) return `${d.slice(0, 2)}/${d.slice(2)}`;
    return d;
  }

  function handleChange(e) {
    let { name, value } = e.target;
    if (name === 'cardNumber') value = formatCardNumber(value);
    if (name === 'expiry') value = formatExpiry(value);
    if (name === 'cvc') value = value.replace(/\D/g, '').slice(0, 4);
    setForm(f => ({ ...f, [name]: value }));
    setErrors(err => ({ ...err, [name]: '' }));
  }

  function validate() {
    const e = {};
    const safeName = (form.name || '').trim();
    const safeEmail = (form.email || '').trim();
    const safePhone = (form.phone || '').trim();

    if (!safeName) e.name = 'Name is required';

    // Email is optional
    if (safeEmail && !safeEmail.includes('@')) {
      e.email = 'Invalid email format';
    }

    // Phone is MANDATORY
    if (!safePhone) {
      e.phone = 'Phone number is required';
    }

    const rawCard = (form.cardNumber || '').replace(/\s/g, '');
    if (rawCard.length < 16) e.cardNumber = 'Enter 16 digits';
    // Expiry Validation
    const expiryMatch = (form.expiry || '').match(/^(\d{2})\/(\d{2})$/);
    if (!expiryMatch) {
      e.expiry = 'Use MM/YY format';
    } else {
      const month = parseInt(expiryMatch[1]);
      const year  = parseInt(expiryMatch[2]);
      const currentYear  = new Date().getFullYear() % 100; // e.g. 26
      const currentMonth = new Date().getMonth() + 1;
      if (month < 1 || month > 12) {
        e.expiry = 'Month must be 01–12';
      } else if (year < currentYear || (year === currentYear && month < currentMonth)) {
        e.expiry = 'Card has expired';
      } else if (year > currentYear + 10) {
        e.expiry = 'Invalid expiry year';
      }
    }
    if ((form.cvc || '').length < 3) e.cvc = 'CVC required';

    if (orderType === 'delivery') {
      if (form.deliveryType === 'postcode' && !(form.postcode || '').trim()) {
        e.postcode = 'Postcode is required';
      }
      if (form.deliveryType === 'location' && !(form.location || '').trim()) {
        e.location = 'Please share your location';
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function saveOrderToBackend() {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: (form.name || '').trim(),
          email: (form.email || '').trim() || null,
          total_amount: finalPrice,
          cartItems: items.map(item => {
            let finalName = item.name;
            if (item.addons && item.addons.length > 0) {
              const addonNames = item.addons.map(a => a.name).join(', ');
              finalName = `${item.name} (+ ${addonNames})`;
            }

            // Calculate item price after potential discount
            let itemPrice = item.priceNum;
            if (selectedOffer) {
              const itemName = (item.name || "").toLowerCase();
              const offerProd = (selectedOffer.product_name || "").toLowerCase();
              const matches = itemName.includes(offerProd) || offerProd.includes(itemName) || offerProd === 'all';
              if (matches) {
                itemPrice = item.priceNum * (1 - (selectedOffer.discount_percent / 100));
              }
            }

            return {
              id: item.id,
              name: finalName,
              qty: item.qty,
              priceNum: itemPrice,
              addons: item.addons || []
            };
          }),
          order_type: orderType,
          delivery_address: orderType === 'delivery'
            ? (form.deliveryType === 'postcode' ? `Postcode: ${form.postcode}` : `GPS: ${form.location}`)
            : null,
          phone: form.phone.trim() // Always send phone
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        if (response.status === 409 && result.outOfStock) {
          setOutOfStockError(result.error);
          return 'outofstock';
        }
        throw new Error(result.error || 'Failed to save order');
      }

      if (result.success) {
        setOrderId(result.orderId);
        setTimeRemaining(120);
        return 'success';
      }
      return 'error';
    } catch (error) {
      console.error('API Error:', error);
      return 'error';
    }
  }
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setStep('processing');

    await new Promise(r => setTimeout(r, 1500));
    const resultStatus = await saveOrderToBackend();

    if (resultStatus === 'success') {
      clearCart();
      setStep('success');

      // Save customer info — add to profiles array (no duplicates by name)
      try {
        const raw = localStorage.getItem('caffaine_profiles');
        let profiles = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(profiles)) profiles = [];
        const newProfile = {
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          cardNumber: form.cardNumber,
          expiry: form.expiry,
          cvc: form.cvc
        };
        // Remove old entry with same name, then add updated one at top
        profiles = profiles.filter(p => p.name.toLowerCase() !== newProfile.name.toLowerCase());
        profiles.unshift(newProfile);
        // Keep max 10 profiles
        if (profiles.length > 10) profiles = profiles.slice(0, 10);
        localStorage.setItem('caffaine_profiles', JSON.stringify(profiles));
        setSavedProfiles(profiles);
      } catch(e) {}

      // Submit feedback if a rating was given (only once)
      if (storeRating > 0 || storeComment.trim()) {
        fetch('/api/feedback/general', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reviewer_name: form.name.trim() || 'Customer',
            comment: storeComment,
            rating: storeRating
          })
        }).catch(err => console.error('Feedback error:', err));
      }
    } else if (resultStatus === 'outofstock') {
      setStep('outofstock');
    } else {
      setStep('error');
    }
  }

  if (step === 'success') {
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ borderRadius: '30px', overflow: 'hidden' }}>
          <div className={styles.modalBody} style={{ padding: '40px 30px', textAlign: 'center' }}>
            
            {(orderStatus === 'ready' || orderStatus === 'completed') ? (
              /* LUXURY READY CARD */
              <div className={styles.readyCard} style={{ animation: 'fadeIn 0.5s ease' }}>
                <div className={styles.successRing}>
                  <div className={styles.ringInner} />
                  <div className={styles.ringOuter} />
                  <div style={{ 
                    width: '80px', height: '80px', borderRadius: '50%', 
                    background: 'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 10px 25px rgba(56, 239, 125, 0.4)', zIndex: 2
                  }}>
                    <i className="fas fa-check" style={{ color: '#fff', fontSize: '2.5rem' }} />
                  </div>
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.5rem', color: '#2c1810', margin: '20px 0 10px', fontWeight: '900' }}>Perfectly Ready!</h2>
                <p style={{ color: '#666', fontSize: '1.1rem', marginBottom: '30px' }}>Your exquisite order is prepared and waiting at the counter.</p>
              </div>
            ) : (
              /* LUXURY COUNTDOWN CARD */
              <div style={{ animation: 'fadeIn 0.5s ease' }}>
                <div className={styles.successIcon} style={{
                  margin: '0 auto 25px', width: '80px', height: '80px',
                  backgroundColor: 'rgba(56, 239, 125, 0.1)', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '3rem', color: '#38ef7d', boxShadow: '0 0 30px rgba(56, 239, 125, 0.2)'
                }}>
                  <i className="fas fa-magic" />
                </div>
                <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.2rem', color: '#2c1810', marginBottom: '10px' }}>Order Placed!</h2>
                <p style={{ color: '#888', marginBottom: '30px' }}>Your order <strong>#{orderId}</strong> is being prepared.</p>
                
                <div style={{ 
                  background: '#fcf6ef', padding: '30px', borderRadius: '25px', 
                  border: '1px solid rgba(196, 164, 132, 0.2)', marginBottom: '20px'
                }}>
                  <div style={{ fontSize: '3rem', fontWeight: '900', color: '#2c1810', letterSpacing: '-1px' }}>
                    {formatTime(timeRemaining)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#c4a484', fontWeight: '800', textTransform: 'uppercase', marginTop: '5px' }}>
                    Estimated Prep Time
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '30px', color: '#c4a484', fontSize: '0.9rem', fontWeight: 'bold' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: (orderStatus === 'ready' || orderStatus === 'completed') ? '#38ef7d' : '#f59e0b', animation: 'pulse 1.5s infinite' }} />
              Live Status: <span style={{ color: '#2c1810' }}>{orderStatus.toUpperCase()}</span>
            </div>

            <button className="btn btn-primary" onClick={onClose} style={{
              width: '100%', padding: '20px', borderRadius: '18px',
              background: 'linear-gradient(135deg, #2c1810, #5a3500)', color: '#fff', border: 'none',
              fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(44, 24, 16, 0.2)'
            }}>
              Return to Menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'outofstock') {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        backgroundColor: 'rgba(10, 6, 4, 0.97)',
        backdropFilter: 'blur(20px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#ffffff', textAlign: 'center', padding: '30px',
        animation: 'fadeIn 0.5s ease'
      }}>
        <div style={{ maxWidth: '500px', width: '100%', direction: 'ltr' }}>
          {/* Elegant Shimmering Bar */}
          <div style={{
            height: '4px',
            background: 'linear-gradient(90deg, #c4a484, #5a3500, #c4a484)',
            borderRadius: '2px',
            marginBottom: '30px'
          }} />

          {/* Animated Gold Coffee Cup */}
          <div style={{ 
            color: '#c4a484', 
            marginBottom: '25px', 
            display: 'flex', 
            justifyContent: 'center',
            animation: 'float 3s ease-in-out infinite' 
          }}>
            <Coffee size={85} strokeWidth={1} />
          </div>

          <style>{`
            @keyframes float {
              0% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
              100% { transform: translateY(0px); }
            }
          `}</style>

          <h2 style={{ 
            fontFamily: "'DM Serif Display', serif", 
            fontSize: '2.5rem', 
            marginBottom: '20px', 
            color: '#ffffff',
            fontWeight: 'normal',
            letterSpacing: '0.5px'
          }}>
            Selection Sold Out
          </h2>

          <p style={{ 
            fontSize: '1.1rem', 
            lineHeight: '1.75', 
            opacity: 0.9, 
            marginBottom: '35px', 
            fontWeight: '300',
            color: '#f3ece5'
          }}>
            Because we handcraft our brews and bake our pastries fresh daily to guarantee the finest experience, it seems an item in your order has <strong>just sold out</strong>.
            <br />
            <span style={{ fontSize: '0.95rem', opacity: 0.8, display: 'block', marginTop: '10px' }}>
              (You added this item to your cart before it went out of stock. We sincerely apologize for any inconvenience caused.)
            </span>
          </p>

          {/* Details Card */}
          <div style={{ 
            padding: '25px', 
            border: '1px solid rgba(196, 164, 132, 0.25)', 
            borderRadius: '22px', 
            backgroundColor: 'rgba(196, 164, 132, 0.06)',
            boxShadow: '0 15px 35px rgba(0,0,0,0.6)',
            marginBottom: '35px',
            textAlign: 'left'
          }}>
            <p style={{ 
              fontWeight: '900', 
              textTransform: 'uppercase', 
              fontSize: '0.85rem', 
              letterSpacing: '2px', 
              marginBottom: '12px', 
              color: '#c4a484',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={16} /> INVENTORY DETAILS:
            </p>
            <div style={{ 
              fontSize: '1rem', 
              color: '#ffffff', 
              lineHeight: '1.6',
              fontWeight: '500',
              fontStyle: 'italic',
              background: 'rgba(0,0,0,0.2)',
              padding: '12px 15px',
              borderRadius: '12px',
              borderLeft: '4px solid #c4a484'
            }}>
              {outOfStockError || 'We apologize, but the requested item is currently unavailable.'}
            </div>
          </div>

          {/* Action Button */}
          <button 
            onClick={() => {
              setStep('form');
              if (onBack) onBack(); // Go back to cart so they can edit it!
            }} 
            style={{
              width: '100%', 
              padding: '18px', 
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #c4a484, #8b6c4c)', 
              color: '#0a0604', 
              border: 'none',
              fontWeight: '900', 
              fontSize: '1.1rem', 
              cursor: 'pointer',
              boxShadow: '0 10px 25px rgba(196, 164, 132, 0.25)',
              transition: 'all 0.3s'
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            Adjust Cart & Try Again
          </button>
        </div>
      </div>
    );
  }

  if (step === 'error') {
    return (
      <div className={styles.overlay} onClick={() => setStep('form')}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.errorScreen} style={{ padding: '40px 20px', textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', color: '#e74a3b', marginBottom: '20px' }}>
              <i className="fas fa-exclamation-circle" />
            </div>
            <h2 style={{ fontFamily: 'serif', fontSize: '2rem', color: '#2c1810', marginBottom: '10px' }}>Oops! Payment Failed</h2>
            <p style={{ color: '#666', marginBottom: '30px' }}>Something went wrong while processing your order. Please check your details and try again.</p>
            <button
              className="btn btn-primary"
              onClick={() => setStep('form')}
              style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#2c1810', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className={styles.overlay}><div className={styles.modal}>
        <div className={styles.processingScreen} style={{ textAlign: 'center', padding: '50px 20px' }}>
          <div className={styles.spinner} style={{ margin: '0 auto 20px' }} />
          <p style={{ fontSize: '1.2rem', color: '#2c1810', fontWeight: 'bold' }}>Processing Payment...</p>
        </div>
      </div></div>
    );
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={`${styles.modal} ${styles.mainModal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHead}>
          <button className={styles.backBtn} onClick={onBack}><i className="fas fa-arrow-left" /> Back</button>
          <h2 className={styles.modalTitle}>Checkout</h2>
          <button className={styles.closeBtn} onClick={onClose}><i className="fas fa-times" /></button>
        </div>

        <div className={styles.modalBody} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* 1. Order Summary Section */}
          <div className={styles.orderSummary} style={{ marginBottom: '0', padding: '20px', backgroundColor: '#fcf6ef', borderRadius: '20px', border: '1px solid rgba(196, 164, 132, 0.1)' }}>
            <div className={styles.summaryLabel} style={{ marginBottom: '15px', color: '#2c1810', fontWeight: '900' }}>Order Summary</div>
            {items.map(item => (
              <div key={item.id} className={styles.sumItem} style={{ marginBottom: '8px' }}>
                <span style={{ color: '#555' }}>{item.name} × {item.qty}</span>
                <span style={{ fontWeight: 'bold' }}>{formatPrice(item.priceNum * item.qty)}</span>
              </div>
            ))}
            
            {/* Slim Estimated Timer */}
            <div style={{ 
              marginTop: '15px', padding: '12px', background: '#fff', 
              borderRadius: '12px', border: '1px solid rgba(196, 164, 132, 0.2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: '800', color: '#c4a484', textTransform: 'uppercase' }}>
                <i className="fas fa-clock" style={{ marginRight: '6px' }} /> Est. Prep Time
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: '900', color: '#2c1810' }}>
                {formatTime(timeRemaining)}
              </div>
            </div>

            {selectedOffer && (
              <div className={styles.sumItem} style={{ color: '#c4a484', fontWeight: 'bold', marginTop: '10px' }}>
                <span>Discount ({selectedOffer.discount_percent}%)</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}

            {orderType === 'delivery' && (
              <div className={styles.sumItem} style={{ marginTop: '5px' }}>
                <span>Delivery Fee</span>
                <span>{formatPrice(DELIVERY_FEE)}</span>
              </div>
            )}

            <div className={styles.sumTotal} style={{ marginTop: '15px', borderTop: '1px dashed #c4a484', paddingTop: '15px' }}>
              <span style={{ fontWeight: 'bold', color: '#2c1810' }}>Total</span>
              <span className={styles.sumTotalAmt} style={{ color: '#c4a484' }}>{formatPrice(finalPrice)}</span>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Order Type Selection */}
            <div className={styles.formSection} style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #eee', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <label className={styles.label} style={{ fontSize: '1.2rem', color: '#2c1810', marginBottom: '20px', display: 'block', fontWeight: '800', fontFamily: "'DM Serif Display', serif", textAlign: 'center' }}>How would you like to receive your order?</label>
              <div className={styles.orderTypeGrid}>
                <div
                  onClick={() => setOrderType('dine-in')}
                  style={{
                    padding: '20px 10px', textAlign: 'center', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: orderType === 'dine-in' ? '2px solid #c4a484' : '2px solid transparent',
                    backgroundColor: orderType === 'dine-in' ? 'rgba(196,164,132,0.08)' : '#f8f9fa',
                    boxShadow: orderType === 'dine-in' ? '0 10px 25px rgba(196,164,132,0.25)' : 'none',
                    transform: orderType === 'dine-in' ? 'translateY(-4px)' : 'translateY(0)'
                  }}
                >
                  <i className="fas fa-coffee" style={{ fontSize: '2rem', color: orderType === 'dine-in' ? '#c4a484' : '#a0a0a0', marginBottom: '12px', transition: '0.3s' }} />
                  <div style={{ fontWeight: '800', color: orderType === 'dine-in' ? '#2c1810' : '#777', fontSize: '1rem', letterSpacing: '0.5px' }}>Dine-In</div>
                  <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '6px', fontWeight: '500' }}>Enjoy at Cafe</div>
                </div>

                <div
                  onClick={() => setOrderType('takeaway')}
                  style={{
                    padding: '20px 10px', textAlign: 'center', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: orderType === 'takeaway' ? '2px solid #c4a484' : '2px solid transparent',
                    backgroundColor: orderType === 'takeaway' ? 'rgba(196,164,132,0.08)' : '#f8f9fa',
                    boxShadow: orderType === 'takeaway' ? '0 10px 25px rgba(196,164,132,0.25)' : 'none',
                    transform: orderType === 'takeaway' ? 'translateY(-4px)' : 'translateY(0)'
                  }}
                >
                  <i className="fas fa-shopping-bag" style={{ fontSize: '2rem', color: orderType === 'takeaway' ? '#c4a484' : '#a0a0a0', marginBottom: '12px', transition: '0.3s' }} />
                  <div style={{ fontWeight: '800', color: orderType === 'takeaway' ? '#2c1810' : '#777', fontSize: '1rem', letterSpacing: '0.5px' }}>Takeaway</div>
                  <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '6px', fontWeight: '500' }}>Grab & Go</div>
                </div>

                <div
                  onClick={() => setOrderType('delivery')}
                  style={{
                    padding: '20px 10px', textAlign: 'center', borderRadius: '16px', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    border: orderType === 'delivery' ? '2px solid #c4a484' : '2px solid transparent',
                    backgroundColor: orderType === 'delivery' ? 'rgba(196,164,132,0.08)' : '#f8f9fa',
                    boxShadow: orderType === 'delivery' ? '0 10px 25px rgba(196,164,132,0.25)' : 'none',
                    transform: orderType === 'delivery' ? 'translateY(-4px)' : 'translateY(0)'
                  }}
                >
                  <i className="fas fa-motorcycle" style={{ fontSize: '2rem', color: orderType === 'delivery' ? '#c4a484' : '#a0a0a0', marginBottom: '12px', transition: '0.3s' }} />
                  <div style={{ fontWeight: '800', color: orderType === 'delivery' ? '#2c1810' : '#777', fontSize: '1rem', letterSpacing: '0.5px' }}>Delivery</div>
                  <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '6px', fontWeight: '500' }}>To your door</div>
                </div>
              </div>

              {orderType === 'delivery' && (
                <div style={{ marginTop: '25px', padding: '25px', backgroundColor: '#fff', borderRadius: '18px', border: '1px solid rgba(196,164,132,0.3)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)', animation: 'fadeIn 0.4s ease' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h4 style={{ margin: 0, color: '#2c1810', fontSize: '1rem', fontWeight: '800' }}>DELIVERY DETAILS</h4>
                    <span style={{ fontSize: '0.7rem', color: '#c4a484', fontWeight: 'bold', background: 'rgba(196,164,132,0.1)', padding: '4px 10px', borderRadius: '20px' }}>REQUIRED</span>
                  </div>


                  <label className={styles.label} style={{ color: '#2c1810', fontWeight: '700', fontSize: '0.9rem', marginBottom: '12px', display: 'block' }}>How should we find you?</label>

                  {/* Delivery Type Selector (Premium Segment Control) */}
                  <div style={{ display: 'flex', background: '#f8f9fa', padding: '5px', borderRadius: '12px', marginBottom: '20px' }}>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, deliveryType: 'postcode' }))}
                      style={{
                        flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: '0.3s',
                        backgroundColor: form.deliveryType === 'postcode' ? '#fff' : 'transparent',
                        color: form.deliveryType === 'postcode' ? '#2c1810' : '#888',
                        fontWeight: '700', fontSize: '0.85rem',
                        boxShadow: form.deliveryType === 'postcode' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      Postcode
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm(f => ({ ...f, deliveryType: 'location' }))}
                      style={{
                        flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer', transition: '0.3s',
                        backgroundColor: form.deliveryType === 'location' ? '#fff' : 'transparent',
                        color: form.deliveryType === 'location' ? '#2c1810' : '#888',
                        fontWeight: '700', fontSize: '0.85rem',
                        boxShadow: form.deliveryType === 'location' ? '0 4px 10px rgba(0,0,0,0.05)' : 'none'
                      }}
                    >
                      Live Location
                    </button>
                  </div>

                  {form.deliveryType === 'postcode' ? (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <input
                        name="postcode"
                        value={form.postcode}
                        onChange={handleChange}
                        className={styles.input}
                        placeholder="Enter Postcode (e.g. B2 4HD)"
                        style={{ borderColor: errors.postcode ? 'red' : '#eee' }}
                      />
                      {errors.postcode && <p className={styles.errorMsg} style={{ marginTop: '5px' }}>{errors.postcode}</p>}
                    </div>
                  ) : (
                    <div style={{ animation: 'fadeIn 0.3s ease' }}>
                      <button
                        type="button"
                        onClick={() => {
                          if (navigator.geolocation) {
                            setForm(f => ({ ...f, location: 'Locating...' }));
                            navigator.geolocation.getCurrentPosition((pos) => {
                              setForm(f => ({ ...f, location: `${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}` }));
                            }, (err) => {
                              alert("Could not get location. Please enter postcode instead.");
                              setForm(f => ({ ...f, deliveryType: 'postcode', location: '' }));
                            });
                          }
                        }}
                        style={{
                          width: '100%', padding: '15px', borderRadius: '12px', border: '1px dashed #c4a484',
                          background: 'rgba(196,164,132,0.05)', color: '#2c1810', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: '700'
                        }}
                      >
                        <i className="fas fa-map-marker-alt" style={{ color: '#c4a484' }} />
                        {form.location || 'Share My GPS Location'}
                      </button>
                      {errors.location && <p className={styles.errorMsg} style={{ marginTop: '5px' }}>{errors.location}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className={styles.formSection}>
              <div className={styles.field} style={{ position: 'relative' }}>
                <label className={styles.label}>Full Name <span style={{ color: 'red' }}>*</span></label>
                <input 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  onFocus={() => setShowProfileDropdown(true)}
                  onBlur={() => setTimeout(() => setShowProfileDropdown(false), 200)}
                  className={styles.input} 
                  placeholder="e.g. John Doe" 
                  autoComplete="off"
                />
                {showProfileDropdown && savedProfiles.length > 0 && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0,
                    backgroundColor: '#fff', border: '1px solid #eee',
                    borderRadius: '12px', padding: '8px', marginTop: '5px',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 10,
                    maxHeight: '220px', overflowY: 'auto'
                  }}>
                    <div style={{ fontSize: '0.75rem', color: '#c4a484', fontWeight: 'bold', padding: '4px 8px 8px' }}>Saved Profiles</div>
                    {savedProfiles.map((profile, idx) => (
                      <div key={idx}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setForm(f => ({ ...f, ...profile }));
                          setShowProfileDropdown(false);
                        }}
                        style={{
                          padding: '10px 12px', cursor: 'pointer', borderRadius: '8px',
                          transition: 'background 0.2s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(196,164,132,0.1)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <div style={{ color: '#2c1810', fontWeight: 'bold', fontSize: '0.9rem' }}>{profile.name}</div>
                        <div style={{ fontSize: '0.78rem', color: '#666' }}>{profile.phone}{profile.email ? ` • ${profile.email}` : ''}</div>
                      </div>
                    ))}
                  </div>
                )}
                {errors.name && <p className={styles.errorMsg}>{errors.name}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Phone Number <span style={{ color: 'red' }}>*</span></label>
                <input name="phone" value={form.phone} onChange={handleChange} className={styles.input} placeholder="e.g. 07123 456789" />
                {errors.phone && <p className={styles.errorMsg}>{errors.phone}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email <span style={{ fontSize: '0.7rem', color: '#888' }}>(Optional - for offers)</span></label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className={styles.input} placeholder="john@email.com" />
                {errors.email && <p className={styles.errorMsg}>{errors.email}</p>}
              </div>
            </div>

            <div className={styles.formSection}>
              <div className={styles.field}>
                <label className={styles.label}>Card number</label>
                <input name="cardNumber" value={form.cardNumber} onChange={handleChange} className={styles.input} placeholder="1234 5678 9012 3456" />
                {errors.cardNumber && <p className={styles.errorMsg}>{errors.cardNumber}</p>}
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Expiry</label>
                  <input name="expiry" value={form.expiry} onChange={handleChange} className={styles.input} placeholder="MM / YY" />
                  {errors.expiry && <p className={styles.errorMsg}>{errors.expiry}</p>}
                </div>
                <div className={styles.field}>
                  <label className={styles.label}>CVC</label>
                  <input name="cvc" value={form.cvc} onChange={handleChange} className={styles.input} placeholder="123" />
                </div>
              </div>
            </div>

            {/* Smart Offers Section */}
            <div className={styles.formSection} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '16px', border: '1px solid #eee' }}>
              <label className={styles.label} style={{ fontSize: '1.1rem', color: '#2c1810', marginBottom: '10px' }}>Select Customer Category</label>
              <select
                className={styles.input}
                value={customerType}
                onChange={e => { setCustomerType(e.target.value); setSelectedOffer(null); }}
                style={{ backgroundColor: '#f9f9f9', cursor: 'pointer' }}
              >
                <option value="General">General Customer</option>
                <option value="Student">Student</option>
                <option value="Employee">Staff / Employee</option>
              </select>

              {offers.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <label className={styles.label} style={{ color: '#c4a484', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-tags" /> Available Offers For You!
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                    {offers.map(offer => (
                      <div
                        key={offer.id}
                        onClick={() => handleOfferClick(offer)}
                        style={{
                          padding: '15px',
                          border: selectedOffer?.id === offer.id ? '2px solid #c4a484' : '1px solid #e0e0e0',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          backgroundColor: selectedOffer?.id === offer.id ? 'rgba(196,164,132,0.1)' : '#fdfdfd',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          transition: 'all 0.3s ease',
                          transform: selectedOffer?.id === offer.id ? 'scale(1.01)' : 'scale(1)',
                          boxShadow: selectedOffer?.id === offer.id ? '0 8px 25px rgba(196,164,132,0.2)' : 'none'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 'bold', color: '#2c1810', fontSize: '1.05rem' }}>{offer.reason}</div>
                          <div style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px' }}>Applies to {offer.product_name}</div>
                        </div>
                        <div style={{ fontWeight: 'bold', color: '#c4a484', fontSize: '1.2rem', backgroundColor: '#fff', padding: '5px 10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }}>
                          {offer.discount_percent}% OFF
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Premium Offer Error Message — فخم مثل رسالة إغلاق المتجر */}
                  {offerError && (
                    <div style={{
                      marginTop: '16px',
                      borderRadius: '20px',
                      overflow: 'hidden',
                      animation: 'fadeIn 0.4s ease',
                      boxShadow: '0 15px 40px rgba(231, 74, 59, 0.15)',
                      border: '1px solid rgba(231, 74, 59, 0.25)'
                    }}>
                      {/* Top accent bar */}
                      <div style={{
                        height: '4px',
                        background: 'linear-gradient(90deg, #e74a3b, #ff8c7f, #e74a3b)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite linear'
                      }} />
                      <style>{`
                        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
                        @keyframes fadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
                      `}</style>

                      <div style={{
                        padding: '22px 24px',
                        background: 'linear-gradient(135deg, #fff8f7 0%, #fff 100%)',
                        display: 'flex',
                        gap: '18px',
                        alignItems: 'flex-start'
                      }}>
                        {/* Icon */}
                        <div style={{
                          width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0,
                          background: 'linear-gradient(135deg, #e74a3b, #c0392b)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: '0 6px 18px rgba(231,74,59,0.35)'
                        }}>
                          <i className="fas fa-times-circle" style={{ color: '#fff', fontSize: '1.3rem' }} />
                        </div>

                        {/* Text content */}
                        <div style={{ flex: 1 }}>
                          <div style={{
                            fontFamily: "'DM Serif Display', serif",
                            fontSize: '1.05rem',
                            color: '#2c1810',
                            fontWeight: '700',
                            marginBottom: '8px',
                            lineHeight: 1.3
                          }}>
                            This Offer Is Not Available For You
                          </div>
                          <div style={{
                            fontSize: '0.9rem',
                            color: '#8B3A2F',
                            lineHeight: 1.6,
                            textAlign: 'left',
                            fontWeight: '600'
                          }}>
                            {offerError}
                          </div>
                        </div>

                        {/* Dismiss button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setOfferError(null); }}
                          style={{
                            background: 'rgba(231,74,59,0.08)', border: 'none',
                            borderRadius: '50%', width: '28px', height: '28px',
                            cursor: 'pointer', color: '#e74a3b', fontSize: '0.9rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, transition: 'background 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(231,74,59,0.18)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(231,74,59,0.08)'}
                        >
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* General Store Feedback Section Moved Here */}
            <div style={{ backgroundColor: 'rgba(196,164,132,0.1)', padding: '20px', borderRadius: '16px', marginBottom: '20px', border: '1px solid rgba(196,164,132,0.3)' }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#2c1810', fontFamily: 'serif', fontSize: '1.2rem' }}>How was your experience?</h4>
              <div style={{ display: 'flex', gap: '8px', fontSize: '1.5rem', marginBottom: '15px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <i
                    key={star}
                    className={`fas fa-star`}
                    style={{ color: star <= storeRating ? '#FFD700' : '#ccc', cursor: 'pointer', transition: '0.2s' }}
                    onClick={() => setStoreRating(star)}
                  />
                ))}
              </div>
              <textarea
                placeholder="Leave an order note or general feedback..."
                value={storeComment}
                onChange={(e) => setStoreComment(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', minHeight: '60px', fontFamily: 'inherit', resize: 'vertical' }}
              />
            </div>

            <button 
              type="submit" 
              className={`btn btn-primary ${styles.payBtn}`} 
              disabled={step === 'processing'}
              style={{
                background: step === 'processing' ? '#ccc' : 'linear-gradient(135deg, #2c1810, #5a3500)',
                padding: '20px',
                borderRadius: '15px',
                fontSize: '1.2rem',
                fontWeight: '800',
                boxShadow: step === 'processing' ? 'none' : '0 10px 25px rgba(44, 24, 16, 0.3)',
                border: 'none',
                cursor: step === 'processing' ? 'not-allowed' : 'pointer',
                color: '#fff',
                width: '100%',
                transition: 'all 0.3s',
                opacity: step === 'processing' ? 0.7 : 1
              }}
              onMouseEnter={(e) => { if(step !== 'processing') e.currentTarget.style.transform = 'translateY(-3px)'; }}
              onMouseLeave={(e) => { if(step !== 'processing') e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {step === 'processing' ? 'Processing...' : `Confirm & Pay ${formatPrice(finalPrice)}`}
              {selectedOffer && step !== 'processing' && <span style={{ fontSize: '0.85rem', opacity: 0.9, marginLeft: '8px', fontWeight: 'normal' }}>(Offer Applied)</span>}
            </button>

            {/* Security Badges */}
            <div style={{
              marginTop: '25px',
              display: 'flex',
              justifyContent: 'center',
              gap: '20px',
              opacity: 0.6,
              borderTop: '1px solid #eee',
              paddingTop: '20px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>
                <i className="fas fa-lock" style={{ color: '#38ef7d' }} /> SSL SECURE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>
                <i className="fas fa-shield-alt" style={{ color: '#4facfe' }} /> ENCRYPTED
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem', fontWeight: 'bold', color: '#666' }}>
                <i className="fas fa-check-circle" style={{ color: '#c4a484' }} /> VERIFIED
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}