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
    <div style={{ padding: '40px', backgroundColor: colors.espresso, minHeight: '100vh' }}>
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
                  <select style={inputStyle} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                    <option value="Full-time">Full-time</option>
                    <option value="Part-time">Part-time</option>
                    <option value="Contract">Contract</option>
                  </select>
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <div style={{ 
            fontFamily: "'DM Serif Display', serif", 
            fontSize: '1.8rem', 
            color: colors.crema, 
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '15px'
          }}>
            Faculty<span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
          </div>
          <h1 style={{ color: '#fff', fontSize: '2.5rem', fontFamily: 'serif', margin: 0 }}>Career Openings</h1>
          <p style={{ color: colors.crema, marginTop: '10px' }}>Control and publish job vacancies on your platform.</p>
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
        <div style={{ color: colors.crema }}>Loading jobs...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '30px' }}>
          {jobs.length > 0 ? jobs.map(job => (
            <div key={job.id} style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.03)', 
              backdropFilter: 'blur(10px)',
              borderRadius: '24px', 
              padding: '35px', 
              border: `1px solid rgba(196, 164, 132, 0.15)`, 
              position: 'relative',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-10px)';
              e.currentTarget.style.border = `1px solid ${colors.crema}`;
              e.currentTarget.style.boxShadow = '0 25px 50px rgba(0,0,0,0.4)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.border = `1px solid rgba(196, 164, 132, 0.15)`;
              e.currentTarget.style.boxShadow = '0 15px 35px rgba(0,0,0,0.2)';
            }}
            >
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
