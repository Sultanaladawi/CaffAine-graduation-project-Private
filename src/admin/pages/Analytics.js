import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, ShoppingBag, DollarSign, ArrowUpRight, BarChart3 } from 'lucide-react';
import styles from './Dashboard.module.css';

const Analytics = () => {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
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
        
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          // Find matching date in raw data
          const match = rawDaily.find(s => {
            if (!s.date) return false;
            const sDateStr = new Date(s.date).toISOString().split('T')[0];
            return sDateStr === dateStr;
          });

          last7Days.push({
            day: date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
            total: match ? parseFloat(match.total) : 0
          });
        }
        setWeeklyData(last7Days);

        // Process Category Data
        const rawCats = Array.isArray(d.categoryStats) ? d.categoryStats : [];
        if (rawCats.length > 0) {
          const totalOrders = rawCats.reduce((acc, curr) => acc + (parseInt(curr.count) || 0), 0);
          const topCat = [...rawCats].sort((a,b) => b.count - a.count)[0];
          setTopCategory({
            name: topCat.name,
            percentage: totalOrders > 0 ? Math.round((topCat.count / totalOrders) * 100) : 0
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
    <div className={styles.page} style={{ backgroundColor: theme.espresso, minHeight: '100vh', padding: '20px' }}>
      <div style={{ marginBottom: '40px' }}>
        <div style={{ 
          fontFamily: "'DM Serif Display', serif", 
          fontSize: '1.8rem', 
          color: theme.crema, 
          lineHeight: '1',
          display: 'flex',
          alignItems: 'center',
          gap: '5px',
          marginBottom: '15px'
        }}>
          Faculty<span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
        </div>
        <h2 style={{ color: '#fff', fontSize: '2.5rem', fontFamily: 'serif', margin: 0 }}>Business Analytics</h2>
        <p style={{ color: theme.crema, opacity: 0.8 }}>Live performance tracking powered by actual sales data.</p>
      </div>

      <div className={styles.statsRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
        {cards.map((c, i) => (
          <div key={i} style={{ 
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

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        <div style={{ backgroundColor: theme.card, padding: '35px', borderRadius: '24px', border: `1px solid ${theme.border}`, minHeight: '380px', boxShadow: '0 15px 45px rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ color: '#fff', marginBottom: '30px', fontFamily: 'serif', fontSize: '1.5rem' }}>Weekly Sales Performance</h3>
          
          <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', gap: '15px', paddingBottom: '10px', height: '240px' }}>
             {weeklyData.length > 0 ? weeklyData.map((d, i) => (
                <div key={i} style={{ 
                  flex: 1, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'flex-end',
                  height: '100%'
                }}>
                  <div style={{ 
                    width: '70%', 
                    maxWidth: '40px',
                    backgroundColor: i === 6 ? theme.crema : 'rgba(196, 164, 132, 0.15)', 
                    height: `${Math.max((d.total / maxWeekly) * 100, 2)}%`, 
                    borderRadius: '8px 8px 4px 4px', 
                    transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    position: 'relative',
                    boxShadow: i === 6 ? `0 0 20px ${theme.crema}44` : 'none'
                  }}>
                    {d.total > 0 && (
                      <div style={{ 
                        position: 'absolute', 
                        top: '-30px', 
                        left: '50%', 
                        transform: 'translateX(-50%)', 
                        color: theme.crema, 
                        fontSize: '0.75rem', 
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                      }}>
                        £{Math.round(d.total)}
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '15px', color: theme.text, opacity: 0.5, fontSize: '0.7rem', fontWeight: '800' }}>
                    {d.day}
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
