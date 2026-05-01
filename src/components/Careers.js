import { useState, useEffect } from 'react';
import { useReveal } from '../hooks/useReveal';
import { shopInfo } from '../data/shopData';
import styles from './Careers.module.css';

const ICON_MAP = {
  'Barista':           'fa-mug-hot',
  'Kitchen Assistant': 'fa-bread-slice',
  'Front of House':    'fa-users',
};

function getIcon(title) {
  return ICON_MAP[title] || 'fa-briefcase';
}

export default function Careers() {
  const [headerRef, headerVis] = useReveal();
  const [bodyRef,   bodyVis]   = useReveal();

  const [roles,   setRoles]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cover_letter: ''
  });

  const getApiUrl = (path) => {
    return `${path}`;
  };

  useEffect(() => {
    async function fetchCareers() {
      try {
        const response = await fetch(getApiUrl('/api/careers'));
        if (!response.ok) throw new Error('Failed to fetch');
        const data = await response.json();
        if (data && data.length > 0) setRoles(data);
      } catch (error) {
        console.error('Error fetching careers:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchCareers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg({ type: '', text: '' });

    try {
      const response = await fetch(getApiUrl('/api/applications'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          position: selectedRole.title,
          resume_url: null 
        })
      });

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const resData = await response.json();
        if (response.ok) {
          setStatusMsg({ type: 'success', text: 'Application submitted successfully!' });
          setFormData({ name: '', email: '', phone: '', cover_letter: '' });
          setTimeout(() => setSelectedRole(null), 3000);
        } else {
          throw new Error(resData.error || 'Failed to submit');
        }
      } else {
        throw new Error('Server Error: Something went wrong. Please try again.');
      }
    } catch (error) {
      setStatusMsg({ type: 'error', text: 'Something went wrong. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={styles.careers} id="careers">
      <div className="section-wrap">
        <div ref={headerRef} className={`${styles.header} reveal ${headerVis ? 'vis' : ''}`}>
          <div className="label">Work With Us</div>
          <div className="divider" />
          <h2 className={styles.mainTitle}>Join Our Team</h2>
        </div>

        <div ref={bodyRef} className={`${styles.body} reveal ${bodyVis ? 'vis' : ''}`}>
          <div className={styles.left}>
            {selectedRole ? (
              <div className={styles.formContainer}>
                <h3 className={styles.applyingFor}>
                  Applying for: <span>{selectedRole.title}</span>
                </h3>
                <form onSubmit={handleSubmit} className={styles.form}>
                  <input 
                    type="text" placeholder="Full Name" required 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                    className={styles.inputField}
                  />
                  <input 
                    type="email" placeholder="Email Address" required 
                    value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})}
                    className={styles.inputField}
                  />
                  <input 
                    type="tel" placeholder="Phone Number" required 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})}
                    className={styles.inputField}
                  />
                  <textarea 
                    placeholder="Tell us about your experience..." required 
                    value={formData.cover_letter} onChange={e => setFormData({...formData, cover_letter: e.target.value})}
                    className={styles.textAreaField}
                  />
                  
                  {statusMsg.text && (
                    <p className={statusMsg.type === 'error' ? styles.errorMsg : styles.successMsg}>
                      {statusMsg.text}
                    </p>
                  )}

                  <div className={styles.formActions}>
                    <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
                      {isSubmitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}
                    </button>
                    <button type="button" className={styles.cancelBtn} onClick={() => setSelectedRole(null)}>
                      CANCEL
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className={styles.introContainer}>
                <p className={styles.intro}>
                  Faculty Coffee is always on the lookout for passionate individuals who share our love for specialty coffee and hospitality.
                </p>
                <div className={styles.applyBox}>
                  <span className={styles.applyText}>DIRECT INQUIRIES:</span>
                  <a href={`mailto:${shopInfo.careersEmail}`} className={styles.applyEmail}>
                    <i className="fas fa-envelope" /> {shopInfo.careersEmail}
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className={styles.right}>
            <div className={styles.rolesLabel}>CURRENT OPENINGS</div>

            {loading ? (
              <p style={{ opacity: 0.6 }}>Loading available roles...</p>
            ) : roles.length === 0 ? (
               <p style={{ opacity: 0.6 }}>No open positions at the moment.</p>
            ) : roles.map(r => (
              <div key={r.id} className={`${styles.roleCard} ${selectedRole?.id === r.id ? styles.activeCard : ''}`} onClick={() => setSelectedRole(r)}>
                <div className={styles.roleIcon}>
                  <i className={`fas ${getIcon(r.title)}`} />
                </div>
                <div className={styles.roleInfo}>
                  <div className={styles.roleTitle}>{r.title}</div>
                  <div className={styles.roleType}>{r.type} / {r.location}</div>
                </div>
                <div className={styles.roleArrow}>
                  <i className="fas fa-arrow-right" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}