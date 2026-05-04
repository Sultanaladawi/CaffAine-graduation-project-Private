import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Phone, Briefcase, Trash2, CheckCircle, XCircle, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Applications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);

  const colors = {
    espresso: 'var(--admin-bg)',
    bean: 'var(--admin-card)',
    crema: 'var(--admin-accent)',
    border: 'var(--admin-border)'
  };

  const fetchApps = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/applications');
      setApps(res.data);
    } catch (err) {
      console.error("Fetch apps error:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    try {
      if (apps.length === 0) {
        alert("No applications to export.");
        return;
      }
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(45, 41, 38);
      doc.text('Faculty Coffee - Candidate Submissions', 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 32);
      doc.text('Full list of applicants and their current status.', 14, 38);

      const tableColumn = ["Name", "Position", "Email", "Phone", "Status"];
      const tableRows = apps.map(app => [
        app.name || 'Anonymous',
        app.position || 'N/A',
        app.email || 'N/A',
        app.phone || 'N/A',
        (app.status || 'Pending').toUpperCase()
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [196, 164, 132], textColor: [255, 255, 255] }
      });
      doc.save(`Faculty_Coffee_Applicants_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Error generating PDF: " + error.message);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/applications/${id}/status`, { status });
      fetchApps();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this application?")) {
      try {
        await axios.delete(`/api/applications/${id}`);
        fetchApps();
      } catch (err) {
        alert("Failed to delete");
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'shortlisted': return '#28a745';
      case 'rejected': return '#dc3545';
      default: return '#ffc107';
    }
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
          transform: translateY(-5px) scale(1.005);
          box-shadow: 0 15px 35px rgba(0,0,0,0.4) !important;
          border-color: rgba(196, 164, 132, 0.5) !important;
          position: relative;
          z-index: 10;
        }
      `}</style>
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
            <User size={28} color={colors.crema} />
            <span>Candidate Applications</span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 500, marginTop: '5px' }}>
            Faculty Coffee | Reviewing & Managing Potential Talent
          </p>
        </div>
        <button 
          onClick={exportPDF}
          style={{ 
            backgroundColor: 'rgba(196, 164, 132, 0.1)', 
            color: colors.crema, 
            border: `1px solid ${colors.crema}`, 
            padding: '14px 28px', borderRadius: '14px', fontWeight: 'bold', 
            display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
            transition: '0.3s'
          }}>
          <Download size={20} /> Export PDF
        </button>
      </div>

      {loading ? (
        <div style={{ position: 'relative', zIndex: 1, color: colors.crema, padding: '0 20px' }}>Loading applications...</div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))', gap: '30px' }}>
          {apps.length > 0 ? apps.map(app => (
            <div key={app.id} className="premium-row" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.02)', 
              backdropFilter: 'blur(10px)',
              borderRadius: '24px', 
              padding: '35px', 
              border: `1px solid rgba(196, 164, 132, 0.15)`, 
              position: 'relative',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '25px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                  <div style={{ background: 'linear-gradient(135deg, rgba(196,164,132,0.2) 0%, rgba(196,164,132,0.05) 100%)', padding: '15px', borderRadius: '18px', border: '1px solid rgba(196,164,132,0.1)' }}>
                    <User color={colors.crema} size={28} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, color: '#fff', fontSize: '1.3rem', fontFamily: 'serif' }}>{app.name}</h3>
                    <div style={{ 
                      color: getStatusColor(app.status), 
                      fontSize: '0.75rem', 
                      fontWeight: '900', 
                      textTransform: 'uppercase', 
                      marginTop: '6px',
                      letterSpacing: '1.2px',
                      backgroundColor: `${getStatusColor(app.status)}15`,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      display: 'inline-block'
                    }}>
                      {app.status}
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDelete(app.id)} style={{ background: 'rgba(220,53,69,0.1)', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '10px', borderRadius: '12px', transition: '0.3s' }}>
                  <Trash2 size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', color: '#ccc', fontSize: '0.95rem', marginBottom: '30px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Briefcase size={18} color={colors.crema} /> <span>Applied for: <b style={{ color: '#fff' }}>{app.position}</b></span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Mail size={18} color={colors.crema} /> <span>{app.email}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Phone size={18} color={colors.crema} /> <span>{app.phone}</span>
                </div>
              </div>

              <div style={{ backgroundColor: 'rgba(0,0,0,0.25)', padding: '20px', borderRadius: '18px', marginBottom: '30px', borderLeft: `4px solid ${colors.crema}` }}>
                <label style={{ display: 'block', color: colors.crema, fontSize: '0.8rem', fontWeight: '900', marginBottom: '10px', letterSpacing: '1px' }}>CANDIDATE NOTE</label>
                <p style={{ margin: 0, color: '#ddd', fontSize: '0.9rem', lineHeight: '1.7', fontStyle: 'italic' }}>
                  "{app.cover_letter}"
                </p>
              </div>

              <div style={{ display: 'flex', gap: '15px' }}>
                <button 
                  onClick={() => updateStatus(app.id, 'shortlisted')}
                  style={{ flex: 1, padding: '14px', backgroundColor: 'rgba(40, 167, 69, 0.1)', border: '1px solid #28a745', color: '#28a745', borderRadius: '14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.3s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor='rgba(40, 167, 69, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor='rgba(40, 167, 69, 0.1)'}
                >
                  <CheckCircle size={16} /> Shortlist
                </button>
                <button 
                  onClick={() => updateStatus(app.id, 'rejected')}
                  style={{ flex: 1, padding: '14px', backgroundColor: 'rgba(220, 53, 69, 0.1)', border: '1px solid #dc3545', color: '#dc3545', borderRadius: '14px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: '0.3s' }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor='rgba(220, 53, 69, 0.2)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor='rgba(220, 53, 69, 0.1)'}
                >
                  <XCircle size={16} /> Reject
                </button>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', backgroundColor: colors.bean, borderRadius: '30px', border: `1px dashed ${colors.border}` }}>
              <User size={48} color={colors.border} style={{ marginBottom: '20px' }} />
              <h3 style={{ color: colors.crema }}>No applications received yet</h3>
              <p style={{ color: '#777' }}>Keep an eye on this space for future Faculty Coffee baristas!</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Applications;
