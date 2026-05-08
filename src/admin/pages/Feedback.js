import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { MessageSquare, Star, Coffee, Store, Clock, Download, CheckCircle2, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Feedback = () => {
  const [data, setData] = useState({ general: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');
  const [notification, setNotification] = useState(null);

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const exportPDF = async () => {
    try {
      const currentList = activeTab === 'general' ? data.general : data.products;
      if (currentList.length === 0) {
        alert("No feedback available in this category to export.");
        return;
      }

      // Log the export action
      await axios.post('/api/admin/log', { 
        action: 'EXPORT PDF', 
        details: `Administrator exported Customer Feedback & Reviews (${activeTab}) to PDF.` 
      });
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(45, 41, 38);
      const title = activeTab === 'general' ? 'General Store Feedback' : 'Product Reviews';
      doc.text(`Faculty Coffee - ${title}`, 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 32);
      doc.text(`A complete record of customer ratings and comments for ${activeTab}.`, 14, 38);
      
      // Table
      let tableColumn, tableRows;
      if (activeTab === 'general') {
        tableColumn = ["Date", "Customer Name", "Rating", "Comment"];
        tableRows = data.general.map(f => [
          new Date(f.created_at).toLocaleDateString('en-GB'),
          f.reviewer_name || 'Anonymous',
          `${f.rating}/5`,
          f.comment || ''
        ]);
      } else {
        tableColumn = ["Date", "Product", "Reviewer", "Rating", "Comment"];
        tableRows = data.products.map(f => [
          new Date(f.created_at).toLocaleDateString('en-GB'),
          f.product_name || 'N/A',
          f.reviewer_name || 'Anonymous',
          `${f.rating}/5`,
          f.comment || ''
        ]);
      }

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
          fontSize: 9,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        }
      });

      doc.save(`Faculty_Coffee_Feedback_${activeTab}_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Error generating PDF: " + error.message);
    }
  };

  const colors = {
    espresso: 'var(--admin-bg)',
    bean: 'var(--admin-card)',
    crema: 'var(--admin-accent)',
    border: 'var(--admin-border)',
    text: '#ffffff',
    muted: '#aaaaaa'
  };

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/feedback');
        setData(res.data);
      } catch (err) {
        console.error("Fetch feedback error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeedback();
  }, []);

  const renderStars = (rating) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map(star => (
          <Star 
            key={star} 
            size={16} 
            fill={star <= rating ? '#FFD700' : 'transparent'} 
            color={star <= rating ? '#FFD700' : colors.muted} 
          />
        ))}
      </div>
    );
  };

  const TabButton = ({ id, icon: Icon, label }) => (
    <button
      onClick={() => setActiveTab(id)}
      style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '15px 30px', border: 'none', borderRadius: '15px',
        backgroundColor: activeTab === id ? colors.crema : 'transparent',
        color: activeTab === id ? colors.espresso : colors.text,
        fontWeight: 'bold', fontSize: '1rem', cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: activeTab !== id ? `1px solid ${colors.border}` : '1px solid transparent'
      }}
    >
      <Icon size={20} /> {label}
    </button>
  );

  return (
    <div className="dashboard-fade-in" style={{ 
      color: colors.latte, 
      backgroundColor: colors.espresso, 
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
        .orb-1 { width: 600px; height: 600px; background: ${colors.crema}; top: -200px; right: -100px; }
        .orb-2 { width: 500px; height: 500px; background: #2a1b10; bottom: -100px; left: -100px; }
        @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(50px, 50px) scale(1.1); } }
        .page-badge { background: #1b130e; border: 1px solid ${colors.border}; padding: 12px 25px; border-radius: 18px; display: inline-flex; align-items: center; gap: 12px; margin: 20px 0; }
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
      `}</style>
      {/* Elegant Notification Toast */}
      {notification && (
        <div className={`premium-toast ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
          {notification.message}
        </div>
      )}

      <div style={{ 
        position: 'relative',
        zIndex: 1,
        width: '100%', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        marginBottom: '40px'
      }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.8rem', color: colors.crema, lineHeight: 1 }}>
            Faculty <span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
          </div>

          <div className="page-badge">
            <MessageSquare size={28} color={colors.crema} />
            <span>Feedback & Reviews</span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 500, marginTop: '5px' }}>
            Faculty Coffee | Monitoring Customer Satisfaction & Product Ratings
          </p>
          <button 
            onClick={exportPDF}
            style={{ 
              marginTop: '20px',
              backgroundColor: 'rgba(196, 164, 132, 0.1)', 
              color: colors.crema, 
              border: `1px solid ${colors.crema}`, 
              padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', 
              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              transition: '0.3s'
            }}>
            <Download size={18} /> Export {activeTab === 'general' ? 'General' : 'Product'} PDF
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '15px' }}>
          <TabButton id="general" icon={Store} label="Store Feedback" />
          <TabButton id="products" icon={Coffee} label="Product Reviews" />
        </div>
      </div>

      {loading ? (
        <div style={{ position: 'relative', zIndex: 1, color: colors.crema, textAlign: 'center', padding: '50px' }}>Loading feedback...</div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '25px' }}>
          
          {activeTab === 'general' && data.general.length === 0 && (
            <div style={{ color: colors.muted, gridColumn: '1 / -1' }}>No store feedback received yet.</div>
          )}
          
          {activeTab === 'general' && data.general.map(item => (
            <div key={`gen-${item.id}`} className="premium-row" style={{ 
              background: 'rgba(255,255,255,0.02)', padding: '35px', borderRadius: '28px', 
              border: `1px solid rgba(255,255,255,0.06)`, position: 'relative',
              backdropFilter: 'blur(10px)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                <div>
                  <h3 style={{ margin: 0, color: colors.crema, fontSize: '1.3rem', fontWeight: '700' }}>{item.reviewer_name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.muted, fontSize: '0.85rem', marginTop: '5px' }}>
                    <Clock size={14} /> {new Date(item.created_at).toLocaleDateString('en-GB')}
                  </div>
                </div>
                {renderStars(item.rating)}
              </div>
              <p style={{ color: '#ccc', lineHeight: '1.6', fontSize: '0.95rem', margin: 0, padding: '20px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '15px', fontStyle: 'italic' }}>
                "{item.comment || 'No comment provided.'}"
              </p>
            </div>
          ))}

          {activeTab === 'products' && data.products.length === 0 && (
            <div style={{ color: colors.muted, gridColumn: '1 / -1' }}>No product reviews received yet.</div>
          )}

          {activeTab === 'products' && data.products.map(item => (
            <div key={`prod-${item.id}`} className="premium-row" style={{ 
              backgroundColor: colors.bean, padding: '30px', borderRadius: '20px', 
              border: `1px solid ${colors.border}`, position: 'relative'
            }}>
              <div style={{ position: 'absolute', top: '-15px', right: '30px', backgroundColor: colors.crema, color: colors.espresso, padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.8rem', boxShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>
                {item.product_name}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', marginTop: '10px' }}>
                <div>
                  <h3 style={{ margin: 0, color: colors.text, fontSize: '1.2rem' }}>{item.reviewer_name}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: colors.muted, fontSize: '0.85rem', marginTop: '5px' }}>
                    <Clock size={14} /> {new Date(item.created_at).toLocaleDateString('en-GB')}
                  </div>
                </div>
                {renderStars(item.rating)}
              </div>
              <p style={{ color: '#ccc', lineHeight: '1.6', fontSize: '0.95rem', margin: 0, padding: '20px', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '15px', fontStyle: 'italic' }}>
                "{item.comment || 'No comment provided.'}"
              </p>
            </div>
          ))}

        </div>
      )}
    </div>
  );
};

export default Feedback;
