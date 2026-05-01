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
            Independent specialty coffee at 14 Piccadilly Arcade, Birmingham.
            Brewed with care. Always welcoming.
          </p>
          <div className={styles.socialGroup}>
            <a href="https://www.instagram.com/faculty.coffee/" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Instagram">
              <i className="fab fa-instagram" />
            </a>
            <a href="https://www.facebook.com/facultycoffee" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Facebook">
              <i className="fab fa-facebook-f" />
            </a>
            <a href="https://twitter.com/facultycoffee" target="_blank" rel="noopener noreferrer" className={styles.socialIcon} aria-label="Twitter">
              <i className="fab fa-twitter" />
            </a>
          </div>
        </div>

        <div className={styles.col}>
          <h4>Opening Hours</h4>
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
          <h4>Visit Us</h4>
          <a
            href={shopInfo.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.address}
          >
            <i className="fas fa-map-marker-alt" />
            <span>{shopInfo.address}<br />{shopInfo.city}<br />{shopInfo.country}</span>
          </a>
          <a href={`mailto:${shopInfo.email}`} className={styles.emailLink}>
            <i className="fas fa-envelope" /> {shopInfo.email}
          </a>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} Faculty Coffee. All rights reserved.</span>
        <div className={styles.socialGroupBottom}>
          <a href="https://www.instagram.com/faculty.coffee/" target="_blank" rel="noopener noreferrer" className={styles.socialIconBottom}>
            <i className="fab fa-instagram" />
          </a>
          <a href="https://www.facebook.com/facultycoffee" target="_blank" rel="noopener noreferrer" className={styles.socialIconBottom}>
            <i className="fab fa-facebook-f" />
          </a>
          <a href="https://twitter.com/facultycoffee" target="_blank" rel="noopener noreferrer" className={styles.socialIconBottom}>
            <i className="fab fa-twitter" />
          </a>
        </div>
      </div>
    </footer>
  );
}