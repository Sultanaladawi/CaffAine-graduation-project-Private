import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { useAdminContext } from './AdminContext';
import { useStore } from '../context/StoreContext';
import {
  LayoutGrid, ShoppingBag, ShoppingCart, Box,
  BarChart3, MessageSquare, BotMessageSquare, LogOut, User, Coffee,
  FileText, MessagesSquare, Volume2, VolumeX, Briefcase, BellRing,
  Power, Store, Mail
} from 'lucide-react';

const AdminLayout = () => {
  const { admin, loading, logout } = useAdminContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [showAudioBtn, setShowAudioBtn] = useState(false);
  const audioRef = useRef(null);
  const { isStoreOpen, manualStatus, toggleStatus } = useStore();
  const lastLowStockCount = useRef(0);

  useEffect(() => {
    if (!admin) return;
    const checkStock = async () => {
      try {
        const res = await axios.get('/api/dashboard-stats');
        const data = res.data?.data || res.data;
        const count = data?.lowStock || 0;

        if (count > 0 && count > lastLowStockCount.current) {
          setShowAudioBtn(true);
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio play blocked.", e));
          }
        }
        lastLowStockCount.current = count;
      } catch (err) { }
    };

    checkStock();
    const interval = setInterval(checkStock, 10000); // Check every 10 seconds for real-time feel
    return () => clearInterval(interval);
  }, [admin]);

  const handleStopAudio = () => {
    setShowAudioBtn(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
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

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  if (loading) return null;
  if (!admin && location.pathname.startsWith('/admin')) return null;

  const menuItems = [
    { path: '/admin/dashboard', name: 'Dashboard', icon: <LayoutGrid size={18} /> },
    { path: '/admin/orders', name: 'Orders', icon: <ShoppingCart size={18} /> },
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
              <Link key={item.path} to={item.path} style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 25px',
                color: isActive ? '#fff' : 'var(--admin-text)',
                textDecoration: 'none',
                backgroundColor: isActive ? 'rgba(196, 164, 132, 0.12)' : 'transparent',
                borderLeft: isActive ? '4px solid var(--admin-accent)' : '4px solid transparent',
                fontSize: '0.9rem',
                fontWeight: isActive ? '700' : '500',
                margin: '2px 0',
                transition: 'all 0.3s ease'
              }}>
                {item.icon} {item.name}
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
            <audio ref={audioRef} src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3" loop preload="auto" />

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
                  manualStatus === 'open' ? 'rgba(196, 164, 132, 0.15)' : 'rgba(255, 77, 77, 0.1)',
                borderRadius: '25px',
                border: manualStatus === 'auto' ? '1px solid rgba(56, 239, 125, 0.3)' :
                  manualStatus === 'open' ? '1px solid var(--admin-accent)' : '1px solid rgba(255, 77, 77, 0.3)',
                cursor: 'pointer',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: '0 0 15px rgba(0,0,0,0.2)',
                position: 'relative',
              }}
            >
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                backgroundColor: manualStatus === 'auto' ? '#38ef7d' :
                  manualStatus === 'open' ? 'var(--admin-accent)' : '#ff4d4d',
                boxShadow: `0 0 12px ${manualStatus === 'auto' ? '#38ef7d' : manualStatus === 'open' ? 'var(--admin-accent)' : '#ff4d4d'}`,
                animation: manualStatus === 'closed' ? 'alarmPulse 1.5s infinite' : 'none'
              }}></div>
              <span style={{
                color: manualStatus === 'auto' ? '#38ef7d' :
                  manualStatus === 'open' ? 'var(--admin-accent)' : '#ff4d4d',
                fontSize: '0.8rem', fontWeight: '900', letterSpacing: '1.2px',
                textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                {manualStatus === 'auto' ? <><Store size={14} /> Auto (Open)</> :
                  manualStatus === 'open' ? <><Coffee size={14} /> Manual Open</> :
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
      `}</style>
    </div>
  );
};

export default AdminLayout;
