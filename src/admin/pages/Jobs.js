import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, Plus, Trash2, Edit2, X, MapPin, Clock, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    type: 'Full-time',
    location: 'Birmingham',
    description: '',
    active: 1
  });

  const colors = {
    espresso: 'var(--admin-bg)',
    bean: 'var(--admin-card)',
    crema: 'var(--admin-accent)',
    border: 'var(--admin-border)',
    input: 'rgba(255,255,255,0.05)'
  };

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/careers');
      setJobs(res.data);
    } catch (err) {
      console.error("Fetch jobs error:", err);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    try {
      if (jobs.length === 0) {
        alert("No job data available to export.");
        return;
      }
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(45, 41, 38);
      doc.text('Faculty Coffee - Career Openings', 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 32);
      doc.text('Current active job vacancies and position details.', 14, 38);

      const tableColumn = ["Title", "Type", "Location", "Posted Date"];
      const tableRows = jobs.map(job => [
        job.title || 'Untitled',
        job.type || 'Full-time',
        job.location || 'N/A',
        new Date(job.created_at).toLocaleDateString('en-GB')
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [196, 164, 132], textColor: [255, 255, 255] }
      });
      doc.save(`Faculty_Coffee_Jobs_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Error generating PDF: " + error.message);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleOpenModal = (mode, job = null) => {
    setModalMode(mode);
    if (mode === 'edit' && job) {
      setCurrentId(job.id);
      setFormData({
        title: job.title,
        type: job.type,
        location: job.location,
        description: job.description,
        active: job.active
      });
    } else {
      setFormData({ title: '', type: 'Full-time', location: 'Birmingham', description: '', active: 1 });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await axios.post('/api/careers', formData);
      } else {
        await axios.put(`/api/careers/${currentId}`, formData);
      }
      setShowModal(false);
      fetchJobs();
    } catch (err) {
      alert("Failed to save job");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this job opening?")) {
      try {
        await axios.delete(`/api/careers/${id}`);
        fetchJobs();
      } catch (err) {
        alert("Failed to delete job");
      }
    }
  };

  const inputStyle = {
    width: '100%', padding: '12px', borderRadius: '10px', backgroundColor: colors.input,
    border: `1px solid ${colors.border}`, color: '#fff', outline: 'none', marginBottom: '15px'
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
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ backgroundColor: colors.bean, width: '100%', maxWidth: '500px', borderRadius: '20px', padding: '30px', border: `1px solid ${colors.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px' }}>
              <h2 style={{ color: '#fff', margin: 0 }}>{modalMode === 'add' ? 'Add New Job' : 'Edit Job'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <label style={{ color: colors.crema, fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>JOB TITLE</label>
              <input style={inputStyle} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required placeholder="e.g. Senior Barista" />
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: colors.crema, fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>TYPE</label>
                  <select 
                    style={{ ...inputStyle, backgroundColor: '#1a1a1a', cursor: 'pointer', marginBottom: (!['Full-time', 'Part-time', 'Contract'].includes(formData.type) && formData.type !== '') ? '5px' : '15px' }} 
                    value={['Full-time', 'Part-time', 'Contract'].includes(formData.type) || formData.type === '' ? formData.type : '__custom__'} 
                    onChange={e => {
                      if (e.target.value === '__custom__') setFormData({...formData, type: ''});
                      else setFormData({...formData, type: e.target.value});
                    }}
                  >
                    <option value="Full-time" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Full-time</option>
                    <option value="Part-time" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Part-time</option>
                    <option value="Contract" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Contract</option>
                    <option value="__custom__" style={{ backgroundColor: '#1a1a1a', color: '#fff' }}>Other...</option>
                  </select>
                  {!['Full-time', 'Part-time', 'Contract'].includes(formData.type) && (
                    <input 
                      style={{ ...inputStyle, backgroundColor: '#1a1a1a', marginTop: '5px' }} 
                      value={formData.type} 
                      onChange={e => setFormData({...formData, type: e.target.value})} 
                      placeholder="Enter custom type..."
                      autoFocus
                    />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ color: colors.crema, fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>LOCATION</label>
                  <input style={inputStyle} value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} required />
                </div>
              </div>

              <label style={{ color: colors.crema, fontSize: '0.8rem', display: 'block', marginBottom: '5px' }}>DESCRIPTION</label>
              <textarea style={{ ...inputStyle, minHeight: '100px' }} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />

              <button type="submit" style={{ width: '100%', padding: '15px', backgroundColor: colors.crema, color: colors.espresso, border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' }}>
                {modalMode === 'add' ? 'Create Opening' : 'Update Job'}
              </button>
            </form>
          </div>
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
            <Briefcase size={28} color={colors.crema} />
            <span>Career Openings</span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 500, marginTop: '5px' }}>
            Faculty Coffee | Recruitment & Vacancy Management
          </p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
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
          <button onClick={() => handleOpenModal('add')} style={{ backgroundColor: colors.crema, color: colors.espresso, border: 'none', padding: '14px 28px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(196, 164, 132, 0.2)' }}>
            <Plus size={20} /> Add Job
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ position: 'relative', zIndex: 1, color: colors.crema, padding: '0 20px' }}>Loading jobs...</div>
      ) : (
        <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' }}>
          {jobs.length > 0 ? jobs.map(job => (
            <div key={job.id} className="premium-row" style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.02)', 
              backdropFilter: 'blur(10px)',
              borderRadius: '24px', 
              padding: '35px', 
              border: `1px solid rgba(196, 164, 132, 0.15)`, 
              position: 'relative',
            }}>
              <div style={{ position: 'absolute', top: '30px', right: '30px', display: 'flex', gap: '15px' }}>
                <button onClick={() => handleOpenModal('edit', job)} style={{ background: 'rgba(196,164,132,0.1)', border: 'none', color: colors.crema, cursor: 'pointer', padding: '10px', borderRadius: '12px', transition: '0.3s' }} onMouseOver={(e) => e.currentTarget.style.background='rgba(196,164,132,0.2)'} onMouseOut={(e) => e.currentTarget.style.background='rgba(196,164,132,0.1)'}><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(job.id)} style={{ background: 'rgba(220,53,69,0.1)', border: 'none', color: '#ff4d4d', cursor: 'pointer', padding: '10px', borderRadius: '12px', transition: '0.3s' }} onMouseOver={(e) => e.currentTarget.style.background='rgba(220,53,69,0.2)'} onMouseOut={(e) => e.currentTarget.style.background='rgba(220,53,69,0.1)'}><Trash2 size={18} /></button>
              </div>

              <div style={{ display: 'flex', gap: '20px', alignItems: 'center', marginBottom: '25px' }}>
                <div style={{ background: 'linear-gradient(135deg, rgba(196,164,132,0.2) 0%, rgba(196,164,132,0.05) 100%)', padding: '18px', borderRadius: '20px', border: '1px solid rgba(196,164,132,0.1)' }}>
                  <Briefcase color={colors.crema} size={28} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.4rem', fontFamily: 'serif' }}>{job.title}</h3>
                  <div style={{ color: colors.crema, fontSize: '0.85rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '5px' }}>{job.type}</div>
                </div>
              </div>

              <div style={{ color: '#aaa', fontSize: '0.95rem', marginBottom: '25px', display: 'flex', gap: '20px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={16} color={colors.crema} /> {job.location}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Clock size={16} color={colors.crema} /> {new Date(job.created_at).toLocaleDateString('en-GB')}</span>
              </div>

              <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(196,164,132,0.2) 0%, transparent 100%)', marginBottom: '25px' }}></div>
              
              <p style={{ color: '#ccc', fontSize: '0.95rem', lineHeight: '1.7', margin: 0, opacity: 0.9 }}>{job.description}</p>
            </div>
          )) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', backgroundColor: colors.bean, borderRadius: '30px', border: `1px dashed ${colors.border}` }}>
              <Briefcase size={48} color={colors.border} style={{ marginBottom: '20px' }} />
              <h3 style={{ color: colors.crema }}>No active job openings</h3>
              <p style={{ color: '#777' }}>Click "Add Job" to start recruiting for Faculty Coffee.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Jobs;
