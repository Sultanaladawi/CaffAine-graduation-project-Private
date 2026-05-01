import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Tag, Plus, Trash2, Calendar, Sparkles, X, Edit2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Offers = () => {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  const exportPDF = () => {
    try {
      if (offers.length === 0) {
        alert("No promotions to export.");
        return;
      }
      const doc = new jsPDF();
      doc.setFontSize(22);
      doc.setTextColor(45, 41, 38);
      doc.text('Faculty Coffee - Marketing Promotions', 14, 22);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 32);
      doc.text('Current active promotions and seasonal discounts.', 14, 38);

      const tableColumn = ["Product Name", "Discount", "Description", "Expiry Date"];
      const tableRows = offers.map(offer => [
        offer.product_name || 'N/A',
        `${offer.discount_percent}%`,
        offer.reason || 'No description',
        offer.end_date ? new Date(offer.end_date).toLocaleDateString('en-GB') : 'No Expiry'
      ]);

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [196, 164, 132], textColor: [255, 255, 255] }
      });
      doc.save(`Faculty_Coffee_Offers_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Error generating PDF: " + error.message);
    }
  };
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [currentId, setCurrentId] = useState(null);
  const [formData, setFormData] = useState({
    product_name: '',
    discount_percent: '',
    reason: '',
    end_date: '',
    active: 1
  });

  const colors = {
    espresso: 'var(--admin-bg)',
    bean: 'var(--admin-card)',
    crema: 'var(--admin-accent)',
    latte: 'var(--admin-text)',
    border: 'var(--admin-border)',
    input: 'rgba(255,255,255,0.05)'
  };

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/offers`);
      setOffers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("API Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, []);

  const handleOpenModal = (mode, offer = null) => {
    setModalMode(mode);
    if (mode === 'edit' && offer) {
      setCurrentId(offer.id);
      // Format date for input type="date" (YYYY-MM-DD)
      const formattedDate = offer.end_date ? new Date(offer.end_date).toISOString().split('T')[0] : '';
      setFormData({
        product_name: offer.product_name || '',
        discount_percent: offer.discount_percent || '',
        reason: offer.reason || '',
        end_date: formattedDate,
        active: offer.active ?? 1
      });
    } else {
      setFormData({
        product_name: '',
        discount_percent: '',
        reason: '',
        end_date: '',
        active: 1
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await axios.post('/api/offers', formData);
      } else {
        await axios.put(`/api/offers/${currentId}`, formData);
      }
      setShowModal(false);
      fetchOffers();
    } catch (err) {
      console.error("Submit Error:", err);
      alert("Failed to save offer: " + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this offer?")) {
      try {
        await axios.delete(`/api/offers/${id}`);
        fetchOffers();
      } catch (err) {
        console.error("Delete Error:", err);
        alert("Failed to delete offer");
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No Expiry";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "Invalid Date"; 
    
    // Explicitly English (US) format with Western numerals
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    });
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    backgroundColor: colors.input,
    border: `1px solid ${colors.border}`,
    color: '#fff',
    fontSize: '0.95rem',
    outline: 'none',
    transition: '0.3s'
  };

  const labelStyle = {
    display: 'block',
    color: colors.crema,
    marginBottom: '8px',
    fontSize: '0.85rem',
    fontWeight: '600'
  };

  // Force Western Numerals CSS
  const westernNumeralsStyle = `
    .force-english-date {
      font-variant-numeric: tabular-nums;
      -webkit-appearance: none;
      min-height: 52px;
    }
    .force-english-date::-webkit-datetime-edit { padding: 0.2em; }
    .force-english-date::-webkit-calendar-picker-indicator { cursor: pointer; filter: invert(0.8); }
  `;

  return (
    <div style={{ backgroundColor: colors.espresso, minHeight: '100vh', padding: '40px', color: colors.latte }}>
      {/* Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: colors.bean, width: '100%', maxWidth: '500px', borderRadius: '24px', border: `1px solid ${colors.border}`, padding: '40px', position: 'relative' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '25px', right: '25px', backgroundColor: 'transparent', border: 'none', color: '#fff', cursor: 'pointer', opacity: 0.6 }}>
              <X size={24} />
            </button>
            <h2 style={{ color: '#fff', margin: '0 0 30px 0', fontFamily: 'serif' }}>{modalMode === 'add' ? 'Create New Offer' : 'Edit Offer'}</h2>
            
            <style>{westernNumeralsStyle}</style>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={labelStyle}>Product Name</label>
                <input 
                  style={inputStyle} 
                  value={formData.product_name} 
                  onChange={e => setFormData({...formData, product_name: e.target.value})} 
                  placeholder="e.g. Latte Special" required
                />
              </div>
              
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Discount (%)</label>
                  <input 
                    type="number" style={inputStyle} 
                    value={formData.discount_percent} 
                    onChange={e => setFormData({...formData, discount_percent: e.target.value})} 
                    placeholder="20" required
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Expiry Date</label>
                  <input 
                    type="text"
                    placeholder="YYYY-MM-DD"
                    className="force-english-date"
                    style={inputStyle} 
                    value={formData.end_date} 
                    onChange={e => setFormData({...formData, end_date: e.target.value})} 
                    onFocus={(e) => e.target.placeholder = "e.g. 2024-12-31"}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Offer Description</label>
                <textarea 
                  style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }} 
                  value={formData.reason} 
                  onChange={e => setFormData({...formData, reason: e.target.value})} 
                  placeholder="Describe the promotion..." required
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 2, padding: '16px', backgroundColor: colors.crema, color: colors.espresso, border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {modalMode === 'add' ? 'Create Promo' : 'Update Offer'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', backgroundColor: 'transparent', color: '#fff', border: `1px solid ${colors.border}`, borderRadius: '15px', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '50px' }}>
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
          <h1 style={{ color: '#fff', margin: 0, fontSize: '2.5rem', fontFamily: 'serif' }}>Marketing Promotions</h1>
          <p style={{ color: colors.crema, marginTop: '10px' }}>Manage and publish seasonal coffee offers.</p>
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
          <button 
            onClick={() => handleOpenModal('add')}
            style={{ backgroundColor: colors.crema, color: colors.espresso, border: 'none', padding: '14px 28px', borderRadius: '14px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px', boxShadow: '0 10px 20px rgba(196, 164, 132, 0.2)' }}>
            <Plus size={20} /> Create Promo
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', color: colors.crema, padding: '100px' }}>
          <div className="loader-spinner"></div>
          <p>Loading your promotions...</p>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
          gap: '25px',
          alignItems: 'start'
        }}>
          {offers.length > 0 ? offers.map((offer) => (
            <div key={offer.id} style={{ 
              backgroundColor: colors.bean, 
              borderRadius: '24px', 
              border: `1px solid ${colors.border}`,
              padding: '30px',
              position: 'relative',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
              transition: '0.3s'
            }}>
              <div style={{ position: 'absolute', top: '25px', right: '20px', display: 'flex', gap: '10px' }}>
                <button onClick={() => handleOpenModal('edit', offer)} style={{ background: 'none', border: 'none', color: colors.crema, cursor: 'pointer', opacity: 0.7 }}>
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(offer.id)} style={{ background: 'none', border: 'none', color: '#ff4444', cursor: 'pointer', opacity: 0.7 }}>
                  <Trash2 size={18} />
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                <div style={{ background: 'rgba(196,164,132,0.15)', padding: '15px', borderRadius: '16px' }}>
                  <Tag color={colors.crema} size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.3rem' }}>{offer.product_name}</h3>
                  <div style={{ color: colors.crema, fontSize: '1rem', fontWeight: 'bold', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} /> {offer.discount_percent}% OFF
                  </div>
                </div>
              </div>

              <p style={{ color: '#bbb', fontSize: '1rem', lineHeight: '1.7', marginBottom: '30px', minHeight: '60px' }}>
                {offer.reason}
              </p>

              <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#888', fontSize: '0.9rem' }}>
                <Calendar size={16} />
                <span>Valid until: <b style={{ color: colors.crema }}>{formatDate(offer.end_date)}</b></span>
              </div>
            </div>
          )) : (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px', backgroundColor: colors.bean, borderRadius: '24px', border: `1px dashed ${colors.border}` }}>
              <Sparkles size={48} color={colors.border} style={{ marginBottom: '20px' }} />
              <h3 style={{ color: colors.crema }}>No active promotions</h3>
              <p style={{ color: '#777' }}>Click "Create Promo" to start your first offer.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Offers;