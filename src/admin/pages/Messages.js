import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Mail, Trash2, Reply, CheckCircle2, User, Clock, Inbox, MailOpen, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Messages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const exportPDF = () => {
    try {
      if (messages.length === 0) {
        alert("No messages available to export.");
        return;
      }
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(45, 41, 38);
      doc.text('Faculty Coffee - Customer Inquiries', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 32);
      doc.text('Full log of messages received via the contact form.', 14, 38);
      
      // Table
      const tableColumn = ["Date", "Customer Name", "Email", "Message Content"];
      const tableRows = messages.map(msg => [
        new Date(msg.created_at).toLocaleDateString('en-GB'),
        msg.name || 'Anonymous',
        msg.email || 'N/A',
        msg.message ? (msg.message.length > 80 ? msg.message.substring(0, 80) + '...' : msg.message) : ''
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
          fontSize: 9,
          cellPadding: 4
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        }
      });

      doc.save(`Faculty_Coffee_Messages_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Error generating PDF: " + error.message);
    }
  };

  const colors = {
    espresso: 'var(--admin-bg)',
    bean: 'var(--admin-card)',
    crema: 'var(--admin-accent)',
    latte: 'var(--admin-text)',
    border: 'var(--admin-border)'
  };

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/contact');
      setMessages(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this message?")) {
      try {
        await axios.delete(`/api/contact/${id}`);
        setMessages(messages.filter(m => m.id !== id));
      } catch (err) {
        alert("Failed to delete message");
      }
    }
  };

  const handleToggleRead = async (id, currentStatus) => {
    try {
      await axios.put(`/api/contact/${id}/read`, { is_read: !currentStatus });
      setMessages(messages.map(m => m.id === id ? { ...m, is_read: !currentStatus } : m));
    } catch (err) {
      console.error("Failed to toggle read status", err);
    }
  };

  const handleReply = (email, name) => {
    const subject = encodeURIComponent("Re: Your message to Faculty Coffee");
    const body = encodeURIComponent(`Hi ${name},\n\nThank you for reaching out to us.\n\n`);
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

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
          transform: translateY(-2px) scale(1.005);
          box-shadow: 0 10px 30px rgba(0,0,0,0.5) !important;
          position: relative;
          z-index: 10;
        }
      `}</style>
      
      {/* Header */}
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
            <Mail size={28} color={colors.crema} />
            <span>Customer Messages</span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 500, marginTop: '5px' }}>
            Faculty Coffee | Customer Support & Feedback Inquiries
          </p>
        </div>
        <button 
          onClick={exportPDF}
          style={{ 
            backgroundColor: 'rgba(196, 164, 132, 0.1)', 
            color: colors.crema, 
            border: `1px solid ${colors.crema}`, 
            padding: '12px 24px', borderRadius: '12px', fontWeight: 'bold', 
            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
            transition: '0.3s'
          }}>
          <Download size={18} /> Export PDF
        </button>
      </div>

      {loading ? (
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', color: colors.crema, padding: '100px' }}>
          <div className="loader-spinner"></div>
          <p>Loading messages...</p>
        </div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {messages.length > 0 ? messages.map((msg) => (
            <div key={msg.id} className="premium-row" style={{ 
              backgroundColor: msg.is_read ? colors.bean : 'rgba(196,164,132,0.1)', 
              borderRadius: '20px', 
              border: `1px solid ${msg.is_read ? colors.border : colors.crema}`,
              padding: '25px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              position: 'relative'
            }}>
              
              {/* Message Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `1px solid ${colors.border}`, paddingBottom: '15px' }}>
                <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                  <div style={{ backgroundColor: msg.is_read ? 'rgba(255,255,255,0.05)' : 'rgba(196,164,132,0.2)', padding: '12px', borderRadius: '50%', color: msg.is_read ? '#888' : colors.crema }}>
                    <User size={24} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {msg.name} {!msg.is_read && <span style={{ fontSize: '0.7rem', backgroundColor: colors.crema, color: colors.espresso, padding: '2px 8px', borderRadius: '10px', fontWeight: 'bold' }}>NEW</span>}
                    </h3>
                    <a href={`mailto:${msg.email}`} style={{ color: colors.crema, textDecoration: 'none', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
                      <Mail size={14} /> {msg.email}
                    </a>
                  </div>
                </div>
                
                <div style={{ color: '#888', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Clock size={14} /> {formatDate(msg.created_at)}
                </div>
              </div>

              {/* Message Body */}
              <div style={{ color: msg.is_read ? '#bbb' : '#fff', fontSize: '1.05rem', lineHeight: '1.6', padding: '10px 0', whiteSpace: 'pre-wrap' }}>
                {msg.message}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px', paddingTop: '15px', borderTop: `1px dashed ${colors.border}` }}>
                <button 
                  onClick={() => handleToggleRead(msg.id, msg.is_read)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', backgroundColor: 'transparent', border: `1px solid ${colors.border}`, color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
                  {msg.is_read ? <><Mail size={16} /> Mark as Unread</> : <><MailOpen size={16} /> Mark as Read</>}
                </button>
                <button 
                  onClick={() => handleDelete(msg.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '10px', backgroundColor: 'transparent', border: `1px solid #ff4444`, color: '#ff4444', cursor: 'pointer', fontWeight: 'bold' }}>
                  <Trash2 size={16} /> Delete
                </button>
                <button 
                  onClick={() => handleReply(msg.email, msg.name)}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '10px', backgroundColor: colors.crema, border: 'none', color: colors.espresso, cursor: 'pointer', fontWeight: 'bold' }}>
                  <Reply size={16} /> Reply via Email
                </button>
              </div>

            </div>
          )) : (
            <div style={{ textAlign: 'center', padding: '100px', backgroundColor: colors.bean, borderRadius: '24px', border: `1px dashed ${colors.border}` }}>
              <CheckCircle2 size={48} color={colors.crema} style={{ marginBottom: '20px' }} />
              <h3 style={{ color: '#fff' }}>Inbox is empty!</h3>
              <p style={{ color: '#777' }}>All customer messages have been read and replied to.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Messages;
