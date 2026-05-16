import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { TrendingUp, ShoppingBag, DollarSign, ArrowUpRight, BarChart3, Zap, Calendar, Search, X } from 'lucide-react';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const Analytics = () => {
  const now = new Date();
  const [viewMode, setViewMode]       = useState('monthly'); // 'monthly' | 'range' | 'alltime'
  const [selectedYear, setSelectedYear]   = useState(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [rangeFrom, setRangeFrom] = useState('');
  const [rangeTo,   setRangeTo]   = useState('');
  const [stats, setStats]   = useState(null);
  const [allTime, setAllTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weeklyData,   setWeeklyData]   = useState([]);
  const [topCategory,  setTopCategory]  = useState({ name: 'None', percentage: 0 });

  const theme = {
    crema: 'var(--admin-accent)',
    espresso: 'var(--admin-bg)',
    card: 'var(--admin-card)',
    text: 'var(--admin-text)',
    border: 'var(--admin-border)'
  };

  /* ── helpers ─────────────────────────────────────── */
  const formatDate = (d) => {
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}`;
  };

  const processCategoryStats = (rawCats) => {
    if (!Array.isArray(rawCats) || rawCats.length === 0) {
      setTopCategory({ name: 'None', percentage: 0 });
      return;
    }
    const total = rawCats.reduce((acc, c) => acc + (parseInt(c.count)||0), 0);
    const sorted = [...rawCats].sort((a,b) => b.count - a.count);
    const top = sorted[0];
    setTopCategory({ name: top.name, percentage: total > 0 ? Math.round((top.count/total)*100) : 0 });
  };

  const buildWeeklyBars = (rawDaily, daysCount = 7) => {
    const result = [];
    for (let i = daysCount - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const ds = formatDate(date);
      const match = rawDaily.find(s => formatDate(s.date) === ds);
      result.push({
        day: date.toLocaleDateString('en-GB', { weekday: 'short' }).toUpperCase(),
        total: match ? parseFloat(match.total) : 0,
        fullDate: date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
      });
    }
    return result;
  };

  /* ── all-time fetch ─────── */
  const fetchAllTime = useCallback(async () => {
    try {
      const res = await axios.get('/api/dashboard-stats');
      const d = res.data.data || res.data;
      setAllTime(d);
      if (viewMode === 'alltime') processCategoryStats(d.categoryStats);
    } catch(e) { console.error(e); }
  }, [viewMode]);

  /* ── main stats fetch ────────────────────────────── */
  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      let data = null;
      if (viewMode === 'monthly') {
        const res = await axios.get(`/api/analytics-monthly?year=${selectedYear}&month=${selectedMonth}`);
        data = res.data;
      } else if (viewMode === 'range' && rangeFrom && rangeTo) {
        const res = await axios.get(`/api/analytics-range?from=${rangeFrom}&to=${rangeTo}`);
        data = res.data;
      } else if (viewMode === 'alltime') {
        const res = await axios.get('/api/dashboard-stats');
        const d = res.data.data || res.data;
        data = {
          totalOrders: d.totalOrders,
          totalSales:  d.totalSales,
          totalProducts: d.totalProducts,
          avgOrderValue: d.totalOrders > 0 ? d.totalSales / d.totalOrders : 0,
          topProducts: d.topProducts || [],
          dailySales: d.dailySales || [],
          categoryStats: d.categoryStats || []
        };
      }

      if (data) {
        setStats(data);
        processCategoryStats(data.categoryStats);
        if (viewMode === 'alltime') {
            setWeeklyData(buildWeeklyBars(data.dailySales || []));
        } else {
            setWeeklyData(data.dailySales.map(s => ({
                day: new Date(s.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'}),
                total: parseFloat(s.total),
                fullDate: new Date(s.date).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})
              })));
        }
      }
    } catch(e) {
      console.error('Analytics fetch error:', e);
    } finally { setLoading(false); }
  // eslint-disable-next-line
  }, [viewMode, selectedYear, selectedMonth, rangeFrom, rangeTo]);

  useEffect(() => { fetchAllTime(); }, [fetchAllTime]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const maxBar = Math.max(...weeklyData.map(d => d.total), 1);
  const topProducts = stats?.topProducts || [];

  const cards = stats ? [
    { title: 'Total Revenue',    value: `${parseFloat(stats.totalSales||0).toLocaleString('en-GB',{minimumFractionDigits:2,maximumFractionDigits:2})} JOD`, icon: DollarSign, color: '#38ef7d', desc: viewMode==='monthly'?`${MONTH_NAMES[selectedMonth-1]} ${selectedYear}`: viewMode==='range'?`${rangeFrom} → ${rangeTo}`:'All Time' },
    { title: 'Total Orders',     value: stats.totalOrders||0, icon: ShoppingBag, color: '#c4a484', desc: 'Orders Count' },
    { title: 'Avg Order Value',  value: `${parseFloat(stats.avgOrderValue||0).toFixed(2)} JOD`, icon: TrendingUp, color: '#4facfe', desc: 'Per Transaction' },
    { title: 'Active Products',  value: stats.totalProducts || (allTime?.totalProducts||0), icon: BarChart3, color: '#f093fb', desc: 'In Menu' },
    { title: 'Best Selling',     value: topProducts[0]?.item_name || 'N/A', icon: Zap, color: '#ff9a9e', desc: topProducts[0] ? `${topProducts[0].total_sold} sold · ${parseFloat(topProducts[0].revenue||0).toFixed(2)} JOD` : 'No data' },
  ] : [];

  const years = [];
  for (let y = 2024; y <= now.getFullYear(); y++) years.push(y);

  return (
    <div className="dashboard-fade-in" style={{ color: theme.latte, backgroundColor: theme.espresso, minHeight: '100vh', padding: '40px 10px 40px 5px', position: 'relative' }}>
      {/* Background */}
      <div style={{ position: 'fixed', top:0, left:0, right:0, bottom:0, zIndex:0, overflow:'hidden', pointerEvents:'none' }}>
        <div style={{ position:'absolute', top:0, left:0, right:0, bottom:0, background:'radial-gradient(circle at 50% -20%, #2a1b10 0%, #070504 70%)' }} />
        <div className="orb orb-1" /><div className="orb orb-2" />
      </div>
      <style>{`
        .orb { position:absolute; border-radius:50%; filter:blur(100px); z-index:0; opacity:0.05; animation:float 25s infinite alternate ease-in-out; }
        .orb-1 { width:600px; height:600px; background:#c4a484; top:-200px; right:-100px; }
        .orb-2 { width:500px; height:500px; background:#2a1b10; bottom:-100px; left:-100px; }
        @keyframes float { 0%{transform:translate(0,0) scale(1)} 100%{transform:translate(50px,50px) scale(1.1)} }
        .page-badge { background:#1b130e; border:1px solid rgba(196,164,132,0.15); padding:12px 25px; border-radius:18px; display:inline-flex; align-items:center; gap:12px; margin:20px 0; }
        .page-badge span { font-family:'Inter',sans-serif; font-size:2rem; font-weight:900; color:#fff; letter-spacing:-0.5px; }
        .premium-row { transition:all 0.3s cubic-bezier(0.25,0.8,0.25,1)!important; cursor:pointer; }
        .premium-row:hover { background-color:rgba(196,164,132,0.12)!important; transform:translateY(-5px) scale(1.005)!important; box-shadow:0 15px 35px rgba(0,0,0,0.4)!important; border-color:rgba(196,164,132,0.5)!important; position:relative; z-index:10; }
        .bar-wrapper { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%; gap:10px; position:relative; cursor:pointer; }
        .bar-tooltip { position:absolute; top:-30px; background:#c4a484; color:#070504; padding:5px 12px; border-radius:10px; font-size:0.75rem; font-weight:900; opacity:0; transition:0.3s; pointer-events:none; z-index:10; white-space:nowrap; }
        .bar-wrapper:hover .bar-tooltip { opacity:1; transform:translateY(-10px); }
        .bar-wrapper:hover .bar-fill { filter:brightness(1.5); background:#fff !important; box-shadow: 0 0 15px rgba(255,255,255,0.5); }
        .bar-fill { transition:all 0.5s cubic-bezier(0.23,1,0.32,1); }
        .filter-btn { padding:10px 20px; border-radius:12px; border:1px solid rgba(196,164,132,0.3); background:rgba(196,164,132,0.05); color:#c4a484; font-weight:700; font-size:0.85rem; cursor:pointer; transition:0.25s; }
        .filter-btn.active { background:#c4a484; color:#070504; border-color:#c4a484; }
        .filter-btn:hover:not(.active) { background:rgba(196,164,132,0.15); }
        .filter-select { padding:10px 14px; border-radius:10px; border:1px solid rgba(196,164,132,0.3); background:#0d0806; color:#fff; font-weight:600; font-size:0.9rem; cursor:pointer; }
        .filter-date { padding:10px 14px; border-radius:10px; border:1px solid rgba(196,164,132,0.3); background:#0d0806; color:#fff; font-weight:600; font-size:0.9rem; }
        .filter-date::-webkit-calendar-picker-indicator { filter:invert(1); }
      `}</style>

      {/* Header */}
      <div style={{ position:'relative', zIndex:1, marginBottom:'20px' }}>
        <div style={{ fontFamily:"'DM Serif Display',serif", fontSize:'2.8rem', color:'#c4a484', lineHeight:1 }}>
          CaffAIne <span style={{ color:'#fff', fontStyle:'italic' }}>Coffee.</span>
        </div>
        <div className="page-badge">
          <BarChart3 size={28} color="#c4a484" />
          <span>Business Analytics</span>
        </div>

        {/* Today quick stats */}
        {allTime && (
          <div style={{ display:'flex', gap:'15px', marginTop:'15px', flexWrap:'wrap' }}>
            <div style={{ background:'rgba(56,239,125,0.05)', border:'1px solid rgba(56,239,125,0.15)', padding:'10px 20px', borderRadius:'14px' }}>
              <div style={{ fontSize:'0.6rem', color:'#38ef7d', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'1px' }}>Today's Revenue</div>
              <div style={{ fontSize:'1.2rem', color:'#fff', fontWeight:'900' }}>{parseFloat(allTime.todaySales||0).toFixed(2)} JOD</div>
            </div>
            <div style={{ background:'rgba(79,172,254,0.05)', border:'1px solid rgba(79,172,254,0.15)', padding:'10px 20px', borderRadius:'14px' }}>
              <div style={{ fontSize:'0.6rem', color:'#4facfe', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'1px' }}>Today's Orders</div>
              <div style={{ fontSize:'1.2rem', color:'#fff', fontWeight:'900' }}>{allTime.todayOrders||0}</div>
            </div>
          </div>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <div style={{ position:'relative', zIndex:1, background:'rgba(255,255,255,0.02)', border:'1px solid rgba(196,164,132,0.12)', borderRadius:'20px', padding:'20px 25px', marginBottom:'25px', display:'flex', flexWrap:'wrap', gap:'15px', alignItems:'center' }}>
        <Calendar size={20} color="#c4a484" />
        <span style={{ color:'rgba(255,255,255,0.5)', fontWeight:'700', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'1px' }}>View By:</span>

        <button className={`filter-btn${viewMode==='monthly'?' active':''}`} onClick={() => setViewMode('monthly')}>Monthly</button>
        <button className={`filter-btn${viewMode==='range'?' active':''}`}   onClick={() => setViewMode('range')}>Date Range</button>
        <button className={`filter-btn${viewMode==='alltime'?' active':''}`} onClick={() => setViewMode('alltime')}>All Time</button>

        {viewMode === 'monthly' && (
          <>
            <select className="filter-select" value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="filter-select" value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}>
              {MONTH_NAMES.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </>
        )}

        {viewMode === 'range' && (
          <>
            <input type="date" className="filter-date" value={rangeFrom} onChange={e => setRangeFrom(e.target.value)} />
            <span style={{ color:'#c4a484', fontWeight:'700' }}>→</span>
            <input type="date" className="filter-date" value={rangeTo}   onChange={e => setRangeTo(e.target.value)}   />
            {rangeFrom && rangeTo && (
              <button className="filter-btn active" style={{ display:'flex', alignItems:'center', gap:'6px' }} onClick={fetchStats}>
                <Search size={14} /> Apply
              </button>
            )}
            {(rangeFrom || rangeTo) && (
              <button className="filter-btn" style={{ display:'flex', alignItems:'center', gap:'6px' }} onClick={() => { setRangeFrom(''); setRangeTo(''); }}>
                <X size={14} /> Clear
              </button>
            )}
          </>
        )}
      </div>

      {loading ? (
        <div style={{ color:'#c4a484', padding:'80px', textAlign:'center', position:'relative', zIndex:1, fontSize:'1.1rem', fontWeight:'700' }}>
          Loading Analytics...
        </div>
      ) : (
        <>
          {/* ── 5 Stat Cards ── */}
          <div style={{ position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(220px, 1fr))', gap:'20px', marginBottom:'30px' }}>
            {cards.map((c, i) => (
              <div key={i} className="premium-row" style={{ backgroundColor: theme.card, padding:'25px', borderRadius:'20px', border:`1px solid ${theme.border}`, display:'flex', flexDirection:'column', gap:'15px', boxShadow:'0 10px 30px rgba(0,0,0,0.2)' }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ backgroundColor:`${c.color}15`, color:c.color, padding:'12px', borderRadius:'12px' }}>
                    <c.icon size={24} />
                  </div>
                  <span style={{ color:'#38ef7d', fontSize:'0.75rem', fontWeight:'bold', display:'flex', alignItems:'center', gap:'4px' }}>
                    <ArrowUpRight size={14} /> {c.desc}
                  </span>
                </div>
                <div>
                  <p style={{ color: theme.text, opacity:0.6, fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'1px', margin:0 }}>{c.title}</p>
                  <h3 style={{ color:'#fff', fontSize:'1.7rem', margin:'5px 0 0', fontWeight:'800', wordBreak:'break-word' }}>{c.value}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* ── Bar Chart + Category Dominance ── */}
          <div style={{ position:'relative', zIndex:1, display:'grid', gridTemplateColumns:'2fr 1fr', gap:'30px', marginBottom:'30px' }}>
            <div style={{ backgroundColor: theme.card, padding:'35px', borderRadius:'24px', border:`1px solid ${theme.border}`, minHeight:'380px', boxShadow:'0 15px 45px rgba(0,0,0,0.3)', display:'flex', flexDirection:'column' }}>
              <h3 style={{ color:'#fff', marginBottom:'30px', fontFamily:'serif', fontSize:'1.5rem' }}>
                {viewMode === 'monthly' ? `Daily Sales — ${MONTH_NAMES[selectedMonth-1]} ${selectedYear}` : viewMode === 'range' ? `Sales: ${rangeFrom} → ${rangeTo}` : 'Last 7 Days Sales'}
              </h3>
              <div style={{ flex:1, display:'flex', alignItems:'flex-end', gap:'8px', paddingBottom:'10px', height:'240px', overflowX:'auto' }}>
                {weeklyData.length > 0 ? weeklyData.map((d, i) => (
                  <div key={i} className="bar-wrapper" style={{ minWidth:'40px' }}>
                    <div className="bar-tooltip">{d.total.toFixed(2)} JOD</div>
                    <div className="bar-fill" style={{ width:'100%', maxWidth:'40px', backgroundColor: i === weeklyData.length-1 ? '#c4a484' : 'rgba(196,164,132,0.15)', height:`${Math.max((d.total/maxBar)*100,2)}%`, borderRadius:'8px 8px 4px 4px', boxShadow: i === weeklyData.length-1 ? '0 0 20px #c4a48444':'' }} />
                    <div style={{ color: theme.text, opacity:0.5, fontSize:'0.6rem', fontWeight:'800', textAlign:'center', marginTop:'8px' }}>
                      {d.day}<div style={{ fontSize:'0.55rem', opacity:0.4 }}>{d.fullDate}</div>
                    </div>
                  </div>
                )) : (
                  <div style={{ color:'#555', width:'100%', textAlign:'center' }}>No sales data for this period.</div>
                )}
              </div>
            </div>

            <div style={{ backgroundColor: theme.card, padding:'35px', borderRadius:'24px', border:`1px solid ${theme.border}`, boxShadow:'0 15px 45px rgba(0,0,0,0.3)', display:'flex', flexDirection:'column', alignItems:'center' }}>
              <h3 style={{ color:'#fff', marginBottom:'30px', fontFamily:'serif', fontSize:'1.5rem', alignSelf:'flex-start' }}>Category Dominance</h3>
              <div style={{ position:'relative', width:'180px', height:'180px', marginBottom:'30px' }}>
                <div style={{ width:'100%', height:'100%', borderRadius:'50%', background:`conic-gradient(#c4a484 ${topCategory.percentage*3.6}deg, rgba(196,164,132,0.05) 0deg)`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 30px #c4a48422', transition:'all 1.5s cubic-bezier(0.4,0,0.2,1)' }}>
                  <div style={{ width:'140px', height:'140px', borderRadius:'50%', backgroundColor: theme.card, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', boxShadow:'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                    <span style={{ color:'#fff', fontSize:'2.5rem', fontWeight:'900', lineHeight:'1' }}>{topCategory.percentage}%</span>
                    <span style={{ color:'#c4a484', fontSize:'0.65rem', fontWeight:'bold', textTransform:'uppercase', letterSpacing:'1px', marginTop:'5px' }}>Market Share</span>
                  </div>
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <p style={{ color:'#fff', fontSize:'1.2rem', fontWeight:'bold', margin:0, fontFamily:'serif' }}>{topCategory.name}</p>
                <p style={{ color: theme.text, fontSize:'0.85rem', opacity:0.6, marginTop:'5px' }}>Highest Selling Category</p>
              </div>
            </div>
          </div>

          {/* ── Top Selling Products ── */}
          <div style={{ position:'relative', zIndex:1 }}>
            <div style={{ backgroundColor: theme.card, padding:'35px', borderRadius:'24px', border:`1px solid ${theme.border}`, boxShadow:'0 15px 45px rgba(0,0,0,0.3)' }}>
              <h3 style={{ color:'#fff', marginBottom:'5px', fontFamily:'serif', fontSize:'1.5rem' }}>
                Top Selling Products
              </h3>
              <p style={{ color:'rgba(255,255,255,0.35)', fontSize:'0.8rem', marginBottom:'25px', fontWeight:'600' }}>
                {viewMode==='monthly' ? `${MONTH_NAMES[selectedMonth-1]} ${selectedYear}` : viewMode==='range' ? `${rangeFrom} → ${rangeTo}` : 'All Time'}
              </p>
              {topProducts.length === 0 ? (
                <div style={{ textAlign:'center', color:'#555', padding:'40px', fontSize:'1rem' }}>No sales data for this period.</div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(290px, 1fr))', gap:'20px' }}>
                  {topProducts.map((p, i) => (
                    <div key={i} className="premium-row" style={{ background:'rgba(255,255,255,0.02)', padding:'20px', borderRadius:'16px', border:`1px solid ${theme.border}`, display:'flex', alignItems:'center', gap:'15px' }}>
                      <div style={{ width:'42px', height:'42px', borderRadius:'50%', background: i===0 ? 'linear-gradient(135deg,#FFD700,#B8860B)' : i===1 ? 'linear-gradient(135deg,#C0C0C0,#888)' : i===2 ? 'linear-gradient(135deg,#CD7F32,#8B4513)' : 'rgba(196,164,132,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', fontWeight:'bold', color: i<3 ? '#000' : '#c4a484', flexShrink:0 }}>
                        {i+1}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ color:'#fff', fontWeight:'bold', fontSize:'1rem', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.item_name}</div>
                        <div style={{ display:'flex', gap:'12px', marginTop:'6px', flexWrap:'wrap' }}>
                          <span style={{ background:'rgba(56,239,125,0.1)', color:'#38ef7d', padding:'3px 10px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:'700' }}>
                            {parseFloat(p.total_sold||0).toFixed(0)} Sold
                          </span>
                          <span style={{ background:'rgba(196,164,132,0.1)', color:'#c4a484', padding:'3px 10px', borderRadius:'20px', fontSize:'0.78rem', fontWeight:'700' }}>
                            {parseFloat(p.revenue||0).toFixed(2)} JOD Revenue
                          </span>
                        </div>
                      </div>
                      <div style={{ color:'#c4a484', opacity:0.25, fontWeight:'900', fontSize:'1.1rem', flexShrink:0 }}>#{i+1}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
