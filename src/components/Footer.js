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

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <a href="#home" className={styles.logo} aria-label="Faculty Coffee">
            <span className={styles.logoMark}>FC</span>
            <div>
              <div className={styles.logoName}>Faculty Coffee</div>
              <div className={styles.logoCity}>Birmingham, UK</div>
            </div>
          </a>
          <p className={styles.brandDesc}>
            Independent specialty coffee located in the heart of Birmingham. 
            Crafting moments of perfection in every cup since 2014.
          </p>
          <div className={styles.socialGroup}>
            <a href="https://www.instagram.com/faculty.coffee/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <i className="fab fa-instagram" />
            </a>
            <a href="https://www.facebook.com/facultycoffee" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <i className="fab fa-facebook-f" />
            </a>
            <a href="https://twitter.com/facultycoffee" target="_blank" rel="noopener noreferrer" className={styles.socialIcon}>
              <i className="fab fa-twitter" />
            </a>
          </div>
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
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2429.932454522434!2d-1.9009841233159392!3d52.47941013995899!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x4870bc8eb488950d%3A0xe5432d561d50c765!2sFaculty%20Coffee!5e0!3m2!1sen!2suk!4v1714838400000!5m2!1sen!2suk" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
          <a href={shopInfo.mapsUrl} target="_blank" rel="noopener noreferrer" className={styles.address}>
            <i className="fas fa-map-marker-alt" />
            <span>{shopInfo.address}, {shopInfo.city}</span>
          </a>
          <a href={`mailto:${shopInfo.email}`} className={styles.emailLink}>
            <i className="fas fa-envelope" /> {shopInfo.email}
          </a>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} Faculty Coffee. Crafted with Passion.</span>
        <span>Independent & Locally Roasted.</span>
      </div>
    </footer>
  );
}