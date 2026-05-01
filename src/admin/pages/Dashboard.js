import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { ShoppingBag, LayoutGrid, DollarSign, AlertTriangle, Bell, Volume2 } from 'lucide-react';
import styles from './Dashboard.module.css';

const Dashboard = () => {
  const [stats, setStats] = useState({ 
    totalProducts: 0, 
    totalOrders: 0, 
    totalSales: 0, 
    lowStock: 0,
    lowStockItems: []
  });

  const colors = {
    espresso: 'var(--admin-bg)',
    bean: 'var(--admin-card)',
    crema: 'var(--admin-accent)',
    border: 'var(--admin-border)'
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('/api/dashboard-stats');
        const incomingData = response.data.data || response.data;

        const newLowStockCount = incomingData.lowStock || 0;


        setStats({
          totalProducts: incomingData.totalProducts || 0,
          totalOrders: incomingData.totalOrders || 0,
          totalSales: parseFloat(incomingData.totalSales || 0),
          lowStock: newLowStockCount,
          lowStockItems: incomingData.lowStockItems || []
        });
      } catch (err) {
        console.error("Dashboard API Error:", err.message);
      }
    };
    fetchDashboardData();
    
    // Refresh every minute to check stock
    const interval = setInterval(fetchDashboardData, 60000);
    return () => clearInterval(interval);
  }, []);

  const cards = [
    { title: 'Total Products', value: stats.totalProducts, icon: ShoppingBag, color: colors.crema },
    { title: 'Total Orders', value: stats.totalOrders, icon: LayoutGrid, color: '#8d6e63' },
    { title: 'Total Revenue', value: `£${stats.totalSales.toFixed(2)}`, icon: DollarSign, color: '#d4af37' },
    { title: 'Stock Alerts', value: stats.lowStock, icon: AlertTriangle, color: '#e74a3b' },
  ];

  return (
    <div className={styles.page} style={{ backgroundColor: colors.espresso, minHeight: '100vh' }}>
      <div className={styles.header} style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ 
            fontFamily: "'DM Serif Display', serif", 
            fontSize: '2.5rem', 
            color: colors.crema, 
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '10px'
          }}>
            Faculty<span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
          </div>
          <h2 className={styles.title} style={{ fontSize: '1.2rem', color: '#888', fontWeight: '500', letterSpacing: '2px', margin: 0, textTransform: 'uppercase' }}>
            Admin Management
          </h2>
          <p className={styles.sub} style={{ color: colors.crema, fontSize: '0.95rem', marginTop: '8px', opacity: 0.9 }}>
            Faculty Coffee Management | Graduation Project 2026
          </p>
        </div>
      </div>



      {/* Low Stock Alert Banner */}
      {stats.lowStock > 0 && (
        <div style={{ 
          backgroundColor: 'rgba(231, 74, 59, 0.1)', 
          border: '1px solid rgba(231, 74, 59, 0.3)', 
          borderRadius: '15px', 
          padding: '15px 25px', 
          marginBottom: '30px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          color: '#e74a3b',
          animation: 'dashboardPulse 2s infinite'
        }}>
          <div style={{ 
            backgroundColor: '#e74a3b', 
            color: '#fff', 
            width: '40px', 
            height: '40px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Bell className="animate-bounce" size={20} />
          </div>
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '5px' }}>Stock Warning: {stats.lowStock} items are low!</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {stats.lowStockItems.map((item, idx) => (
                <span key={idx} style={{ 
                  backgroundColor: 'rgba(231, 74, 59, 0.2)', 
                  padding: '4px 10px', 
                  borderRadius: '6px', 
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  border: '1px solid rgba(231, 74, 59, 0.3)'
                }}>
                  {item.item_name} ({item.quantity})
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className={styles.statsRow} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
        {cards.map((c, i) => (
          <div key={i} className={styles.statCard} style={{ 
            padding: '25px', 
            backgroundColor: colors.bean, 
            borderRadius: '20px', 
            border: `1px solid ${colors.border}`,
            boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
          }}>
            <div className={styles.statIcon} style={{ 
              backgroundColor: `${c.color}15`, 
              color: c.color, 
              marginBottom: '15px', 
              width: '45px', 
              height: '45px', 
              borderRadius: '12px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <c.icon size={24} />
            </div>
            <div>
              <p className={styles.statLabel} style={{ fontSize: '0.75rem', color: colors.crema, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                {c.title}
              </p>
              <p className={stats.value} style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fff', margin: 0 }}>
                {c.value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.twoCol} style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
        <div className={styles.chartCard} style={{ padding: '25px', backgroundColor: colors.bean, borderRadius: '20px', border: `1px solid ${colors.border}` }}>
          <h3 className={styles.cardTitle} style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '20px', fontWeight: '700' }}>
            Weekly Sales Trends
          </h3>
          <div style={{ height: '180px', display: 'flex', alignItems: 'flex-end', gap: '12px', padding: '10px' }}>
            {[35, 60, 45, 80, 55, 90, 75].map((h, i) => (
              <div key={i} style={{ 
                flex: 1, 
                backgroundColor: i === 5 ? colors.crema : 'rgba(196, 164, 132, 0.2)', 
                height: `${h}%`, 
                borderRadius: '6px',
                position: 'relative',
                transition: '0.3s'
              }}>
                <div style={{ position: 'absolute', top: '-25px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.65rem', color: colors.crema, opacity: i === 5 ? 1 : 0 }}>
                  £{h * 2}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', color: '#555', fontSize: '0.65rem', fontWeight: 'bold' }}>
            <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
          </div>
        </div>

        <div className={styles.trendsCard} style={{ padding: '25px', backgroundColor: colors.bean, borderRadius: '20px', border: `1px solid ${colors.border}` }}>
          <h3 className={styles.cardTitle} style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '20px', fontWeight: '700' }}>
            AI Insights
          </h3>
          <p className={styles.aiSummary} style={{ fontSize: '0.9rem', color: '#888', marginBottom: '20px' }}>
            Operational data analysis:
          </p>
          <div className={styles.aiHighlight} style={{ 
            color: colors.crema, 
            fontSize: '0.95rem', 
            lineHeight: '1.8', 
            backgroundColor: '#120a05', 
            padding: '20px', 
            borderRadius: '15px',
            borderLeft: `4px solid ${colors.crema}`
          }}>
            <strong style={{ color: '#fff' }}>Peak Performance:</strong> 10:00 AM - 12:00 PM<br/>
            <strong style={{ color: '#fff' }}>Trending:</strong> Latte demand increased by 15% this week.
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes dashboardPulse {
          0% { box-shadow: 0 0 0 0 rgba(231, 74, 59, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(231, 74, 59, 0); }
          100% { box-shadow: 0 0 0 0 rgba(231, 74, 59, 0); }
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-15%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;