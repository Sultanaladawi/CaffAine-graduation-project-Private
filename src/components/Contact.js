import { useState } from 'react';
import { shopInfo, openingHours } from '../data/shopData';
import { useReveal } from '../hooks/useReveal';
import styles from './Contact.module.css';

const validate = {
  name:    v => v.trim().length < 2   ? 'Please enter your name.' : '',
  email:   v => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()) ? 'Please enter a valid email address.' : '',
  message: v => v.trim().length < 10  ? 'Message is too short (min 10 chars).' : '',
};

export default function Contact() {
  const [infoRef, infoVis] = useReveal();
  const [formRef, formVis] = useReveal();

  const [fields, setFields] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const change = e => {
    const { name, value } = e.target;
    setFields(p => ({ ...p, [name]: value }));
    if (touched[name]) setErrors(p => ({ ...p, [name]: validate[name](value) }));
  };

  const blur = e => {
    const { name, value } = e.target;
    setTouched(p => ({ ...p, [name]: true }));
    setErrors(p => ({ ...p, [name]: validate[name](value) }));
  };

  const submit = async e => {
    e.preventDefault();
    const errs = Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, validate[k](v)]));
    setErrors(errs);
    setTouched({ name: true, email: true, message: true });
    if (!Object.values(errs).every(x => !x)) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fields.name.trim(),
          email: fields.email.trim(),
          message: fields.message.trim(),
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');
      
      setDone(true);
    } catch (error) {
      console.error('Contact submit error:', error);
      setSubmitError('Something went wrong. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className={styles.contact} id="contact">
      <div className="section-wrap">
        <div className={styles.inner}>
          <div ref={infoRef} className={`${styles.info} reveal ${infoVis ? 'vis' : ''}`}>
            <div className="label">Contact Us</div>
            <div className="divider" />
            <h2 className="h2">Get in Touch</h2>
            <p className={styles.infoDesc}>
              Visit us in the heart of Birmingham or drop a message below. 
              We're always happy to chat about coffee.
            </p>

            <div className={styles.contactDetails}>
               <div className={styles.detailItem}>
                  <i className="fas fa-map-marker-alt" />
                  <div>
                    <strong>Location</strong>
                    <p>{shopInfo.address}, {shopInfo.city}</p>
                  </div>
               </div>
               <div className={styles.detailItem}>
                  <i className="fas fa-envelope" />
                  <div>
                    <strong>Email</strong>
                    <p>{shopInfo.email}</p>
                  </div>
               </div>
            </div>

            <div className={styles.hoursGrid}>
               {openingHours.map(({ day, open, close }) => (
                 <div key={day} className={styles.hourRow}>
                   <span>{day}</span>
                   <span>{open} – {close}</span>
                 </div>
               ))}
            </div>
          </div>

          <div ref={formRef} className={`${styles.formWrap} reveal ${formVis ? 'vis' : ''}`}>
            {!done ? (
              <form onSubmit={submit} noValidate>
                <h3 className={styles.formTitle}>Send a Message</h3>
                
                <div className={styles.fg}>
                  <label htmlFor="name">Your Name</label>
                  <input
                    id="name" name="name" type="text" placeholder="e.g. Alex Smith"
                    value={fields.name} onChange={change} onBlur={blur}
                    className={errors.name ? styles.er : ''}
                  />
                  {errors.name && <span className={styles.em}>{errors.name}</span>}
                </div>

                <div className={styles.fg}>
                  <label htmlFor="email">Email Address</label>
                  <input
                    id="email" name="email" type="email" placeholder="you@example.com"
                    value={fields.email} onChange={change} onBlur={blur}
                    className={errors.email ? styles.er : ''}
                  />
                  {errors.email && <span className={styles.em}>{errors.email}</span>}
                </div>

                <div className={styles.fg}>
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message" name="message" rows={5}
                    placeholder="How can we help?"
                    value={fields.message} onChange={change} onBlur={blur}
                    className={errors.message ? styles.er : ''}
                  />
                  {errors.message && <span className={styles.em}>{errors.message}</span>}
                </div>

                {submitError && <p className={styles.errorText}>{submitError}</p>}

                <button type="submit" className={`btn btn-primary ${styles.submitBtn}`} disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            ) : (
              <div className={styles.success}>
                <div className={styles.successIcon}><i className="fas fa-check" /></div>
                <h3>Message Received</h3>
                <p>Thanks for getting in touch. We'll reply within 24 hours.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}