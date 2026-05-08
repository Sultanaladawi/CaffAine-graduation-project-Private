import React, { useState, useEffect } from 'react';
import { BsBoxSeam, BsPlusLg, BsTrash, BsPencilSquare } from 'react-icons/bs';
import { Coffee, BellRing, X, Download } from 'lucide-react';
import axios from 'axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Inventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');

  const colors = {
    espresso: 'var(--admin-bg)',
    bean: 'var(--admin-card)',
    crema: 'var(--admin-accent)',
    latte: 'var(--admin-text)',
    border: 'var(--admin-border)',
    input: '#2D2926'
  };

  const cellTextStyle = { color: colors.latte, fontSize: '1rem', fontWeight: 600, fontFamily: "'DM Serif Display', serif" };
  const headerTextStyle = { color: colors.latte, fontSize: '2.2rem', fontFamily: "'DM Serif Display', serif", fontWeight: 700 };
  const headerBoxStyle = { display: 'inline-block', padding: '10px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)' };
  const tableCellBg = 'rgba(0,0,0,0.12)';

  const [formData, setFormData] = useState({
    id: null,
    item_name: '',
    quantity: 0,
    unit: '',
    min_threshold: 10
  });

  const fetchInventory = () => {
    setLoading(true);
    fetch('/api/inventory')
      .then(res => res.json())
      .then(data => {
        const inventoryData = Array.isArray(data) ? data : [];
        setInventory(inventoryData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Inventory Fetch Error:", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const exportPDF = async () => {
    try {
      if (inventory.length === 0) {
        alert("No inventory data available to export.");
        return;
      }

      // Log the export action
      await axios.post('/api/admin/log', { 
        action: 'EXPORT PDF', 
        details: 'Administrator exported the Inventory/Stock report to PDF.' 
      });
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(45, 41, 38);
      doc.text('Faculty Coffee - Inventory Report', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 32);
      doc.text('Current stock levels, thresholds, and replenishment needs.', 14, 38);
      
      // Table
      const tableColumn = ["ID", "Item Name", "Quantity", "Min. Threshold", "Unit", "Status"];
      const tableRows = inventory.map(item => [
        `INV-${String(item.id).padStart(3, '0')}`,
        item.item_name || 'Unnamed',
        item.quantity,
        item.min_threshold,
        item.unit || 'units',
        item.quantity <= item.min_threshold ? 'LOW STOCK' : 'HEALTHY'
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
        },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 5 && data.cell.raw === 'LOW STOCK') {
            data.cell.styles.textColor = [231, 74, 59];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      });

      doc.save(`Faculty_Coffee_Inventory_${Date.now()}.pdf`);
    } catch (error) {
      console.error("PDF Export Error:", error);
      alert("Error generating PDF: " + error.message);
    }
  };

  const openAddModal = () => {
    setModalMode('add');
    setFormData({ id: null, item_name: '', quantity: 0, unit: '', min_threshold: 10 });
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setModalMode('edit');
    setFormData({
      id: item.id,
      item_name: item.item_name,
      quantity: item.quantity,
      unit: item.unit,
      min_threshold: item.min_threshold
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'add') {
        await axios.post('/api/inventory', formData);
      } else {
        await axios.put(`/api/update-stock-item/${formData.id}`, formData);
      }
      setShowModal(false);
      fetchInventory();
    } catch (err) {
      console.error("Save Error:", err);
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this material?")) {
      try {
        await axios.delete(`/api/inventory/${id}`);
        fetchInventory();
      } catch (err) {
        alert("Error deleting item");
      }
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '14px',
    borderRadius: '12px',
    backgroundColor: colors.input,
    border: `1px solid ${colors.border}`,
    color: colors.latte,
    fontSize: '0.95rem',
    outline: 'none',
    transition: '0.3s'
  };

  const labelStyle = {
    color: colors.crema,
    fontSize: '0.85rem',
    fontWeight: '600',
    marginBottom: '8px',
    display: 'block',
    fontFamily: "'Inter', sans-serif"
  };

  return (
    <div className="dashboard-fade-in" style={{ 
      color: colors.latte, 
      backgroundColor: colors.espresso, 
      minHeight: '100vh', 
      padding: '40px 10px 40px 5px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Premium Background Elements */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 50% -20%, #2a1b10 0%, #070504 70%)`, zIndex: 0 }} />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <style>{`
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); z-index: 0; opacity: 0.05; animation: float 25s infinite alternate ease-in-out; }
        .orb-1 { width: 600px; height: 600px; background: ${colors.crema}; top: -200px; right: -100px; }
        .orb-2 { width: 500px; height: 500px; background: #2a1b10; bottom: -100px; left: -100px; }
        @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(50px, 50px) scale(1.1); } }
        .page-badge { background: #1b130e; border: 1px solid ${colors.border}; padding: 12px 25px; border-radius: 18px; display: inline-flex; align-items: center; gap: 12px; margin: 20px 0; }
        .page-badge span { font-family: 'Inter', sans-serif; font-size: 2rem; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
      `}</style>
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(5px)' }}>
          <div style={{ backgroundColor: colors.bean, width: '100%', maxWidth: '500px', borderRadius: '30px', border: `1px solid ${colors.border}`, padding: '40px', position: 'relative', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <button onClick={() => setShowModal(false)} style={{ position: 'absolute', top: '25px', right: '25px', background: 'none', border: 'none', color: colors.latte, cursor: 'pointer', opacity: 0.6 }}>
              <X size={24} />
            </button>
            <h3 style={{ color: colors.crema, margin: '0 0 30px 0', fontFamily: "'DM Serif Display', serif", fontSize: '2rem' }}>
              {modalMode === 'add' ? 'Add Stock Item' : 'Edit Material'}
            </h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
              <div>
                <label style={labelStyle}>Material Name</label>
                <input 
                  type="text" value={formData.item_name} 
                  onChange={(e) => setFormData({...formData, item_name: e.target.value})}
                  placeholder="e.g. Arabica Beans" required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '20px' }}>
                <div style={{ flex: 1 }}>
                  <label style={labelStyle}>Current Quantity</label>
                  <input 
                    type="text" value={formData.quantity} 
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    placeholder="0" required
                    style={inputStyle}
                  />
                </div>
                <div style={{ width: '150px' }}>
                  <label style={labelStyle}>Unit</label>
                  <input 
                    type="text" value={formData.unit} 
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    placeholder="kg, L, etc" required
                    style={inputStyle}
                  />
                </div>
              </div>

              <div>
                <label style={labelStyle}>Minimum Alert Threshold</label>
                <input 
                  type="text" value={formData.min_threshold} 
                  onChange={(e) => setFormData({...formData, min_threshold: e.target.value})}
                  placeholder="Notify me at..." required
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'flex', gap: '15px', marginTop: '10px' }}>
                <button type="submit" style={{ flex: 2, padding: '16px', backgroundColor: colors.crema, color: colors.espresso, border: 'none', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
                  {modalMode === 'add' ? 'Register Item' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '16px', backgroundColor: 'transparent', color: colors.latte, border: `1px solid ${colors.border}`, borderRadius: '15px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
              </div>
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
            <Coffee size={28} color={colors.crema} />
            <span>Inventory Management</span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 500, marginTop: '5px' }}>
            Faculty Coffee | Raw Materials & Stock Level Management
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
            <Download size={18} /> Export PDF
          </button>
          <button onClick={openAddModal} style={{ 
            backgroundColor: colors.crema, 
            border: 'none', 
            color: colors.espresso, 
            padding: '14px 28px', 
            borderRadius: '14px', 
            fontWeight: 'bold', 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '10px',
            boxShadow: '0 10px 20px rgba(196, 164, 132, 0.2)',
            transition: '0.3s'
          }}>
            <BsPlusLg /> Add Stock Item
          </button>
        </div>
      </div>

      {inventory.some(item => item.quantity <= item.min_threshold) && (
        <div style={{ 
          position: 'relative', zIndex: 1,
          backgroundColor: 'rgba(231, 74, 59, 0.1)', 
          border: '1px solid rgba(231, 74, 59, 0.3)', 
          borderRadius: '20px', 
          padding: '20px 30px', 
          marginBottom: '35px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          color: '#e74a3b',
          animation: 'pulse 2s infinite'
        }}>
          <BellRing className="animate-bounce" size={28} />
          <div>
            <strong style={{ display: 'block', fontSize: '1.1rem' }}>Attention: Low Stock Detected</strong>
            <span style={{ fontSize: '0.9rem', opacity: 0.9 }}>Several items are below the safety threshold. Action required.</span>
          </div>
        </div>
      )}

      <div style={{ 
        position: 'relative',
        zIndex: 1,
        width: '100%',
        maxWidth: '1500px',
        backgroundColor: 'rgba(255, 255, 255, 0.01)', 
        borderRadius: '32px', 
        border: `1px solid rgba(255, 255, 255, 0.06)`, 
        overflow: 'hidden',
        boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
        padding: '10px'
      }}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center', color: colors.crema }}>
            <p style={{ letterSpacing: '2px', fontWeight: 'bold' }}>AUDITING RESOURCES...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table width="100%" style={{ borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: 'rgba(45, 41, 38, 0.8)' }}>
                    <th style={{ padding: '25px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.crema }}>Inventory No.</th>
                    <th style={{ padding: '25px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.crema }}>Material Name</th>
                    <th style={{ padding: '25px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.crema }}>Quantity</th>
                    <th style={{ padding: '25px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.crema }}>Unit</th>
                    <th style={{ padding: '25px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.crema }}>Threshold</th>
                    <th style={{ padding: '25px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.crema }}>Status</th>
                    <th style={{ padding: '25px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1.5px', color: colors.crema }}>Actions</th>
                  </tr>
              </thead>
              <tbody>
                {inventory.map((item) => {
                  const isLow = item.quantity <= item.min_threshold;
                  const inventoryNo = `INV-${String(item.id).padStart(3, '0')}`;
                  return (
                    <tr key={item.id} className="premium-row" style={{ 
                      borderBottom: `1px solid ${colors.border}`, 
                      backgroundColor: isLow ? 'rgba(231, 74, 59, 0.03)' : 'transparent'
                    }}>
                      <td style={{ padding: '25px' }}>
                        <span title={inventoryNo} style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #c7a57a 0%, #a47c4f 100%)', color: colors.espresso, fontWeight: 900, letterSpacing: '1px', boxShadow: '0 4px 10px rgba(196, 164, 132, 0.3)' }}>{inventoryNo}</span>
                      </td>
                      <td style={{ padding: '25px' }}>
                        <strong style={cellTextStyle}>{item.item_name}</strong>
                      </td>
                      <td style={{ padding: '25px', color: isLow ? '#ff4d4d' : cellTextStyle.color, fontWeight: cellTextStyle.fontWeight, fontSize: cellTextStyle.fontSize }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '25px' }}>
                        <span style={{ 
                          fontSize: '0.75rem', color: colors.latte, 
                          backgroundColor: 'rgba(255, 255, 255, 0.05)', 
                          border: '1px solid rgba(255,255,255,0.1)',
                          padding: '4px 10px', borderRadius: '6px',
                          fontWeight: '600', letterSpacing: '0.5px'
                        }}>
                          {item.unit || '-'}
                        </span>
                      </td>
                      <td style={{ padding: '25px', color: cellTextStyle.color, fontSize: cellTextStyle.fontSize }}>{item.min_threshold}</td>
                      <td style={{ padding: '25px' }}>
                        {item.quantity <= 0 ? (
                          <span style={{ 
                            color: '#ff4d4d', background: 'linear-gradient(135deg, rgba(255, 77, 77, 0.15), rgba(255, 77, 77, 0.05))', border: '1px solid rgba(255, 77, 77, 0.3)',
                            padding: '6px 14px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.5px' 
                          }}>OUT OF STOCK</span>
                        ) : isLow ? (
                          <span style={{ 
                            color: '#f59e0b', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))', border: '1px solid rgba(245, 158, 11, 0.3)',
                            padding: '6px 14px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.5px', whiteSpace: 'nowrap'
                          }}>LOW STOCK</span>
                        ) : (
                          <span style={{ 
                            color: '#38ef7d', background: 'linear-gradient(135deg, rgba(56, 239, 125, 0.15), rgba(56, 239, 125, 0.05))', border: '1px solid rgba(56, 239, 125, 0.3)',
                            padding: '6px 14px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.5px' 
                          }}>ADEQUATE</span>
                        )}
                      </td>
                      <td style={{ padding: '25px' }}>
                        <div style={{ display: 'flex', gap: '20px' }}>
                          <BsPencilSquare size={20} style={{ cursor: 'pointer', color: '#888', transition: '0.3s' }} onClick={() => openEditModal(item)} title="Edit" />
                          <BsTrash size={20} style={{ cursor: 'pointer', color: '#e74a3b', transition: '0.3s' }} onClick={() => handleDelete(item.id)} title="Delete" />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(231, 74, 59, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(231, 74, 59, 0); }
          100% { box-shadow: 0 0 0 0 rgba(231, 74, 59, 0); }
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(-5%); animation-timing-function: cubic-bezier(0.8,0,1,1); }
          50% { transform: none; animation-timing-function: cubic-bezier(0,0,0.2,1); }
        }
        /* Premium Row Hover Animation */
        .premium-row {
          transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
          cursor: pointer;
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

export default Inventory;