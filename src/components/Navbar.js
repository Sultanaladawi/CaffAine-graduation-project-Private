import { useState, useEffect } from 'react';
import { shopInfo } from '../data/shopData';
import { useCart } from '../context/CartContext';
import styles from './Navbar.module.css';

// Inline SVG Icons — no CDN dependency
const BagIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z"/>
  </svg>
);

const CloseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

const InstaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const StarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="#c4a484" style={{verticalAlign:'middle', margin: '0 10px'}}>
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

const LINKS = [
  { label: 'Home',    href: '#home' },
  { label: 'Menu',    href: '#menu' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'About',   href: '#about' },
  { label: 'Careers', href: '#careers' },
  { label: 'Contact', href: '#contact' },
];

export default function Navbar({ onCartOpen }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();
  const [bounce, setBounce] = useState(false);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    fetch('/api/offers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setOffers(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 48);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (totalItems > 0) {
      setBounce(true);
      const timer = setTimeout(() => setBounce(false), 500);
      return () => clearTimeout(timer);
    }
  }, [totalItems]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handleEsc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, []);

  return (
    <>
      <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
        
        {/* Integrated Offers Banner (Transparent Text-Only) */}
        {offers.length > 0 && (
          <div style={{
            backgroundColor: 'transparent',
            color: '#2c1810', // Dark espresso for readability
            paddingTop: '2px',    // Moved text higher up
            paddingBottom: '8px', 
            textAlign: 'center',
            fontSize: '0.95rem',
            fontWeight: '600',
            letterSpacing: '1.5px',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            width: '100%',
            opacity: 0.9
          }}>
            <div className="marquee-container" style={{ display: 'inline-block', animation: 'marquee 25s linear infinite' }}>
              {offers.map((offer) => (
                <span key={offer.id} style={{ margin: '0 40px' }}>
                  <StarIcon />
                  <span style={{ color: '#8a6240' }}>{offer.product_name === 'All' ? 'STOREWIDE:' : offer.product_name}</span> &mdash; {offer.reason} <span style={{ color: '#c4a484', border: '1px solid #c4a484', padding: '2px 8px', borderRadius: '12px', marginLeft: '5px' }}>{offer.discount_percent}% OFF</span>
                  <StarIcon />
                </span>
              ))}
            </div>
            <style>{`
              @keyframes marquee {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
              }
              .marquee-container:hover { animation-play-state: paused; }
            `}</style>
          </div>
        )}

        <div className={styles.inner}>
          <a href="#home" className={styles.logo} aria-label={`${shopInfo.name} home`} style={{ textDecoration: 'none' }}>
            <div style={{ 
              fontFamily: "'DM Serif Display', serif", 
              fontSize: '2rem', 
              color: '#2c1810', 
              lineHeight: '1',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <img 
                src="/images/caffaine-logo.png" 
                alt="CaffAIne Logo" 
                style={{ height: '40px', width: 'auto', borderRadius: '8px' }} 
              />
              Caff<span style={{ color: '#c4a484', fontStyle: 'italic' }}>AIne.</span>
            </div>
          </a>

          <nav aria-label="Main navigation">
            <ul className={styles.navLinks}>
              {LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className={styles.navLink}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div className={styles.navRight}>
            <button
              className={`${styles.cartBtn} ${scrolled ? styles.cartBtnScrolled : ''}`}
              onClick={onCartOpen}
              aria-label={`Open cart, ${totalItems} items`}
            >
              <BagIcon />
              {totalItems > 0 && (
                <span className={`${styles.cartBadge} ${bounce ? styles.cartBadgeBounce : ''}`}>
                  {totalItems > 99 ? '99+' : totalItems}
                </span>
              )}
            </button>

            <button
              className={`${styles.burger} ${open ? styles.open : ''}`}
              onClick={() => setOpen(v => !v)}
              aria-label="Toggle menu"
              aria-expanded={open}
            >
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      <div className={`${styles.mobile} ${open ? styles.mobileOpen : ''}`} role="dialog" aria-label="Navigation">
        <button className={styles.mobileClose} onClick={() => setOpen(false)} aria-label="Close menu">
          <CloseIcon />
        </button>
        <nav>
          {LINKS.map(({ label, href }) => (
            <a key={label} href={href} className={styles.mobileLink} onClick={() => setOpen(false)}>
              {label}
            </a>
          ))}
          <button
            className={styles.mobileCartLink}
            onClick={() => { setOpen(false); onCartOpen(); }}
          >
            <BagIcon />
            My Order
            {totalItems > 0 && <span className={styles.mobileBadge}>{totalItems}</span>}
          </button>
        </nav>
        <a href={shopInfo.instagram} className={styles.mobileInsta} target="_blank" rel="noopener noreferrer">
          <InstaIcon /> {shopInfo.instagramHandle}
        </a>
      </div>
    </>
  );
}