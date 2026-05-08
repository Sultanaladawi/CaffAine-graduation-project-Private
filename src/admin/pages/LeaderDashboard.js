import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, AlertTriangle, ShieldAlert, User, Clock, Search, Filter, Download } from 'lucide-react';
import { useAdminContext } from '../AdminContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const LeaderDashboard = () => {
  const { admin } = useAdminContext();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [hoveredRow, setHoveredRow] = useState(null);

  const colors = {
    espresso: 'var(--admin-bg)',
    bean: 'var(--admin-card)',
    crema: 'var(--admin-accent)',
    latte: 'var(--admin-text)',
    border: 'var(--admin-border)',
    input: '#2D2926',
    gold: 'var(--admin-accent)'
  };

  useEffect(() => {
    if (admin && admin.role !== 'super_admin') {
      navigate('/admin/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [logsRes, reviewsRes, msgRes] = await Promise.all([
          axios.get('/api/admin/logs'),
          axios.get('/api/reviews'),
          axios.get('/api/contact-messages')
        ]);
        setLogs(logsRes.data);
        setFeedbacks(reviewsRes.data);
        setMessages(msgRes.data);
      } catch (err) {
        console.error('Failed to fetch leader data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
  }, [admin, navigate]);

  // Combine and filter bad feedback (1 or 2 stars) and angry messages
  const criticalFeedbacks = [
    ...(feedbacks || []).map(f => ({ ...f, type: `Product Review`, comment: f.comment, reviewer_name: f.reviewer_name, rating: f.rating, created_at: f.created_at })),
    ...(messages || []).map(m => ({ ...m, type: 'Contact Form', comment: m.message, reviewer_name: m.name, rating: 1, created_at: m.created_at }))
  ].filter(f => {
    if (f.type === 'Product Review') return f.rating <= 3; // 3 stars or below
    const badWords = ['bad', 'terrible', 'worst', 'awful', 'angry', 'complaint', 'ruined', 'disgusting', 'sick'];
    return badWords.some(word => f.comment?.toLowerCase().includes(word));
  }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const filteredLogs = logs.filter(log => 
    log.admin_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const exportPDF = async () => {
    try {
      if (logs.length === 0) {
        alert("No activity logs available to export.");
        return;
      }

      // Log the export action
      await axios.post('/api/admin/log', { 
        action: 'EXPORT PDF', 
        details: 'Administrator exported the Team Activity Audit log to PDF.' 
      });
      
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.setTextColor(45, 41, 38);
      doc.text('Faculty Coffee - Team Activity Audit', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 32);
      doc.text('Complete synchronization and transaction audit history.', 14, 38);
      
      const tableColumn = ["Timestamp", "Administrator", "Action", "Details"];
      const tableRows = filteredLogs.map(log => [
        formatDate(log.created_at),
        log.admin_name || 'System',
        log.action,
        log.details
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { 
          fillColor: [196, 164, 132], 
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 8,
          cellPadding: 3,
          font: 'helvetica'
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        }
      });

      const today = new Date().toISOString().split('T')[0];
      doc.save(`FacultyCoffee_AuditLog_${today}.pdf`);
    } catch (error) {
      alert("Error generating PDF: " + error.message);
    }
  };

  if (loading) {
    return <div style={{ color: colors.latte, textAlign: 'center', marginTop: '100px', fontWeight: 'bold', letterSpacing: '2px' }}>PREPARING LEADERSHIP INTEL...</div>;
  }

  const headerTextStyle = { color: colors.latte, fontSize: '2.2rem', fontFamily: "'DM Serif Display', serif", fontWeight: 700 };
  const headerBoxStyle = { display: 'inline-block', padding: '10px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' };

  return (
    <div style={{ paddingBottom: '80px', maxWidth: '1500px', margin: '0 auto' }}>
      {/* Header Section - Replicating the exact style from the screenshot */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.8rem', color: colors.crema, lineHeight: 1, marginBottom: '20px' }}>
            Faculty <span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
          </div>

          <div style={{ 
            background: 'rgba(196, 164, 132, 0.05)', 
            border: '1px solid rgba(196, 164, 132, 0.2)', 
            padding: '12px 25px', 
            borderRadius: '18px', 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '15px',
            marginBottom: '20px'
          }}>
            <ShieldAlert size={28} color={colors.crema} />
            <span style={{ 
              fontFamily: "'Inter', sans-serif", 
              fontSize: '1.8rem', 
              fontWeight: '900', 
              color: '#fff', 
              letterSpacing: '-0.5px' 
            }}>
              Leader Dashboard
            </span>
          </div>

          <p style={{ margin: '5px 0 0 5px', color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', fontWeight: '500' }}>
            Faculty Coffee | <span style={{ color: 'rgba(255,255,255,0.3)' }}>Audit Logs & Critical Performance Oversight</span>
          </p>
        </div>

        <button 
          onClick={exportPDF}
          style={{
            backgroundColor: colors.crema, 
            color: '#111', 
            border: 'none', 
            padding: '14px 28px', 
            borderRadius: '14px', 
            fontWeight: '900', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px', 
            cursor: 'pointer',
            transition: '0.3s', 
            boxShadow: '0 10px 20px rgba(196, 164, 132, 0.2)',
            marginTop: '10px'
          }}
          onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
          onMouseLeave={e => e.currentTarget.style.transform = 'none'}
        >
          <Download size={20} /> Export Audit PDF
        </button>
      </div>

      {/* Critical Feedback Section */}
      {criticalFeedbacks.length > 0 && (
        <div style={{ marginBottom: '50px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
             <div style={{ width: '8px', height: '30px', backgroundColor: '#ff4d4d', borderRadius: '4px' }}></div>
             <h3 style={{
               color: '#fff', fontSize: '1.4rem', fontFamily: "'DM Serif Display', serif", margin: 0,
               display: 'flex', alignItems: 'center', gap: '10px'
             }}>
               <AlertTriangle size={24} color="#ff4d4d" /> Critical Feedback & Complaints
             </h3>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '25px' }}>
            {criticalFeedbacks.slice(0, 6).map((item, idx) => (
              <div key={idx} style={{
                background: 'linear-gradient(135deg, rgba(255, 77, 77, 0.08) 0%, rgba(20, 18, 16, 0.5) 100%)',
                border: '1px solid rgba(255, 77, 77, 0.2)',
                padding: '25px', borderRadius: '20px',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                transition: '0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.5)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'rgba(255, 77, 77, 0.2)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.1rem' }}>{item.reviewer_name || 'Anonymous'}</span>
                  <span style={{ color: '#ff4d4d', fontWeight: '900', fontSize: '1rem' }}>{item.rating} ⭐</span>
                </div>
                <div style={{ color: colors.crema, fontSize: '0.75rem', marginBottom: '12px', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '1px' }}>
                  {item.type}
                </div>
                <p style={{ color: '#bbb', fontSize: '0.95rem', margin: 0, fontStyle: 'italic', lineHeight: '1.6' }}>
                  "{item.comment || 'No comment provided'}"
                </p>
                <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.75rem', color: '#666', textAlign: 'right' }}>
                  {formatDate(item.created_at)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Activity Section */}
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.01)',
        borderRadius: '32px',
        border: `1px solid rgba(255, 255, 255, 0.08)`,
        padding: '20px',
        boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
        zIndex: 1,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px', padding: '15px' }}>
          <h3 style={{ margin: 0, color: colors.latte, fontSize: '1.6rem', fontFamily: "'DM Serif Display', serif", display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Activity size={24} color={colors.crema} /> Team Activity Log
          </h3>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '15px', 
            backgroundColor: colors.input, padding: '12px 25px', 
            borderRadius: '16px', border: `1px solid rgba(196, 164, 132, 0.15)`,
            transition: '0.3s'
          }}>
            <Search size={20} color="#666" />
            <input
              type="text"
              placeholder="Search team activity..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'none', border: 'none', color: '#fff', outline: 'none', width: '300px', fontSize: '0.95rem' }}
            />
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: colors.latte, textAlign: 'left', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(45, 41, 38, 0.8)' }}>
                <th style={{ padding: '25px', width: '18%', color: colors.crema, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} /> Timestamp</div>
                </th>
                <th style={{ padding: '25px', width: '22%', color: colors.crema, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><User size={16} /> Administrator</div>
                </th>
                <th style={{ padding: '25px', width: '25%', color: colors.crema, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Activity size={16} /> Operation</div>
                </th>
                <th style={{ padding: '25px', width: '35%', color: colors.crema, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: '700' }}>Transaction Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length > 0 ? (
                filteredLogs.map(log => (
                  <tr 
                    key={log.id} 
                    className="premium-row"
                    onMouseEnter={() => setHoveredRow(log.id)}
                    onMouseLeave={() => setHoveredRow(null)}
                    style={{ 
                      borderBottom: `1px solid ${colors.border}`, 
                      transition: '0.3s cubic-bezier(0.25, 0.8, 0.25, 1)', 
                      cursor: 'default',
                      position: 'relative'
                    }}
                  >
                    <td style={{ 
                      padding: '25px', 
                      color: hoveredRow === log.id ? colors.crema : '#888', 
                      fontSize: '0.85rem', fontWeight: '600',
                      transition: '0.3s'
                    }}>
                      {formatDate(log.created_at)}
                    </td>
                    <td style={{ padding: '25px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <div style={{ 
                          width: '40px', height: '40px', borderRadius: '12px', 
                          background: 'linear-gradient(135deg, var(--admin-accent), #8a6c4f)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#111',
                          fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 5px 15px rgba(0,0,0,0.4)'
                        }}>
                          {log.admin_name ? log.admin_name.charAt(0).toUpperCase() : 'A'}
                        </div>
                        <div>
                          <div style={{ color: '#fff', fontWeight: '700', fontSize: '1rem' }}>{log.admin_name || 'System Admin'}</div>
                          <div style={{ color: '#666', fontSize: '0.75rem', marginTop: '2px' }}>{log.admin_email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '25px' }}>
                      <span style={{ 
                        backgroundColor: 'rgba(196, 164, 132, 0.1)', 
                        border: `1px solid ${hoveredRow === log.id ? colors.crema : 'rgba(196, 164, 132, 0.2)'}`,
                        color: colors.crema, 
                        padding: '8px 16px', borderRadius: '10px', 
                        fontSize: '0.75rem', fontWeight: '800', letterSpacing: '0.5px', 
                        textTransform: 'uppercase', transition: '0.3s',
                        whiteSpace: 'nowrap',
                        display: 'inline-block'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td style={{ 
                      padding: '25px', 
                      color: hoveredRow === log.id ? '#fff' : '#aaa', 
                      fontSize: '0.95rem', lineHeight: '1.5',
                      transition: '0.3s'
                    }}>
                      {log.details}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ padding: '60px', textAlign: 'center', color: '#555', fontSize: '1.1rem', fontStyle: 'italic' }}>
                    No synchronization logs identified.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <style>{`
        .premium-row {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
        }
        .premium-row:hover {
          background-color: rgba(196, 164, 132, 0.08) !important;
          transform: translateY(-2px) scale(1.002);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          position: relative;
          z-index: 10;
        }
        .premium-row:hover td {
          border-bottom-color: transparent !important;
        }
      `}</style>
    </div>
  );
};

export default LeaderDashboard;
