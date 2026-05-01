import { useEffect, useRef, useState } from 'react';
import { galleryImages } from '../data/shopData';
import { useReveal } from '../hooks/useReveal';
import styles from './Gallery.module.css';

function seededRot(id) {
  const n = typeof id === 'number' ? id : String(id).charCodeAt(0);
  return (((n * 9301 + 49297) % 233280) / 233280) * 12 - 6;
}

function seededTapeRot(id) {
  const n = typeof id === 'number' ? id : String(id).charCodeAt(0);
  return (((n * 6271 + 31337) % 233280) / 233280) * 6 - 3;
}

function usePolaroidReveal() {
  const wallRef = useRef(null);
  const [visibleIds, setVisibleIds] = useState(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.polaroidId;
            setVisibleIds((prev) => new Set([...prev, id]));
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    const cards = wallRef.current?.querySelectorAll('[data-polaroid-id]');
    cards?.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, []);

  return [wallRef, visibleIds];
}

export default function Gallery() {
  const [headerRef, headerVis] = useReveal();
  const [wallRef, visibleIds]  = usePolaroidReveal();

  return (
    <section className={styles.gallery} id="gallery">
      <div className="section-wrap">
        <div
          ref={headerRef}
          className={`${styles.header} reveal ${headerVis ? 'vis' : ''}`}
        >
          <div className="label">The Space</div>
          <div className="divider" />
          <h2 className="h2">Inside Faculty Coffee</h2>
          <p className={styles.headerSub}>
            14 Piccadilly Arcade — a tucked-away corner of Birmingham
            where good coffee happens slowly.
          </p>
        </div>

        <div ref={wallRef} className={styles.wall}>
          {galleryImages.map((img) => {
            const rot      = seededRot(img.id);
            const tapeRot  = seededTapeRot(img.id);
            const isLarge  = img.size === 'large';
            const isVis    = visibleIds.has(String(img.id));

            return (
              <div
                key={img.id}
                data-polaroid-id={img.id}
                className={`
                  ${styles.polaroid}
                  ${isLarge ? styles.large : styles.normal}
                  ${isVis   ? styles.visible : ''}
                `}
                style={{
                  '--rot':      `${rot}deg`,
                  '--tape-rot': `${tapeRot}deg`,
                }}
              >
                <div className={styles.photo}>
                  <img src={img.src} alt={img.alt} loading="lazy" />
                </div>

                <div className={styles.caption}>
                  <span>{img.caption || img.alt}</span>
                </div>
              </div>
            );
          })}
        </div>

        <p className={styles.galleryNote}>
          <i className="fab fa-instagram" />
          Follow us{' '}
          <a
            href="https://instagram.com/facultycoffee"
            target="_blank"
            rel="noopener noreferrer"
          >
            @facultycoffee
          </a>
        </p>
      </div>
    </section>
  );
}