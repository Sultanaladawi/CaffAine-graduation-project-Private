import { useState, useEffect } from 'react';
import { shopInfo } from '../data/shopData';
import { useCart } from '../context/CartContext';
import styles from './Navbar.module.css';

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
              {offers.map((offer, idx) => (
                <span key={offer.id} style={{ margin: '0 40px' }}>
                  <i className="fas fa-star" style={{ color: '#c4a484', marginRight: '10px', fontSize: '0.7rem', verticalAlign: 'middle' }} />
                  <span style={{ color: '#8a6240' }}>{offer.product_name === 'All' ? 'STOREWIDE:' : offer.product_name}</span> &mdash; {offer.reason} <span style={{ color: '#c4a484', border: '1px solid #c4a484', padding: '2px 8px', borderRadius: '12px', marginLeft: '5px' }}>{offer.discount_percent}% OFF</span>
                  <i className="fas fa-star" style={{ color: '#c4a484', marginLeft: '10px', fontSize: '0.7rem', verticalAlign: 'middle' }} />
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
          <a href="#home" className={styles.logo} aria-label="Faculty Coffee home" style={{ textDecoration: 'none' }}>
            <div style={{ 
              fontFamily: "'DM Serif Display', serif", 
              fontSize: '2rem', 
              color: '#2c1810', 
              lineHeight: '1',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              Faculty<span style={{ color: '#c4a484', fontStyle: 'italic' }}>Coffee.</span>
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
              <i className="fas fa-shopping-bag" />
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
          <i className="fas fa-times" />
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
            <i className="fas fa-shopping-bag" />
            My Order
            {totalItems > 0 && <span className={styles.mobileBadge}>{totalItems}</span>}
          </button>
        </nav>
        <a href={shopInfo.instagram} className={styles.mobileInsta} target="_blank" rel="noopener noreferrer">
          <i className="fab fa-instagram" /> {shopInfo.instagramHandle}
        </a>
      </div>
    </>
  );
}