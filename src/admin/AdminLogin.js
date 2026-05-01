import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminContext } from './AdminContext';
import styles from './AdminLogin.module.css';

export default function AdminLogin() {
  const { login, loading, error } = useAdminContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/admin/dashboard';

  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    
    const success = await login(form.email, form.password);

    if (success) {
      navigate(from, { replace: true });
    } else {
      console.error("Authentication Failed");
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.ring1} />
      <div className={styles.ring2} />
      <div className={styles.ring3} />

      <div className={styles.card}>
        <div className={styles.logoWrap}>
          <div className={styles.logoIcon}>☕</div>
          <h1 className={styles.brand}>Faculty Coffee</h1>
          <p className={styles.subtitle}>Admin Dashboard Portal</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              placeholder="admin@coffee.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.passWrap}>
              <input
                type={showPass ? 'text' : 'password'}
                className={styles.input}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
                tabIndex={-1}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && (
            <div className={styles.errorBox}>
              <span className={styles.errorIcon}>⚠️</span> {error}
            </div>
          )}

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
          >
            {loading ? (
              <span className={styles.spinner} />
            ) : (
              <>Sign In <span className={styles.arrow}>→</span></>
            )}
          </button>
        </form>

        <p className={styles.hint}>
          Restricted access for Faculty Coffee Authorized Personnel only.
        </p>
      </div>
    </div>
  );
}