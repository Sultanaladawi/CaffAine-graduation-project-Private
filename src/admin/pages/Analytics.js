import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, ShoppingBag, DollarSign, ArrowUpRight, BarChart3 } from 'lucide-react';


const Analytics = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    todaySales: 0,
    todayOrders: 0,
    lowStock: 0
  });
  const [loading, setLoading] = useState(true);

  const theme = {
    crema: 'var(--admin-accent)',
    espresso: 'var(--admin-bg)',
    card: 'var(--admin-card)',
    text: 'var(--admin-text)',
    border: 'var(--admin-border)'
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('/api/dashboard-stats');
        const d = res.data.data || res.data;
        setStats(d);

        // Process Weekly Data
        const last7Days = [];
        const rawDaily = Array.isArray(d.dailySales) ? d.dailySales : [];
        
        const formatDate = (date) => {
          const d = new Date(date);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        };

        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = formatDate(date);
          
          const match = rawDaily.find(s => formatDate(s.date) === dateStr);

          last7Days.push({
            day: date.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
            total: match ? parseFloat(match.total) : 0,
            fullDate: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
          });
        }
        setWeeklyData(last7Days);

        // Process Category Data
        const rawCats = Array.isArray(d.categoryStats) ? d.categoryStats : [];
        if (rawCats.length > 0) {
          const totalOrdersCount = rawCats.reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);
          const sortedCats = [...rawCats].sort((a,b) => b.count - a.count);
          const topCat = sortedCats[0];
          setTopCategory({
            name: topCat.name,
            percentage: totalOrdersCount > 0 ? Math.round((topCat.count / totalOrdersCount) * 100) : 0
          });
        }

      } catch (err) {
        console.error("Analytics Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const [weeklyData, setWeeklyData] = useState([]);
  const [topCategory, setTopCategory] = useState({ name: 'None', percentage: 0 });

  const maxWeekly = Math.max(...weeklyData.map(d => d.total), 1);

  const cards = [
    { title: 'Total Revenue', value: `£${parseFloat(stats.totalSales).toLocaleString()}`, icon: DollarSign, color: '#38ef7d', desc: 'Live Earnings' },
    { title: 'Total Orders', value: stats.totalOrders, icon: ShoppingBag, color: theme.crema, desc: 'Cumulative' },
    { title: 'Avg Order Value', value: `£${(stats.totalSales / (stats.totalOrders || 1)).toFixed(2)}`, icon: TrendingUp, color: '#4facfe', desc: 'Per Customer' },
    { title: 'Active Products', value: stats.totalProducts, icon: BarChart3, color: '#f093fb', desc: 'In Menu' },
  ];

  if (loading) return <div style={{ color: theme.crema, padding: '40px', backgroundColor: theme.espresso, minHeight: '100vh' }}>Loading Real-time Analytics...</div>;

  return (
    <div className="dashboard-fade-in" style={{ 
      color: theme.latte, 
      backgroundColor: theme.espresso, 
      minHeight: '100vh', 
      padding: '40px 10px 40px 5px',
      position: 'relative'
    }}>
      {/* Premium Background Elements */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 50% -20%, #2a1b10 0%, #070504 70%)` }} />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      <style>{`
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); z-index: 0; opacity: 0.05; animation: float 25s infinite alternate ease-in-out; }
        .orb-1 { width: 600px; height: 600px; background: ${theme.crema}; top: -200px; right: -100px; }
        .orb-2 { width: 500px; height: 500px; background: #2a1b10; bottom: -100px; left: -100px; }
        @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(50px, 50px) scale(1.1); } }
        .page-badge { background: #1b130e; border: 1px solid ${theme.border}; padding: 12px 25px; border-radius: 18px; display: inline-flex; align-items: center; gap: 12px; margin: 20px 0; }
        .page-badge span { font-family: 'Inter', sans-serif; font-size: 2rem; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
        /* Premium Row Hover Animation */
        .premium-row {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
          cursor: pointer;
        }
        .premium-row:hover {
          background-color: rgba(196, 164, 132, 0.12) !important;
          transform: translateY(-5px) scale(1.005) !important;
          box-shadow: 0 15px 35px rgba(0,0,0,0.4) !important;
          border-color: rgba(196, 164, 132, 0.5) !important;
          position: relative;
          z-index: 10;
        }
        .bar-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; gap: 10px; position: relative; cursor: pointer; }
        .bar-tooltip { position: absolute; top: -30px; background: ${theme.crema}; color: #070504; padding: 5px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 900; opacity: 0; transition: 0.3s; pointer-events: none; z-index: 10; white-space: nowrap; }
        .bar-wrapper:hover .bar-tooltip { opacity: 1; transform: translateY(-10px); }
        .bar-wrapper:hover .bar-fill { filter: brightness(1.2); transform: scaleX(1.05); }
        .bar-fill { transition: all 0.5s cubic-bezier(0.23, 1, 0.32, 1); }
      `}</style>
      <div style={{ 
        position: 'relative',
        zIndex: 1,
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '20px'
      }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.8rem', color: theme.crema, lineHeight: 1 }}>
            Faculty <span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
          </div>

          <div className="page-badge">
            <BarChart3 size={28} color={theme.crema} />
            <span>Business Analytics</span>
          </div>

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
        </div>
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {cards.map((c, i) => (
          <div key={i} className="premium-row" style={{ 
            backgroundColor: theme.card, 
            padding: '25px', 
            borderRadius: '20px', 
            border: `1px solid ${theme.border}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ backgroundColor: `${c.color}15`, color: c.color, padding: '12px', borderRadius: '12px' }}>
                <c.icon size={24} />
              </div>
              <span style={{ color: '#38ef7d', fontSize: '0.75rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpRight size={14} /> {c.desc}
              </span>
            </div>
            <div>
              <p style={{ color: theme.text, opacity: 0.6, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>{c.title}</p>
              <h3 style={{ color: '#fff', fontSize: '1.8rem', margin: '5px 0 0', fontWeight: '800' }}>{c.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div style={{ backgroundColor: theme.card, padding: '35px', borderRadius: '24px', border: `1px solid ${theme.border}`, minHeight: '380px', boxShadow: '0 15px 45px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#fff', marginBottom: '30px', fontFamily: 'serif', fontSize: '1.5rem' }}>Weekly Sales Performance</h3>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '15px', paddingBottom: '10px', height: '240px' }}>
             {weeklyData.length > 0 ? weeklyData.map((d, i) => (
                <div key={i} className="bar-wrapper">
                  <div className="bar-tooltip">£{d.total.toFixed(2)}</div>
                  <div className="bar-fill" style={{ 
                    width: '70%', 
                    maxWidth: '40px',
                    backgroundColor: i === 6 ? theme.crema : 'rgba(196, 164, 132, 0.15)', 
                    height: `${Math.max((d.total / maxWeekly) * 100, 2)}%`, 
                    borderRadius: '8px 8px 4px 4px', 
                    position: 'relative',
                    boxShadow: i === 6 ? `0 0 20px ${theme.crema}44` : 'none'
                  }}>
                  </div>
                  <div style={{ marginTop: '15px', color: theme.text, opacity: 0.5, fontSize: '0.7rem', fontWeight: '800', textAlign: 'center' }}>
                    {d.day}
                    <div style={{ fontSize: '0.55rem', opacity: 0.4 }}>{d.fullDate}</div>
                  </div>
                </div>
             )) : (
               <div style={{ color: '#555', width: '100%', textAlign: 'center' }}>Processing weekly trends...</div>
             )}
          </div>
        </div>

        <div style={{ backgroundColor: theme.card, padding: '35px', borderRadius: '24px', border: `1px solid ${theme.border}`, boxShadow: '0 15px 45px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h3 style={{ color: '#fff', marginBottom: '30px', fontFamily: 'serif', fontSize: '1.5rem', alignSelf: 'flex-start' }}>Category Dominance</h3>
          <div style={{ position: 'relative', width: '180px', height: '180px', marginBottom: '30px' }}>
            <div style={{ 
              width: '100%', height: '100%', borderRadius: '50%', 
              background: `conic-gradient(${theme.crema} ${topCategory.percentage * 3.6}deg, rgba(196, 164, 132, 0.05) 0deg)`,
              display: 'flex', alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: `0 0 30px ${theme.crema}22`,
              transition: 'all 1.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <div style={{ 
                width: '140px', height: '140px', borderRadius: '50%', 
                backgroundColor: theme.card,
                display: 'flex', flexDirection: 'column', alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)'
              }}>
                <span style={{ color: '#fff', fontSize: '2.5rem', fontWeight: '900', lineHeight: '1' }}>{topCategory.percentage}%</span>
                <span style={{ color: theme.crema, fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>Market Share</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', margin: 0, fontFamily: 'serif' }}>{topCategory.name}</p>
            <p style={{ color: theme.text, fontSize: '0.85rem', opacity: 0.6, marginTop: '5px' }}>Highest Selling Category</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
