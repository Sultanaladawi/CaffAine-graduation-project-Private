import { useReveal } from '../hooks/useReveal';
import styles from './About.module.css';

const PILLARS = [
  { icon: 'fa-mug-hot',       title: 'Specialty Only',  desc: 'We serve exclusively specialty-grade coffee, sourced from farms we know and trust.' },
  { icon: 'fa-leaf',          title: 'Plant-Friendly',  desc: 'Extensive vegan and vegetarian menu options — no compromise on flavour.' },
  { icon: 'fa-map-marker-alt',title: 'Heart of Brum',   desc: 'Tucked inside Piccadilly Arcade — a calm refuge from the city’s bustle.' },
];

export default function About() {
  const [imgRef,  imgVis]  = useReveal();
  const [textRef, textVis] = useReveal();
  const [pilRef,  pilVis]  = useReveal();

  return (
    <section className={styles.about} id="about">
      <div className="section-wrap">
        <div className={styles.twoCol}>
          <div ref={imgRef} className={`${styles.imgWrap} reveal ${imgVis ? 'vis' : ''}`}>
            <div className={styles.imgMain}>
              <img
                src="/images/interior-wide.png"
                alt="Faculty Coffee interior"
                loading="lazy"
              />
            </div>
            <div className={styles.imgAccent}>
              <img
                src="/images/barista.png"
                alt="Faculty Coffee barista at work"
                loading="lazy"
              />
            </div>
            <div className={styles.badge}>
              <span className={styles.badgeText}>One of Birmingham's</span>
              <span className={styles.badgeMain}>Top Specialty</span>
              <span className={styles.badgeText}>Coffee Spots</span>
            </div>
          </div>

          <div ref={textRef} className={`${styles.text} reveal ${textVis ? 'vis' : ''}`}>
            <div className="label">Our Story</div>
            <div className="divider" />
            <h2 className="h2">A Warm Corner of Birmingham</h2>
            
            <p className={styles.body}>
              Faculty Coffee is an independent specialty café settled inside the beautiful Victorian surroundings
              of Piccadilly Arcade. We opened with one purpose: to serve extraordinary coffee in a space
              that feels genuinely welcoming.
            </p>
            
            <p className={styles.body}>
              Our team knows their beans. Every barista is trained to care — about extraction time, milk
              temperature, and the way a flat white should feel in your hands. Whether you want a
              five-minute espresso or an hour with a pour-over and a pastry, Faculty is your place.
            </p>
            
            <p className={styles.body}>
              Widely regarded as one of Birmingham's finest specialty coffee destinations, we're proud
              to be part of the city's growing independent food and drink scene.
            </p>

            <a href="#contact" className="btn btn-outline" style={{ marginTop: '1.6rem' }}>
              Visit Us <i className="fas fa-arrow-right" />
            </a>
          </div>
        </div>

        <div ref={pilRef} className={`${styles.pillars} reveal ${pilVis ? 'vis' : ''}`}>
          {PILLARS.map((p, i) => (
            <div key={p.title} className={styles.pillar} style={{ animationDelay: `${i * 150}ms` }}>
              <div className={styles.pillarIcon}><i className={`fas ${p.icon}`} /></div>
              <h3 className={styles.pillarTitle}>{p.title}</h3>
              <p className={styles.pillarDesc}>{p.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}