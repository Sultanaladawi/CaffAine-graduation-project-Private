import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAdminContext } from '../AdminContext';
import { 
  ShoppingBag, LayoutGrid, DollarSign, AlertTriangle, 
  TrendingUp, Clock, Zap, Activity, Users, 
  ChevronRight, Calendar, Bell, ShieldCheck, Coffee, Search, Terminal, Cpu
} from 'lucide-react';

const Dashboard = () => {
  const { admin } = useAdminContext();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalSales: 0,
    todaySales: 0,
    todayOrders: 0,
    storeStatus: 'unknown',
    storeMode: 'auto',
    lowStock: 0,
    lowStockItems: [],
    dailySales: []
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  const theme = {
    bg: '#070504',
    card: 'rgba(255, 255, 255, 0.02)',
    accent: '#c4a484',
    border: 'rgba(196, 164, 132, 0.15)',
    text: '#e6d5c3',
    success: '#38ef7d',
    warning: '#f59e0b',
    info: '#4facfe',
    danger: '#ff4d4d'
  };

  const fetchDashboardData = async () => {
    try {
      const response = await axios.get('/api/dashboard-stats');
      const incomingData = response.data.data || response.data;
      
      const last7Days = [];
      const formatDate = (date) => {
        const d = new Date(date);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      };

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = formatDate(d);
        
        const realData = (incomingData.dailySales || []).find(item => {
           const itemDateStr = formatDate(item.date);
           return itemDateStr === dateStr;
        });

        last7Days.push({
          day: d.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
          total: realData ? parseFloat(realData.total) : 0,
          isToday: i === 0,
          fullDate: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
        });
      }

      setStats({
        totalProducts: incomingData.totalProducts || 0,
        totalOrders: incomingData.totalOrders || 0,
        totalSales: parseFloat(incomingData.totalSales || 0),
        todaySales: incomingData.todaySales || 0,
        todayOrders: incomingData.todayOrders || 0,
        storeStatus: incomingData.storeStatus || 'unknown',
        storeMode: incomingData.storeMode || 'auto',
        lowStock: incomingData.lowStock || 0,
        lowStockItems: incomingData.lowStockItems || [],
        dailySales: last7Days
      });
      setLoading(false);
    } catch (err) {
      console.error("Dashboard API Error:", err.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const poll = setInterval(fetchDashboardData, 30000);
    return () => {
      clearInterval(timer);
      clearInterval(poll);
    };
  }, []);

  const cards = [
    { title: 'Gross Revenue', value: `£${stats.totalSales.toFixed(2)}`, icon: DollarSign, color: theme.accent, desc: 'Real-time valuation', path: '/admin/orders' },
    { title: 'Active Orders', value: stats.totalOrders, icon: ShoppingBag, color: theme.info, desc: 'System processing', path: '/admin/orders' },
    { title: 'Catalog Density', value: stats.totalProducts, icon: LayoutGrid, color: theme.success, desc: 'Menu items verified', path: '/admin/products' },
    { title: 'Logistics Risk', value: stats.lowStock, icon: AlertTriangle, color: theme.danger, desc: stats.lowStock > 0 ? 'CRITICAL ALERT' : 'SUPPLY STABLE', path: '/admin/inventory' },
  ];

  const maxSales = Math.max(...stats.dailySales.map(d => d.total), 1);

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', padding: '40px', fontFamily: "'Inter', sans-serif", color: theme.text, position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 50% -20%, #2a1b10 0%, #070504 70%)`, zIndex: 0 }} />
      <div className="orb orb-1" />
      <div className="orb orb-2" />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@400;700;900&display=swap');
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); z-index: 0; opacity: 0.05; animation: float 25s infinite alternate ease-in-out; }
        .orb-1 { width: 600px; height: 600px; background: ${theme.accent}; top: -200px; right: -100px; }
        .orb-2 { width: 500px; height: 500px; background: #2a1b10; bottom: -100px; left: -100px; }
        @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(50px, 50px) scale(1.1); } }
        
        .stat-card { background: rgba(255,255,255,0.025); border: 1px solid ${theme.border}; border-radius: 28px; padding: 30px; transition: 0.4s; position: relative; z-index: 1; backdrop-filter: blur(10px); cursor: pointer; }
        .stat-card:hover { transform: translateY(-10px); border-color: ${theme.accent}66; background: rgba(196, 164, 132, 0.05); box-shadow: 0 30px 60px rgba(0,0,0,0.6); }
        
        .chart-container { background: rgba(255,255,255,0.015); border: 1px solid ${theme.border}; border-radius: 35px; padding: 40px; position: relative; z-index: 1; }
        .bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 10px; position: relative; }
        .bar-tooltip { position: absolute; top: -30px; background: ${theme.accent}; color: #070504; padding: 5px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 900; opacity: 0; transition: 0.3s; pointer-events: none; }
        .bar-wrapper:hover .bar-tooltip { opacity: 1; transform: translateY(-10px); }
        .terminal-box { background: #0d0806; border: 1px solid ${theme.border}; border-radius: 25px; padding: 25px; font-family: 'Inter', monospace; font-size: 0.8rem; color: #aaa; }
        
        .page-badge { background: #1b130e; border: 1px solid ${theme.border}; padding: 12px 25px; border-radius: 18px; display: inline-flex; align-items: center; gap: 12px; margin: 20px 0; }
        .page-badge span { font-family: 'Inter', sans-serif; font-size: 2rem; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
        
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 15px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 10px;
        }
        .status-open { background: rgba(196, 164, 132, 0.1); color: #c4a484; border: 1px solid rgba(196, 164, 132, 0.2); }
        .status-closed { background: rgba(255, 77, 77, 0.1); color: #ff4d4d; border: 1px solid rgba(255, 77, 77, 0.2); }
        .status-auto { background: rgba(56, 239, 125, 0.1); color: #38ef7d; border: 1px solid rgba(56, 239, 125, 0.2); }
        .pulse { width: 8px; height: 8px; border-radius: 50%; }
        .pulse-open { background: #c4a484; box-shadow: 0 0 10px #c4a484; animation: pulse-beige 2s infinite; }
        .pulse-closed { background: #ff4d4d; box-shadow: 0 0 10px #ff4d4d; animation: pulse-red 2s infinite; }
        .pulse-auto { background: #38ef7d; box-shadow: 0 0 10px #38ef7d; animation: pulse-green 2s infinite; }
        @keyframes pulse-beige { 0% { box-shadow: 0 0 0 0 rgba(196, 164, 132, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(196, 164, 132, 0); } 100% { box-shadow: 0 0 0 0 rgba(196, 164, 132, 0); } }
        @keyframes pulse-red { 0% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(255, 77, 77, 0); } 100% { box-shadow: 0 0 0 0 rgba(255, 77, 77, 0); } }
        @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(56, 239, 125, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(56, 239, 125, 0); } 100% { box-shadow: 0 0 0 0 rgba(56, 239, 125, 0); } }
      `}</style>

      {/* Clean & Elegant Header */}
      <div style={{ position: 'relative', zIndex: 1, marginBottom: '50px' }}>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.8rem', color: theme.accent, lineHeight: 1 }}>
          Faculty <span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
        </div>

        <div className="page-badge">
          <Activity size={28} color={theme.accent} />
          <span>Operational Dashboard</span>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 500, marginTop: '5px' }}>
          Real-time analytics and system performance monitoring.
        </p>

        {/* Real-time Summary Cards */}
        <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
          <div style={{ background: 'rgba(56, 239, 125, 0.05)', border: '1px solid rgba(56, 239, 125, 0.15)', padding: '10px 20px', borderRadius: '14px' }}>
            <div style={{ fontSize: '0.6rem', color: '#38ef7d', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Today's Revenue</div>
            <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '900' }}>£{parseFloat(stats.todaySales || 0).toFixed(2)}</div>
          </div>
          <div style={{ background: 'rgba(79, 172, 254, 0.05)', border: '1px solid rgba(79, 172, 254, 0.15)', padding: '10px 20px', borderRadius: '14px' }}>
            <div style={{ fontSize: '0.6rem', color: '#4facfe', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Today's Orders</div>
            <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '900' }}>{stats.todayOrders || 0}</div>
          </div>
        </div>

        <div className={`status-badge ${stats.storeMode === 'auto' ? 'status-auto' : (stats.storeMode === 'manual_open' ? 'status-open' : 'status-closed')}`}>
          <div className={`pulse ${stats.storeMode === 'auto' ? 'pulse-auto' : (stats.storeMode === 'manual_open' ? 'pulse-open' : 'pulse-closed')}`} />
          {stats.storeMode === 'auto' 
            ? `AUTO MODE: ${stats.storeStatus.toUpperCase()}` 
            : `MANUAL: ${stats.storeStatus.toUpperCase()}`}
        </div>

        {/* Minimal Clock */}
        <div style={{ position: 'absolute', top: 0, right: 0, textAlign: 'right' }}>
           <div style={{ color: theme.accent, fontSize: '1rem', fontWeight: 900, letterSpacing: '1px' }}>
             <Clock size={16} style={{ marginRight: '8px', verticalAlign: 'middle' }} /> 
             {currentTime.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: true }).toUpperCase()}
           </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '25px', marginBottom: '40px', position: 'relative', zIndex: 1 }}>
        {cards.map((c, i) => (
          <div key={i} className="stat-card" onClick={() => navigate(c.path)}>
            <div style={{ background: `${c.color}22`, color: c.color, padding: '12px', borderRadius: '15px', width: 'fit-content', marginBottom: '20px', border: `1px solid ${c.color}33` }}>
              <c.icon size={22} />
            </div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '2.5px', marginBottom: '8px' }}>{c.title}</div>
            <div style={{ color: '#fff', fontSize: '2.2rem', fontWeight: 900, fontFamily: 'monospace' }}>{c.value}</div>
            <div style={{ color: c.color, fontSize: '0.65rem', marginTop: '15px', fontWeight: 700, opacity: 0.8, display: 'flex', alignItems: 'center', gap: '5px' }}>
              {c.desc} <ChevronRight size={12} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '30px', position: 'relative', zIndex: 1 }}>
        <div className="chart-container">
          <div style={{ marginBottom: '35px' }}>
            <h3 style={{ fontFamily: "'DM Serif Display', serif", fontSize: '1.8rem', color: '#fff', margin: 0 }}>Verified Performance</h3>
            <p style={{ color: theme.accent, fontSize: '0.7rem', fontWeight: 900, letterSpacing: '2.5px', marginTop: '5px' }}>DATA SOURCE: LIVE METRICS SYNC</p>
          </div>
          <div style={{ height: '280px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '20px' }}>
            {stats.dailySales.map((d, i) => (
              <div key={i} className="bar-wrapper">
                <div className="bar-tooltip">£{d.total.toFixed(2)}</div>
                <div style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 900, opacity: d.total > 0 ? 0.9 : 0, marginBottom: '5px' }}>£{d.total.toFixed(0)}</div>
                <div style={{ 
                  width: '100%', height: `${(d.total / maxSales) * 100}%`, minHeight: d.total > 0 ? '8px' : '4px',
                  background: d.isToday ? `linear-gradient(180deg, ${theme.accent}, #8c6a56)` : `linear-gradient(180deg, rgba(196,164,132,0.1), rgba(196,164,132,0.3))`,
                  borderRadius: '12px', transition: '1s cubic-bezier(0.23, 1, 0.32, 1)',
                  boxShadow: d.isToday && d.total > 0 ? `0 0 25px ${theme.accent}44` : 'none', border: d.isToday ? `1px solid ${theme.accent}66` : 'none'
                }} />
                <div style={{ fontSize: '0.75rem', fontWeight: 900, color: d.isToday ? theme.accent : 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: '10px' }}>
                  {d.day}
                  <div style={{ fontSize: '0.55rem', opacity: 0.5 }}>{d.fullDate}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Terminal size={18} color={theme.accent} />
            <h3 style={{ fontSize: '0.8rem', color: '#fff', fontWeight: 900, letterSpacing: '2.5px' }}>CORE MONITOR</h3>
          </div>
          <div className="terminal-box">
            <div style={{ color: theme.success }}>[SYSTEM] REPOSITORY_CONNECTED</div>
            <div style={{ color: theme.accent }}>[STATUS] CORE_RESOURCES_OPTIMAL...</div>
            <div style={{ color: '#fff', marginTop: '10px', fontWeight: 800 }}>RECENT METRICS:</div>
            {stats.dailySales.filter(d => d.total > 0).slice(-2).map((d, i) => (
              <div key={i} style={{ color: '#eee' }}>- {d.fullDate} ({d.day}): £{d.total.toFixed(2)}</div>
            ))}
            <div style={{ marginTop: '15px', color: 'rgba(255,255,255,0.3)', fontStyle: 'italic' }}>$ Monitoring system health...</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;