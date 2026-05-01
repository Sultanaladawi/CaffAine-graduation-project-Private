import { useEffect, useRef } from 'react';
import styles from './Hero.module.css';

export default function Hero() {
  const imgRef   = useRef(null);
  const heroRef  = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const img  = imgRef.current;
    if (!hero || !img) return;

    if (!window.matchMedia('(hover: hover)').matches) return;

    function onMouseMove(e) {
      const rect = hero.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;
      
      const nx   = (e.clientX - cx) / (rect.width  / 2);
      const ny   = (e.clientY - cy) / (rect.height / 2);
      
      img.style.transform = `translate(${nx * 10}px, ${ny * 8}px) scale(1.04)`;
    }

    function onMouseLeave() {
      img.style.transform = 'translate(0,0) scale(1.04)';
    }

    hero.addEventListener('mousemove',  onMouseMove);
    hero.addEventListener('mouseleave', onMouseLeave);
    
    return () => {
      hero.removeEventListener('mousemove',  onMouseMove);
      hero.removeEventListener('mouseleave', onMouseLeave);
    };
  }, []);

  return (
    <section className={styles.hero} id="home" ref={heroRef}>
      <div className={styles.left}>
        <div className={styles.content}>

          <div className={styles.eyebrow}>
            <div className={styles.eyebrowDot} />
            <div className="label">Specialty Coffee · Birmingham</div>
          </div>

          <h1 className={`display ${styles.headline}`}>
            Faculty<br /><em>Coffee</em>
          </h1>

          <p className={styles.sub}>
            Independent specialty coffee at the heart of Birmingham's
            Piccadilly Arcade. Precision-crafted drinks, warm welcome,
            unhurried pace.
          </p>

          <div className={styles.ctas}>
            <a href="#menu"    className="btn btn-primary">View Our Menu</a>
            <a href="#contact" className="btn btn-outline">Find Us</a>
          </div>

          <div className={styles.hoursStrip}>
            <div className={styles.hoursItem}>
              <i className="fas fa-clock" />
              <span>Mon–Fri</span> 07:30–17:00
            </div>
            <div className={styles.hoursDivider} />
            <div className={styles.hoursItem}>
              <span>Saturday</span> 09:00–18:00
            </div>
            <div className={styles.hoursDivider} />
            <div className={styles.hoursItem}>
              <span>Sunday</span> 10:00–16:00
            </div>
          </div>
        </div>
      </div>

      <div className={styles.right}>
        <img
          ref={imgRef}
          src="/images/window.png"
          alt="Faculty Coffee window view"
          className={styles.windowImg}
        />

        <div className={`${styles.heroBadge} ${styles.vis}`}>
          <div className={styles.heroBadgeLabel}>Today's Feature</div>
          <div className={styles.heroBadgeName}>Ethiopian Yirgacheffe</div>
          <div className={styles.heroBadgeSub}>Pour-over · Single origin</div>
        </div>
      </div>
    </section>
  );
}