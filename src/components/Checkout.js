import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import styles from './Checkout.module.css';

export default function Checkout({ onClose, onBack }) {
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState('form');
  const [orderId, setOrderId] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(120);
  const [form, setForm] = useState({
    name: '', email: '',
    cardNumber: '', expiry: '', cvc: '', address: ''
  });
  const [orderType, setOrderType] = useState('dine-in');
  const [errors, setErrors] = useState({});
  const [storeRating, setStoreRating] = useState(5);
  const [storeComment, setStoreComment] = useState('');

  // Offers State
  const [offers, setOffers] = useState([]);
  const [customerType, setCustomerType] = useState('General');
  const [selectedOffer, setSelectedOffer] = useState(null);

  const formatPrice = (n) => `£${n.toFixed(2)}`;

  useEffect(() => {
    // Fetch active offers from backend
    fetch('/api/offers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOffers(data);
      })
      .catch(err => console.error('Error fetching offers:', err));
  }, []);

  // Filter applicable offers based on cart items and customer type
  const applicableOffers = offers.filter(offer => {
    // 1. Check if the cart contains the target product (e.g. 'Cappuccino', 'Pastry')
    const hasItem = items.some(item => item.name.toLowerCase().includes(offer.product_name.toLowerCase()) || offer.product_name.toLowerCase() === 'all');
    
    // 2. Check customer category (Student vs Employee) based on offer description
    const isStudentOffer = offer.reason.toLowerCase().includes('student');
    const isEmployeeOffer = offer.reason.toLowerCase().includes('corporate') || offer.reason.toLowerCase().includes('employee') || offer.reason.toLowerCase().includes('faculty');
    
    if (isStudentOffer && customerType !== 'Student') return false;
    if (isEmployeeOffer && customerType !== 'Employee') return false;
    
    return hasItem;
  });

  // Automatically clear selected offer if it's no longer applicable after category change
  useEffect(() => {
    if (selectedOffer && !applicableOffers.some(o => o.id === selectedOffer.id)) {
      setSelectedOffer(null);
    }
  }, [applicableOffers, selectedOffer]);

  const discountMultiplier = selectedOffer ? (1 - (selectedOffer.discount_percent / 100)) : 1;
  const DELIVERY_FEE = 3.00;
  const subtotalAfterDiscount = totalPrice * discountMultiplier;
  const finalPrice = orderType === 'delivery' ? subtotalAfterDiscount + DELIVERY_FEE : subtotalAfterDiscount;

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

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
    if (name === 'expiry')     value = formatExpiry(value);
    if (name === 'cvc')         value = value.replace(/\D/g, '').slice(0, 4);
    setForm(f => ({ ...f, [name]: value }));
    setErrors(err => ({ ...err, [name]: '' }));
  }

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.includes('@')) e.email = 'Valid email required';
    const rawCard = form.cardNumber.replace(/\s/g, '');
    if (rawCard.length < 16) e.cardNumber = 'Enter 16 digits';
    if (form.expiry.length < 5) e.expiry = 'MM/YY required';
    if (form.cvc.length < 3) e.cvc = 'CVC required';
    if (orderType === 'delivery' && !form.address.trim()) e.address = 'Delivery address is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function saveOrderToBackend() {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: form.name.trim(),
          email: form.email.trim(),
          total_amount: finalPrice, // Sent discounted price
          cartItems: items.map(item => ({
            id: item.id,
            name: item.name,
            qty: item.qty,
            priceNum: item.priceNum
          })),
          order_type: orderType,
          delivery_address: orderType === 'delivery' ? form.address : null
        }),
      });

      if (!response.ok) throw new Error('Failed to save order');
      const result = await response.json();
      if (result.success) {
        setOrderId(result.orderId);
        setTimeRemaining(120);
      }
      return result.success;
    } catch (error) {
      console.error('API Error:', error);
      return false;
    }
  }
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;

    setStep('processing');
    
    await new Promise(r => setTimeout(r, 1500)); 
    const success = await saveOrderToBackend();
    
    // Submit feedback if a rating was given
    if (storeRating > 0 || storeComment.trim()) {
      await fetch('/api/feedback/general', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewer_name: form.name.trim() || 'Customer',
          comment: storeComment,
          rating: storeRating
        })
      });
    }
    
    if (success) {
      clearCart();
      setStep('success');
    } else {
      setStep('error');
    }
  }

  if (step === 'success') {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return (
      <div className={styles.overlay} onClick={onClose}>
        <div className={styles.modal} onClick={e => e.stopPropagation()}>
          <div className={styles.successScreen} style={{ padding: '20px' }}>
            <div className={styles.successIcon} style={{ margin: '0 auto 20px', fontSize: '3rem', color: 'green' }}><i className="fas fa-check-circle" /></div>
            <h2 style={{ fontFamily: 'serif', fontSize: '2rem', color: '#2c1810', marginBottom: '10px' }}>Order placed!</h2>
            <p>Your order is being prepared. Thank you!</p>
            <p style={{ fontSize: '0.95rem', color: '#666', marginTop: '10px', marginBottom: '30px' }}>
              Order <strong>#{orderId}</strong> will be ready in approximately {minutes}:{seconds.toString().padStart(2, '0')}
            </p>
            <button className="btn btn-olive" onClick={onClose} style={{ width: '100%', padding: '15px', borderRadius: '12px', background: '#2c1810', color: '#fff', border: 'none', fontWeight: 'bold', fontSize: '1.1rem', cursor: 'pointer' }}>
              Back to Menu
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
      <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <div className={styles.modalHead}>
          <button className={styles.backBtn} onClick={onBack}><i className="fas fa-arrow-left" /> Back</button>
          <h2 className={styles.modalTitle}>Checkout</h2>
          <button className={styles.closeBtn} onClick={onClose}><i className="fas fa-times" /></button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.orderSummary}>
            <div className={styles.summaryLabel}>Order summary</div>
            {items.map(item => (
              <div key={item.id} className={styles.sumItem}>
                <span>{item.name} × {item.qty}</span>
                <span>{formatPrice(item.priceNum * item.qty)}</span>
              </div>
            ))}
            
            {selectedOffer && (
              <div className={styles.sumItem} style={{ color: '#c4a484', fontWeight: 'bold' }}>
                <span>Discount ({selectedOffer.discount_percent}%)</span>
                <span>-{formatPrice(totalPrice * (selectedOffer.discount_percent / 100))}</span>
              </div>
            )}

            {orderType === 'delivery' && (
              <div className={styles.sumItem}>
                <span>Delivery Fee</span>
                <span>{formatPrice(DELIVERY_FEE)}</span>
              </div>
            )}

            <div className={styles.sumTotal}>
              <span>Total</span>
              <span className={styles.sumTotalAmt}>{formatPrice(finalPrice)}</span>
            </div>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            
            {/* Order Type Selection */}
            <div className={styles.formSection} style={{ backgroundColor: '#fff', padding: '25px', borderRadius: '20px', border: '1px solid #eee', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              <label className={styles.label} style={{ fontSize: '1.2rem', color: '#2c1810', marginBottom: '20px', display: 'block', fontWeight: '800', fontFamily: "'DM Serif Display', serif", textAlign: 'center' }}>How would you like to receive your order?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
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
                <div style={{ marginTop: '25px', padding: '20px', backgroundColor: '#fdfdfd', borderRadius: '12px', border: '1px solid rgba(196,164,132,0.4)', animation: 'fadeIn 0.4s ease' }}>
                  <label className={styles.label} style={{ color: '#2c1810', fontWeight: '700' }}>Delivery Address</label>
                  <input name="address" value={form.address} onChange={handleChange} className={styles.input} placeholder="123 Coffee Street, London" style={{ borderColor: errors.address ? 'red' : '#e0e0e0', marginTop: '8px' }} />
                  {errors.address && <p className={styles.errorMsg} style={{ marginTop: '5px' }}>{errors.address}</p>}
                </div>
              )}
            </div>

            <div className={styles.formSection}>
              <div className={styles.field}>
                <label className={styles.label}>Full name</label>
                <input name="name" value={form.name} onChange={handleChange} className={styles.input} placeholder="John Britain" />
                {errors.name && <p className={styles.errorMsg}>{errors.name}</p>}
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
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
                  <input name="expiry" value={form.expiry} onChange={handleChange} className={styles.input} placeholder="MM/YY" />
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
                <option value="Employee">Faculty / Employee</option>
              </select>

              {applicableOffers.length > 0 && (
                <div style={{ marginTop: '20px' }}>
                  <label className={styles.label} style={{ color: '#c4a484', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="fas fa-tags" /> Available Offers For You!
                  </label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                    {applicableOffers.map(offer => (
                      <div 
                        key={offer.id} 
                        onClick={() => setSelectedOffer(selectedOffer?.id === offer.id ? null : offer)}
                        style={{ 
                          padding: '15px', 
                          border: selectedOffer?.id === offer.id ? '2px solid #c4a484' : '1px solid #e0e0e0', 
                          borderRadius: '12px', 
                          cursor: 'pointer', 
                          backgroundColor: selectedOffer?.id === offer.id ? 'rgba(196,164,132,0.1)' : '#fdfdfd',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          transition: 'all 0.2s ease'
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

            <button type="submit" className={`btn btn-primary ${styles.payBtn}`}>
              Pay {formatPrice(finalPrice)}
              {selectedOffer && <span style={{ fontSize: '0.85rem', opacity: 0.9, marginLeft: '8px', fontWeight: 'normal' }}>(Discount Applied)</span>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}