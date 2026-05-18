import React, { useState, useEffect } from 'react';
import styles from './Presentation.module.css';
import { ChevronLeft, ChevronRight, Monitor, Cpu, Code2, Database } from 'lucide-react';

const slidesData = [
  {
    id: 1,
    type: 'title',
    title: 'CaffAIne Coffee.',
    subtitle: 'Intelligent Management & E-Commerce for Specialty Coffee',
    content: (
      <div style={{ marginTop: '50px', fontSize: '1.4rem', color: '#666', lineHeight: '2' }}>
        <strong>Team Members:</strong> Omar Al-Ajarmeh (Leader), Sultan Al-Adawi, Mohammad Al-Hadidi, Bashar Al-Dabbas<br/>
        <strong>Supervisor:</strong> Dr. Mohammad Riyalat<br/>
        <strong>Faculty:</strong> Prince Abdullah bin Ghazi Faculty of Information Technology<br/>
        <strong>University:</strong> Al-Balqa Applied University - Al-Salt Center
      </div>
    )
  },
  {
    id: 2,
    type: 'content',
    title: 'Problem Statement',
    content: (
      <div className={styles.splitLayout}>
        <div className={styles.textContent}>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}><strong>Lack of Tailored Systems:</strong> Specialty coffee shops rely on generic POS systems that ignore the nuances of their craft.</li>
            <li className={styles.bulletItem}><strong>Operational Inefficiency:</strong> Managing inventory, analyzing sales, and tracking complex custom orders manually is prone to errors.</li>
            <li className={styles.bulletItem}><strong>Fragmented Experience:</strong> Delivery apps charge high commissions (up to 30%) and strip away the brand's premium identity.</li>
          </ul>
        </div>
        <div className={styles.imageContent}>
          <img src="/images/hero.png" alt="Coffee Shop" />
        </div>
      </div>
    )
  },
  {
    id: 3,
    type: 'content',
    title: 'Project Objectives',
    content: (
      <div className={styles.splitLayout}>
        <div className={styles.imageContent}>
          <img src="/images/interior-wide.png" alt="Interior" />
        </div>
        <div className={styles.textContent}>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>Develop a premium, customer-first web application reflecting the brand.</li>
            <li className={styles.bulletItem}>Automate and centralize inventory, orders, and store status management.</li>
            <li className={styles.bulletItem}>Integrate an AI Assistant (Sophie) for personalized recommendations and instant analytical insights.</li>
            <li className={styles.bulletItem}>Ensure real-time responsiveness with Web Audio API alarms for new orders.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 4,
    type: 'content',
    title: 'Existing Solutions vs. CaffAIne',
    content: (
      <div className={styles.textContent} style={{ maxWidth: '900px', margin: '0 auto' }}>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <strong style={{fontSize: '1.6rem', color: 'var(--text-dark)'}}>Generic POS (Square, Toast):</strong><br/>
            Great for generic retail, but lack AI integrations and deep customization.
          </li>
          <li className={styles.bulletItem}>
            <strong style={{fontSize: '1.6rem', color: 'var(--text-dark)'}}>Third-Party Delivery (Talabat, Careem):</strong><br/>
            High fees, loss of direct customer relationships, and poor brand representation.
          </li>
          <li className={styles.bulletItem}>
            <strong style={{fontSize: '1.6rem', color: 'var(--accent-gold)'}}>The CaffAIne Innovation:</strong><br/>
            An end-to-end, zero-commission bespoke solution. Built-in analytics, complete brand control, and intelligent AI automation.
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 5,
    type: 'content',
    title: 'Proposed Solution',
    content: (
      <div className={styles.splitLayout}>
        <div className={styles.textContent}>
          <p style={{ fontSize: '1.6rem', marginBottom: '30px' }}>A unified, full-stack web platform consisting of three main modules:</p>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}><strong>Customer Interface:</strong> Dynamic menu, voice search, smart checkout with multi-profile saving.</li>
            <li className={styles.bulletItem}><strong>Admin Command Center:</strong> Real-time order tracking, live inventory sync, manual/auto store controls.</li>
            <li className={styles.bulletItem}><strong>AI Engine (Sophie):</strong> Context-aware chatbot that queries the live database for 100% accurate historical reporting.</li>
          </ul>
        </div>
        <div className={styles.imageContent}>
          <img src="/images/door.png" alt="CaffAIne Door" />
        </div>
      </div>
    )
  },
  {
    id: 6,
    type: 'grid',
    title: 'Technologies Used',
    content: (
      <div className={styles.techGrid}>
        <div className={styles.techCard}>
          <Monitor size={48} color="var(--accent-gold)" style={{marginBottom: '20px'}}/>
          <h4>Frontend</h4>
          <p>React.js, Context API, CSS Modules</p>
        </div>
        <div className={styles.techCard}>
          <Code2 size={48} color="var(--accent-gold)" style={{marginBottom: '20px'}}/>
          <h4>Backend</h4>
          <p>Node.js, Express.js</p>
        </div>
        <div className={styles.techCard}>
          <Database size={48} color="var(--accent-gold)" style={{marginBottom: '20px'}}/>
          <h4>Database</h4>
          <p>MySQL (Relational Integrity)</p>
        </div>
        <div className={styles.techCard}>
          <Cpu size={48} color="var(--accent-gold)" style={{marginBottom: '20px'}}/>
          <h4>AI & Cloud</h4>
          <p>OpenAI API, Microsoft Azure</p>
        </div>
      </div>
    )
  },
  {
    id: 7,
    type: 'content',
    title: 'System Design',
    content: (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <div style={{ width: '100%', height: '500px', border: '2px dashed var(--accent-gold)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.5)' }}>
          <p style={{ fontSize: '1.5rem', color: '#666' }}>[ Insert Architecture / ER Diagram Screenshot Here ]</p>
        </div>
      </div>
    )
  },
  {
    id: 8,
    type: 'content',
    title: 'Challenges & Solutions',
    content: (
      <div className={styles.textContent} style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}>
            <strong style={{color: '#991b1b'}}>Challenge:</strong> AI Hallucinations providing incorrect prices.<br/>
            <strong style={{color: '#15803d'}}>Solution:</strong> Strict database grounding; Sophie fetches real-time prices before answering.
          </li>
          <li className={styles.bulletItem}>
            <strong style={{color: '#991b1b'}}>Challenge:</strong> Browsers blocking automated audio alarms for orders.<br/>
            <strong style={{color: '#15803d'}}>Solution:</strong> Shifted to Web Audio API triggered by initial user interaction.
          </li>
          <li className={styles.bulletItem}>
            <strong style={{color: '#991b1b'}}>Challenge:</strong> Managing cart state & preventing out-of-stock orders.<br/>
            <strong style={{color: '#15803d'}}>Solution:</strong> React Context API combined with live backend validation.
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 9,
    type: 'content',
    title: 'Conclusion',
    content: (
      <div className={styles.splitLayout}>
        <div className={styles.textContent}>
          <ul className={styles.bulletList}>
            <li className={styles.bulletItem}>Successfully developed a full-stack, production-ready system deployed on Azure.</li>
            <li className={styles.bulletItem}>Dramatically improved operational efficiency for café management through automation.</li>
            <li className={styles.bulletItem}>Delivered a premium user experience that elevates the CaffAIne brand.</li>
            <li className={styles.bulletItem}>Proved that AI can be practically integrated into F&B operations accurately.</li>
          </ul>
        </div>
      </div>
    )
  },
  {
    id: 10,
    type: 'content',
    title: 'Future Work',
    content: (
      <div className={styles.textContent} style={{ maxWidth: '800px', margin: '0 auto' }}>
        <ul className={styles.bulletList}>
          <li className={styles.bulletItem}><strong>Mobile Application:</strong> Porting the interface to React Native for iOS/Android.</li>
          <li className={styles.bulletItem}><strong>Predictive Inventory AI:</strong> Machine learning models to predict stock shortages before they happen based on weather and season.</li>
          <li className={styles.bulletItem}><strong>Loyalty Program:</strong> Implementing a digital rewards system integrated with profiles.</li>
          <li className={styles.bulletItem}><strong>Payment Gateway:</strong> Adding live credit card processing APIs (e.g., Stripe).</li>
        </ul>
      </div>
    )
  },
  {
    id: 11,
    type: 'title',
    title: 'Thank You!',
    subtitle: 'Questions & Discussion',
    content: (
      <div style={{ marginTop: '80px' }}>
        <img src="/images/caffaine-logo.png" alt="Logo" style={{ width: '150px', opacity: 0.8 }} />
      </div>
    )
  }
];

export default function Presentation() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        setCurrentSlide(prev => Math.min(prev + 1, slidesData.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const nextSlide = () => setCurrentSlide(p => Math.min(p + 1, slidesData.length - 1));
  const prevSlide = () => setCurrentSlide(p => Math.max(p - 1, 0));

  return (
    <div className={styles.container}>
      <div className={styles.bgPattern} />
      
      {slidesData.map((slide, index) => (
        <div 
          key={slide.id} 
          className={`${styles.slide} ${index === currentSlide ? styles.active : ''} ${index < currentSlide ? styles.previous : ''}`}
        >
          {slide.type === 'title' ? (
            <div style={{ textAlign: 'center' }}>
              <h1 className={styles.title} style={{ fontSize: '6rem' }}>{slide.title}</h1>
              <h2 className={styles.subtitle} style={{ fontSize: '2.5rem' }}>{slide.subtitle}</h2>
              {slide.content}
            </div>
          ) : (
            <>
              <h2 className={styles.sectionTitle}>{slide.title}</h2>
              {slide.content}
            </>
          )}
        </div>
      ))}

      <div className={styles.controls}>
        <button className={styles.controlBtn} onClick={prevSlide} disabled={currentSlide === 0}>
          <ChevronLeft size={32} />
        </button>
        <div className={styles.progress}>
          {currentSlide + 1} / {slidesData.length}
        </div>
        <button className={styles.controlBtn} onClick={nextSlide} disabled={currentSlide === slidesData.length - 1}>
          <ChevronRight size={32} />
        </button>
      </div>
    </div>
  );
}
