import { shopInfo, openingHours } from '../data/shopData';
import styles from './Footer.module.css';

const QUICK = [
  { label: 'Home',    href: '#home' },
  { label: 'Menu',    href: '#menu' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'About',   href: '#about' },
  { label: 'Careers', href: '#careers' },
  { label: 'Contact', href: '#contact' },
];

const InstagramIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:'6px',flexShrink:0,verticalAlign:'middle'}}>
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
  </svg>
);

const EnvelopeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{marginRight:'6px',flexShrink:0,verticalAlign:'middle'}}>
    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <span className={styles.logoMark}>C</span>
          <div>
            <div className={styles.logoName}>CaffAIne</div>
            <div className={styles.logoCity}>As-Salt, Al-Balqa</div>
          </div>
        </div>
        
        <p className={styles.brandDesc}>
          Independent specialty coffee located in the heart of As-Salt.
          Crafting moments of perfection in every cup since 2014.
        </p>

        <div className={styles.socialGroup}>
          <a href="https://www.instagram.com/CaffAIne.coffee/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Instagram">
            <InstagramIcon />
          </a>
          <a href="https://www.facebook.com/CaffAInecoffee" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Facebook">
            <FacebookIcon />
          </a>
          <a href="https://twitter.com/CaffAInecoffee" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Twitter/X">
            <TwitterIcon />
          </a>
        </div>

        <div className={styles.col}>
          <h4>Open Hours</h4>
          <ul>
            {openingHours.map(({ day, open, close }) => (
              <li key={day} className={styles.hoursRow}>
                <span>{day}</span>
                <span className={styles.time}>{open} – {close}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.col}>
          <h4>Quick Links</h4>
          <ul>
            {QUICK.map(({ label, href }) => (
              <li key={label}><a href={href}>{label}</a></li>
            ))}
          </ul>
        </div>

        <div className={styles.col}>
          <h4>Find Us</h4>
          <div className={styles.mapContainer}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3381.769437147048!2d35.7274026152063!3d32.03923598119858!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x151ca1c90f5c9e5d%3A0x7d6f5f0f0f0f0f0f!2sAs-Salt%2C%20Jordan!5e0!3m2!1sen!2sjo!4v1714838400000!5m2!1sen!2sjo"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="CaffAIne Location"
            ></iframe>
          </div>
          <a href={shopInfo.mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.address}>
            <MapPinIcon />
            <span>{shopInfo.address}, {shopInfo.city}</span>
          </a>
          <a href={`mailto:${shopInfo.email}`} className={styles.emailLink}>
            <EnvelopeIcon /> {shopInfo.email}
          </a>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} CaffAIne. Crafted with Passion.</span>
        <span>Independent &amp; Locally Roasted.</span>
      </div>
    </footer>
  );
}
