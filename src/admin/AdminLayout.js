import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAdminContext } from './AdminContext';
import { useStore } from '../context/StoreContext';
import {
  LayoutGrid, ShoppingBag, ShoppingCart, Box,
  BarChart3, MessageSquare, BotMessageSquare, LogOut, User, Coffee,
  FileText, MessagesSquare, Volume2, VolumeX, Briefcase, BellRing,
  Power, Store, Mail, Activity
} from 'lucide-react';

// Setup global axios interceptor to attach admin identity for Audit Logs
axios.interceptors.request.use(config => {
  const session = sessionStorage.getItem('admin_session');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      config.headers['X-Admin-Email'] = parsed.email;
      config.headers['X-Admin-Name'] = parsed.name;
    } catch(e) {}
  }
  return config;
});

const AdminLayout = () => {
  const { admin, loading, logout } = useAdminContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAudioBtn, setShowAudioBtn] = useState(false);
  const alarmIntervalRef = useRef(null);
  const { isStoreOpen, manualStatus, toggleStatus } = useStore();
  const lastLowStockCount = useRef(0);
  const lastOrderCount = useRef(null); // null = first load, don't ring
  const [newOrderCount, setNewOrderCount] = useState(0);

  // Play a pleasant 3-beep chime using Web Audio API (no external files needed)
  const playOrderChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playBeep = (freq, startTime, duration) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.6, startTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      const t = ctx.currentTime;
      playBeep(880, t, 0.18);         // A5
      playBeep(1100, t + 0.22, 0.18); // C#6
      playBeep(1320, t + 0.44, 0.28); // E6
    } catch (e) {
      console.log('Audio chime error:', e);
    }
  };

  useEffect(() => {
    if (!admin) return;

    const checkStock = async () => {
      try {
        const res = await axios.get('/api/dashboard-stats');
        const data = res.data?.data || res.data;
        const lowStock = data?.lowStock || 0;
        if (lowStock > 0 && lowStock > lastLowStockCount.current) {
          setShowAudioBtn(true);
          // Play alarm immediately then repeat every 4 seconds until stopped
          playStockAlarm();
          if (alarmIntervalRef.current) clearInterval(alarmIntervalRef.current);
          alarmIntervalRef.current = setInterval(playStockAlarm, 4000);
        }
        lastLowStockCount.current = lowStock;
      } catch (err) { }
    };

    const checkOrders = async () => {
      try {
        const res = await axios.get('/api/orders');
        const orders = Array.isArray(res.data) ? res.data : [];
        const pendingOrders = orders.filter(o =>
          !o.status || o.status.toLowerCase() === 'pending' || o.status.toLowerCase() === 'preparing'
        );
        const currentCount = pendingOrders.length;

        if (lastOrderCount.current === null) {
          // First load — just record the count, don't alert
          lastOrderCount.current = currentCount;
        } else if (currentCount > lastOrderCount.current) {
          const diff = currentCount - lastOrderCount.current;
          setNewOrderCount(prev => prev + diff);
          playOrderChime();
          lastOrderCount.current = currentCount;
        } else {
          lastOrderCount.current = currentCount;
        }
      } catch (err) { }
    };

    checkStock();
    checkOrders();
    const stockInterval = setInterval(checkStock, 10000);
    const orderInterval = setInterval(checkOrders, 8000); // Check every 8 seconds
    return () => {
      clearInterval(stockInterval);
      clearInterval(orderInterval);
    };
  }, [admin]);

  // Play urgent low-stock alarm using Web Audio API
  const playStockAlarm = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const playUrgentBeep = (startTime) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'square';
        osc.frequency.setValueAtTime(660, startTime);
        osc.frequency.setValueAtTime(440, startTime + 0.15);
        gain.gain.setValueAtTime(0.5, startTime);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.28);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      };
      const t = ctx.currentTime;
      playUrgentBeep(t);
      playUrgentBeep(t + 0.35);
      playUrgentBeep(t + 0.70);
    } catch (e) {
      console.log('Stock alarm error:', e);
    }
  };

  const handleStopAudio = () => {
    setShowAudioBtn(false);
    if (alarmIntervalRef.current) {
      clearInterval(alarmIntervalRef.current);
      alarmIntervalRef.current = null;
    }
  };
  useEffect(() => {
    document.documentElement.style.zoom = "90%";
    document.body.style.backgroundColor = "var(--admin-bg)";
    document.documentElement.style.backgroundColor = "var(--admin-bg)";

    if (!loading && !admin && location.pathname.startsWith('/admin')) {
      navigate('/admin/login', { replace: true });
    }
  }, [admin, loading, location.pathname, navigate]);

  const handleLogout = async () => {
    try {
      // Log the logout event before clearing session
      await axios.post('/api/admin/log', { 
        action: 'LOGOUT', 
        details: 'Administrator manually logged out of the session.' 
      });
    } catch (e) {
      console.error('Logout logging failed', e);
    }
    logout();
    navigate('/admin/login');
  };

  if (loading) return null;
  if (!admin && location.pathname.startsWith('/admin')) return null;

  let menuItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: <LayoutGrid size={18} /> },
    { path: '/admin/orders', name: 'Orders', icon: <ShoppingCart size={18} />, badge: newOrderCount },
    { path: '/admin/products', name: 'Products', icon: <ShoppingBag size={18} /> },
    { path: '/admin/inventory', name: 'Inventory', icon: <Box size={18} /> },
    { path: '/admin/analytics', name: 'Analytics', icon: <BarChart3 size={18} /> },
    { path: '/admin/offers', name: 'Offers', icon: <ShoppingCart size={18} /> },
    { path: '/admin/jobs', name: 'Manage Jobs', icon: <Briefcase size={18} /> },
    { path: '/admin/applications', name: 'Job Requests', icon: <FileText size={18} /> },
    { path: '/admin/messages', name: 'Inbox Messages', icon: <Mail size={18} /> },
    { path: '/admin/feedback', name: 'Feedback & Notes', icon: <MessageSquare size={18} /> },
    { path: '/admin/ai-assistant', name: 'AI Assistant', icon: <BotMessageSquare size={18} /> },
  ];

  if (admin?.role === 'super_admin') {
    menuItems.push({ path: '/admin/leader', name: 'Team Activity', icon: <Activity size={18} /> });
  }

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: 'var(--admin-bg)',
      fontFamily: "'Inter', sans-serif",
      margin: 0, padding: 0
    }}>
      <div style={{
        width: '260px', backgroundColor: 'var(--admin-card)', position: 'fixed',
        height: '100vh', borderRight: '1px solid var(--admin-border)', zIndex: 1000,
        display: 'flex', flexDirection: 'column', boxShadow: '4px 0 15px rgba(0,0,0,0.4)'
      }}>
        <div style={{ padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ color: 'var(--admin-accent)', marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
            <Coffee size={36} />
          </div>
          <h1 style={{
            margin: 0, fontSize: '1.1rem', color: '#fff', fontWeight: '900',
            letterSpacing: '2px', textTransform: 'uppercase', fontFamily: "'DM Serif Display', serif"
          }}>
            Faculty <span style={{ color: 'var(--admin-accent)' }}>Coffee</span>
          </h1>
        </div>

        <nav style={{ marginTop: '20px', flexGrow: 1, overflowY: 'auto', paddingBottom: '20px' }}>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => { if (item.badge) setNewOrderCount(0); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 25px',
                  color: isActive ? '#fff' : 'var(--admin-text)',
                  textDecoration: 'none',
                  backgroundColor: isActive ? 'rgba(196, 164, 132, 0.12)' : 'transparent',
                  borderLeft: isActive ? '4px solid var(--admin-accent)' : '4px solid transparent',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? '700' : '500',
                  margin: '2px 0',
                  transition: 'all 0.3s ease',
                  position: 'relative'
                }}
              >
                {item.icon} {item.name}
                {item.badge > 0 && (
                  <span style={{
                    position: 'absolute', right: '18px',
                    backgroundColor: '#ff4d4d',
                    color: '#fff', borderRadius: '50%',
                    width: '20px', height: '20px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: '900',
                    boxShadow: '0 0 10px rgba(255,77,77,0.6)',
                    animation: 'alarmPulse 1.5s infinite'
                  }}>{item.badge > 9 ? '9+' : item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div style={{ padding: '25px', borderTop: '1px solid var(--admin-border)' }}>
          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--admin-accent)',
            cursor: 'pointer', border: 'none', backgroundColor: 'transparent',
            fontSize: '0.9rem', fontWeight: '700', width: '100%', transition: '0.3s'
          }}>
            <LogOut size={18} /> Logout Session
          </button>
        </div>
      </div>

      <div style={{
        marginLeft: '260px', flex: 1, display: 'flex', flexDirection: 'column',
        minHeight: '100vh', backgroundColor: 'var(--admin-bg)'
      }}>
        <header style={{
          height: '80px', backgroundColor: 'var(--admin-card)', borderBottom: '1px solid var(--admin-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          padding: '0 40px', position: 'sticky', top: 0, zIndex: 999, gap: '20px'
        }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <audio ref={undefined} style={{display:'none'}} />

            {/* New Order Alert Banner */}
            {newOrderCount > 0 && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                backgroundColor: 'rgba(196,164,132,0.15)',
                border: '1px solid rgba(196,164,132,0.4)',
                padding: '7px 16px', borderRadius: '20px',
                animation: 'alarmPulse 1.5s infinite',
                cursor: 'pointer'
              }}
              onClick={() => { setNewOrderCount(0); navigate('/admin/orders'); }}
              >
                <BellRing size={16} color="#c4a484" style={{ animation: 'bellRing 0.5s infinite alternate' }} />
                <span style={{ color: '#c4a484', fontWeight: '900', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
                  {newOrderCount} NEW ORDER{newOrderCount > 1 ? 'S' : ''}!
                </span>
              </div>
            )}

            {showAudioBtn && (
              <button
                onClick={handleStopAudio}
                style={{
                  backgroundColor: '#ff4d4d', color: '#fff', border: '1px solid rgba(255, 77, 77, 0.5)',
                  padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px',
                  cursor: 'pointer', boxShadow: '0 0 15px rgba(255, 77, 77, 0.4)', animation: 'alarmPulse 1s infinite',
                  fontWeight: '800', fontSize: '0.75rem', letterSpacing: '0.5px'
                }}
              >
                <BellRing size={16} /> STOP ALARM
              </button>
            )}

            {/* Store Status Toggle Button - 3 States */}
            <button
              onClick={toggleStatus}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '8px 18px',
                backgroundColor: manualStatus === 'auto' ? 'rgba(56, 239, 125, 0.1)' :
                  manualStatus === 'manual_open' ? 'rgba(196, 164, 132, 0.15)' : 'rgba(255, 77, 77, 0.1)',
                borderRadius: '25px',
                border: manualStatus === 'auto' ? '1px solid rgba(56, 239, 125, 0.3)' :
                  manualStatus === 'manual_open' ? '1px solid var(--admin-accent)' : '1px solid rgba(255, 77, 77, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 15px rgba(0,0,0,0.2)',
                position: 'relative',
              }}
            >
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                backgroundColor: manualStatus === 'auto' ? '#38ef7d' :
                  manualStatus === 'manual_open' ? 'var(--admin-accent)' : '#ff4d4d',
                boxShadow: `0 0 12px ${manualStatus === 'auto' ? '#38ef7d' : manualStatus === 'manual_open' ? 'var(--admin-accent)' : '#ff4d4d'}`,
                animation: manualStatus === 'manual_closed' ? 'alarmPulse 1.5s infinite' : 'none'
              }}></div>
              <span style={{
                color: manualStatus === 'auto' ? '#38ef7d' :
                  manualStatus === 'manual_open' ? 'var(--admin-accent)' : '#ff4d4d',
                fontSize: '0.8rem', fontWeight: '900', letterSpacing: '1.2px',
                textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                {manualStatus === 'auto' ? <><Store size={14} /> Auto Mode</> :
                  manualStatus === 'manual_open' ? <><Coffee size={14} /> Manual Open</> :
                    <><Power size={14} /> Manual Closed</>}
              </span>
            </button>

            {/* Admin Profile Details */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '15px',
              backgroundColor: 'var(--admin-bg)', padding: '6px 18px', borderRadius: '12px',
              border: '1px solid var(--admin-border)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, color: '#fff', fontSize: '0.9rem', fontWeight: '700', letterSpacing: '0.5px' }}>{admin?.name || 'Administrator'}</p>
                <p style={{ margin: 0, color: 'var(--admin-accent)', fontSize: '0.65rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                  {admin?.role || 'System Admin'}
                </p>
              </div>
              <div style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--admin-accent) 0%, #a47c4f 100%)',
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: 'var(--admin-bg)',
                boxShadow: '0 0 15px rgba(196, 164, 132, 0.2)'
              }}>
                <User size={20} strokeWidth={2.5} />
              </div>
            </div>
          </div>
        </header>

        <main style={{ padding: '40px', flex: 1, backgroundColor: 'var(--admin-bg)' }}>
          <Outlet />
        </main>
      </div>
      <style>{`
        @keyframes alarmPulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.6); transform: scale(1); }
          50% { box-shadow: 0 0 0 10px rgba(255, 77, 77, 0); transform: scale(1.05); }
          100% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); transform: scale(1); }
        }
        @keyframes bellRing {
          0% { transform: rotate(-15deg); }
          100% { transform: rotate(15deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminLayout;
