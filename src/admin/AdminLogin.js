import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdminContext } from './AdminContext';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, ChevronRight, Loader2, AlertTriangle, Coffee, Zap } from 'lucide-react';

export default function AdminLogin() {
  const { login, loading, error } = useAdminContext();
  const navigate = useNavigate();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/admin/dashboard';
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);

  const colors = {
    espresso: '#070504',
    latte: '#c4a484',
    crema: '#e6d5c3',
    border: 'rgba(196, 164, 132, 0.15)',
    danger: '#ff4d4d',
    success: '#38ef7d'
  };

  async function handleSubmit(e) {
    e.preventDefault();
    const success = await login(form.email, form.password);
    if (success) {
      navigate(from, { replace: true });
    }
  }

  return (
    <div style={{ 
      backgroundColor: colors.espresso, 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      position: 'relative', 
      overflow: 'hidden', 
      padding: '20px',
      fontFamily: "'Inter', sans-serif"
    }}>
      {/* Dynamic Animated Background Components */}
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 50% -20%, #2a1b10 0%, #070504 70%)`, zIndex: 0 }} />
      
      {/* Floating Orbs - The "Terrifyingly Professional" Animation */}
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;700;900&display=swap');
        
        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 0;
          opacity: 0.15;
          animation: float 20s infinite alternate ease-in-out;
        }
        .orb-1 { width: 400px; height: 400px; background: ${colors.latte}; top: -100px; left: -100px; animation-duration: 25s; }
        .orb-2 { width: 300px; height: 300px; background: #8c6a56; bottom: -50px; right: -50px; animation-duration: 18s; animation-delay: -5s; }
        .orb-3 { width: 250px; height: 250px; background: ${colors.crema}; top: 40%; left: 60%; animation-duration: 22s; animation-delay: -10s; }
        .orb-4 { width: 350px; height: 350px; background: #2a1b10; bottom: 20%; left: 10%; animation-duration: 30s; animation-delay: -2s; }

        @keyframes float {
          0% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(50px, 100px) scale(1.1); }
          66% { transform: translate(-80px, 50px) scale(0.9); }
          100% { transform: translate(20px, -40px) scale(1); }
        }

        .login-card {
          width: 100%;
          max-width: 400px;
          background: rgba(255, 255, 255, 0.015);
          backdrop-filter: blur(40px);
          border: 1px solid ${colors.border};
          border-radius: 35px;
          padding: 45px 35px;
          position: relative;
          z-index: 1;
          transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
          box-shadow: 0 40px 100px rgba(0,0,0,0.8);
        }
        .login-card:hover {
          border-color: ${colors.latte}66;
          transform: translateY(-8px) scale(1.01);
          box-shadow: 0 50px 120px rgba(0,0,0,0.9);
        }

        .lux-input {
          width: 100%;
          background: rgba(255,255,255,0.02) !important;
          border: 1px solid ${colors.border} !important;
          border-radius: 15px !important;
          padding: 16px 22px !important;
          color: #fff !important;
          outline: none !important;
          transition: 0.3s !important;
          font-size: 0.9rem !important;
        }
        .lux-input:focus {
          border-color: ${colors.latte} !important;
          background: rgba(196, 164, 132, 0.08) !important;
          box-shadow: 0 0 20px ${colors.latte}11;
        }

        .login-btn {
          background: linear-gradient(135deg, #c4a484 0%, #8c6a56 100%);
          color: #070504;
          border: none;
          border-radius: 15px;
          padding: 18px;
          font-weight: 900;
          cursor: pointer;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.4s;
          box-shadow: 0 10px 25px rgba(196, 164, 132, 0.15);
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        .login-btn:hover {
          transform: translateY(-4px);
          filter: brightness(1.1);
          box-shadow: 0 15px 35px rgba(196, 164, 132, 0.3);
        }

        .label-text {
          color: rgba(255,255,255,0.25);
          font-size: 0.6rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 2.5px;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
        }
        .input-group:focus-within .label-text { color: ${colors.latte}; letter-spacing: 4px; }
      `}</style>

      <div className="login-card">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            background: `linear-gradient(135deg, ${colors.latte}15, transparent)`, 
            width: '75px', height: '75px', borderRadius: '22px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            margin: '0 auto 25px auto', color: colors.latte,
            border: `1px solid ${colors.border}`
          }}>
            <ShieldCheck size={38} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.2rem', color: '#fff', margin: '0 0 8px 0', lineHeight: 1 }}>
            Faculty <span style={{ color: colors.latte, fontStyle: 'italic' }}>Vault.</span>
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px' }}>
            Restricted Terminal
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          <div className="input-group">
            <label className="label-text"><Mail size={12} /> Neural ID</label>
            <input type="email" className="lux-input" placeholder="admin@access.coffee" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required autoFocus />
          </div>

          <div className="input-group">
            <label className="label-text"><Lock size={12} /> Security Key</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} className="lux-input" placeholder="••••••••" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: colors.latte, cursor: 'pointer', padding: '5px', opacity: 0.5 }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: 'rgba(255, 77, 77, 0.05)', border: '1px solid rgba(255, 77, 77, 0.1)', borderRadius: '12px', padding: '12px 18px', color: colors.danger, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 700, animation: 'shake 0.4s' }}>
              <AlertTriangle size={16} /> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? <Loader2 className="animate-spin" size={20} /> : <>ESTABLISH ACCESS <Zap size={16} fill="#070504" /></>}
          </button>
        </form>

        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <div style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${colors.border}, transparent)`, marginBottom: '15px' }} />
          <p style={{ color: 'rgba(255,255,255,0.1)', fontSize: '0.55rem', fontWeight: 900, letterSpacing: '2px', textTransform: 'uppercase' }}>
            Faculty Coffee Protocol <Coffee size={10} style={{ marginLeft: '4px' }} />
          </p>
        </div>
      </div>

      <style>{`
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
      `}</style>
    </div>
  );
}