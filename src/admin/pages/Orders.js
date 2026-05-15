import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BsEye, BsClockHistory, BsCheckCircle } from 'react-icons/bs';
import { Download, X, CheckCircle2, ShoppingBag } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const theme = {
    bg: '#070504',
    card: 'rgba(255, 255, 255, 0.02)',
    primary: '#c4a484',
    border: 'rgba(196, 164, 132, 0.15)',
    text: '#e6d5c3',
    success: '#38ef7d',
    info: '#4facfe'
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const cellTextStyle = { color: theme.text, fontSize: '1rem', fontWeight: 600, fontFamily: "'DM Serif Display', serif" };
  
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/orders');
      setOrders(Array.isArray(res.data) ? res.data : []);
      setLoading(false);
    } catch (err) {
      console.error("Orders Fetch Error:", err);
      showToast("Could not retrieve orders", "error");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const exportPDF = async () => {
    try {
      if (orders.length === 0) {
        alert("No orders available to export.");
        return;
      }

      // Log the export action
      await axios.post('/api/log-action', { 
        action: 'Export PDF', 
        details: 'Administrator exported the Sales/Orders report to PDF.' 
      });
      
      const doc = new jsPDF();
      
      doc.setFontSize(22);
      doc.setTextColor(45, 41, 38);
      doc.text('CaffAIne - Sales Report', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 32);
      doc.text('Total business performance and transaction history.', 14, 38);
      
      const tableColumn = ["Order No.", "Date & Time", "Total Amount", "Status"];
      const tableRows = orders.map(order => [
        `ORD-${String(order.id).padStart(3, '0')}`,
        order.created_at ? new Date(order.created_at).toLocaleString('en-GB') : 'N/A',
        `¬JOD${parseFloat(order.total_amount || 0).toFixed(2)}`,
        (order.status || 'PENDING').toUpperCase()
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

      const today = new Date().toISOString().split('T')[0];
      doc.save(`CaffAIneCoffee_Orders_${today}.pdf`);
    } catch (error) {
      alert("Error generating PDF: " + error.message);
    }
  };

  const viewOrder = async (order) => {
    setSelectedOrder(order);
    setOrderItems([]);
    try {
      const res = await axios.get(`/api/order-items/${order.id}`);
      setOrderItems(res.data);
    } catch (err) {
      console.error("Critical Fetch Error:", err);
      showToast("Failed to connect to server", "error");
    }
  };

  const closeDetails = () => setSelectedOrder(null);

  const extendTime = async (e, id) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`/api/extend-order/${id}`, { minutes: 2 });
      // Log the time extension
      await axios.post('/api/log-action', {
        action: 'Order Time Extension',
        details: `Added +2 minutes to Order ID: ${id}`
      });
      showToast("+2 Minutes added to prep time", "success");
      fetchOrders();
    } catch (err) {
      showToast("Failed to extend time", "error");
    }
  };

  const markReady = async (e, id) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`/api/mark-ready/${id}`, { status: 'ready' });
      // Log the status change
      await axios.post('/api/log-action', {
        action: 'Order Status Update',
        details: `Marked Order ID: ${id} as READY`
      });
      showToast("Order marked as ready!", "success");
      fetchOrders();
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  const markCompleted = async (e, id) => {
    if (e) e.stopPropagation();
    try {
      await axios.put(`/api/mark-ready/${id}`, { status: 'completed' });
      // Log the completion
      await axios.post('/api/log-action', {
        action: 'Order Fulfilled',
        details: `Marked Order ID: ${id} as COMPLETED (Delivered)`
      });
      showToast("Order marked as completed!", "success");
      fetchOrders();
    } catch (err) {
      showToast("Failed to update status", "error");
    }
  };

  return (
    <div className="orders-container" style={{ backgroundColor: theme.bg, minHeight: '100vh', padding: '30px', position: 'relative', overflow: 'hidden' }}>
      
      {/* Premium Background Elements */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 50% -20%, #2a1b10 0%, #070504 70%)`, zIndex: 0 }} />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <style>{`
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); z-index: 0; opacity: 0.05; animation: float 25s infinite alternate ease-in-out; }
        .orb-1 { width: 600px; height: 600px; background: ${theme.primary}; top: -200px; right: -100px; }
        .orb-2 { width: 500px; height: 500px; background: #2a1b10; bottom: -100px; left: -100px; }
        @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(50px, 50px) scale(1.1); } }
        .page-badge { background: #1b130e; border: 1px solid ${theme.border}; padding: 12px 25px; border-radius: 18px; display: inline-flex; align-items: center; gap: 12px; margin: 20px 0; }
        .page-badge span { font-family: 'Inter', sans-serif; font-size: 2rem; font-weight: 900; color: #fff; letter-spacing: -0.5px; }
        
        @media (max-width: 768px) {
          .orders-container { padding: 15px !important; }
          .header-section { flex-direction: column !important; gap: 20px !important; }
          .page-badge span { font-size: 1.5rem !important; }
          .table-wrapper { overflow-x: auto !important; }
          .premium-row td { padding: 12px 10px !important; font-size: 0.85rem !important; }
          .mobile-hide-col { display: none !important; }
          .modal-content { width: 95% !important; border-radius: 20px !important; }
          .header-btns { width: 100% !important; flex-direction: column !important; }
          .header-btns button { width: 100% !important; }
        }
      `}</style>

      {/* Elegant Notification Toast */}
      {notification && (
        <div className={`premium-toast ${notification.type}`} style={{ zIndex: 4000, position: 'relative' }}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
          {notification.message}
        </div>
      )}

      {selectedOrder && (
      <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div className="modal-content" style={{ backgroundColor: '#0d0806', width: '100%', maxWidth: '520px', maxHeight: '90vh', borderRadius: '30px', border: `1px solid ${theme.border}`, position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            
            {/* Fixed Header */}
            <div style={{ padding: '30px 40px 20px', borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
              <button onClick={closeDetails} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.5rem' }}>√ó</button>
              <h3 style={{ color: theme.primary, margin: '0 0 5px 0', fontSize: '2rem', fontFamily: "'DM Serif Display', serif", fontWeight: 700 }}>
                Order Details{' '}
                <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '10px', background: 'linear-gradient(90deg, #c7a57a, #a47c4f)', color: '#000', fontWeight: 800, letterSpacing: '1px', fontSize: '1.1rem' }}>{`ORD-${String(selectedOrder.id).padStart(3, '0')}`}</span>
              </h3>
            </div>

            {/* Scrollable Body */}
            <div style={{ overflowY: 'auto', flex: 1, padding: '20px 40px' }}>

              {/* Customer Contact & Logistics Info */}
              <div style={{ background: 'rgba(196,164,132,0.05)', padding: '20px', borderRadius: '15px', marginBottom: '20px', border: `1px solid ${theme.border}` }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                   <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 600 }}>Customer Name:</span>
                   <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1rem' }}>{selectedOrder.customer_name || 'Guest'}</span>
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                   <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 600 }}>Contact Phone:</span>
                   {selectedOrder.phone ? (
                     <a href={`tel:${selectedOrder.phone}`} style={{ color: theme.primary, fontWeight: 'bold', fontSize: '1rem', letterSpacing: '1px', textDecoration: 'none', background: 'rgba(196,164,132,0.1)', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', transition: '0.2s', display: 'inline-flex', alignItems: 'center', gap: '6px', border: `1px solid rgba(196,164,132,0.2)` }} onMouseOver={e => e.currentTarget.style.background = 'rgba(196,164,132,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(196,164,132,0.1)'}>
                       üìû {selectedOrder.phone}
                     </a>
                   ) : (
                     <span style={{ color: '#888', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '1px' }}>N/A</span>
                   )}
                 </div>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
                   <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 600 }}>Fulfillment Type:</span>
                   <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem', textTransform: 'uppercase', background: 'rgba(255,255,255,0.1)', padding: '4px 10px', borderRadius: '6px' }}>{selectedOrder.order_type || 'Walk-in'}</span>
                 </div>
                 {selectedOrder.order_type?.toLowerCase() === 'delivery' && (
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '15px', paddingTop: '15px', borderTop: `1px dashed ${theme.border}` }}>
                     <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 600, marginTop: '5px' }}>Delivery Address (GPS):</span>
                     {selectedOrder.delivery_address ? (
                       <a href={`https://maps.google.com/?q=${encodeURIComponent(selectedOrder.delivery_address)}`} target="_blank" rel="noopener noreferrer" style={{ color: theme.success, fontWeight: 'bold', fontSize: '0.95rem', textAlign: 'right', maxWidth: '65%', lineHeight: '1.4', textDecoration: 'none', background: 'rgba(56,239,125,0.1)', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(56,239,125,0.3)', cursor: 'pointer', transition: '0.2s', display: 'inline-flex', alignItems: 'flex-start', gap: '6px' }} onMouseOver={e => e.currentTarget.style.background = 'rgba(56,239,125,0.2)'} onMouseOut={e => e.currentTarget.style.background = 'rgba(56,239,125,0.1)'}>
                         <span style={{ fontSize: '1.1rem' }}>üìç</span> <span style={{ textDecoration: 'underline' }}>{selectedOrder.delivery_address}</span>
                       </a>
                     ) : (
                       <span style={{ color: '#888', fontWeight: 'bold', fontSize: '0.95rem', textAlign: 'right', maxWidth: '65%', lineHeight: '1.4' }}>Address not provided</span>
                     )}
                   </div>
                 )}
              </div>
              
              {/* Items Table */}
              <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: '15px' }}>
                <table width="100%" style={{ borderCollapse: 'collapse', color: theme.text }}>
                  <thead>
                    <tr style={{ color: theme.primary, borderBottom: `1px solid ${theme.border}` }}>
                      <th style={{ padding: '10px', textAlign: 'left' }}>Item</th>
                      <th style={{ padding: '10px', textAlign: 'center' }}>Qty</th>
                      <th style={{ padding: '10px', textAlign: 'right' }}>Price</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderItems.length > 0 ? orderItems.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: `1px solid ${theme.border}` }}>
                            <td style={{ padding: '12px 10px', color: cellTextStyle.color, fontFamily: cellTextStyle.fontFamily, fontSize: cellTextStyle.fontSize }}>{item.item_name}</td>
                            <td style={{ padding: '12px 10px', textAlign: 'center', fontFamily: cellTextStyle.fontFamily }}>{item.quantity}</td>
                            <td style={{ padding: '12px 10px', textAlign: 'right', color: theme.primary, fontFamily: cellTextStyle.fontFamily }}>¬JOD{(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                          {loading ? 'Fetching details...' : 'No items found for this order.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
                {selectedOrder.order_type?.toLowerCase() === 'delivery' && (
                  <div style={{ marginTop: '15px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between', color: 'rgba(255,255,255,0.6)', fontWeight: 'bold', fontSize: '0.95rem', borderTop: `1px dashed ${theme.border}`, paddingTop: '10px' }}>
                    <span>Delivery Service Fee:</span>
                    <span style={{ color: theme.success }}>¬JOD3.00</span>
                  </div>
                )}
                <div style={{ marginTop: selectedOrder.order_type?.toLowerCase() === 'delivery' ? '5px' : '20px', display: 'flex', justifyContent: 'space-between', color: theme.text, fontWeight: 'bold', fontSize: '1.2rem', borderTop: selectedOrder.order_type?.toLowerCase() === 'delivery' ? 'none' : `1px solid ${theme.border}`, paddingTop: selectedOrder.order_type?.toLowerCase() === 'delivery' ? '0' : '15px' }}>
                  <span>Total Amount:</span>
                  <span style={{ color: theme.primary, fontSize: '1.4rem' }}>¬JOD{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Fixed Footer */}
            <div style={{ padding: '20px 40px', borderTop: `1px solid ${theme.border}`, flexShrink: 0 }}>
              <button onClick={closeDetails} style={{ width: '100%', padding: '14px', backgroundColor: theme.primary, color: '#000', border: 'none', borderRadius: '15px', fontWeight: '900', cursor: 'pointer' }}>Close Details</button>
            </div>
          </div>
        </div>
      )}

      {/* Unified Header applied over the original layout */}
      <div className="header-section" style={{ position: 'relative', zIndex: 1, marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.8rem', color: theme.primary, lineHeight: 1 }}>
            CaffAIne <span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
          </div>

          <div className="page-badge">
            <ShoppingBag size={28} color={theme.primary} />
            <span>Live Order Command</span>
          </div>

          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '1rem', fontWeight: 500, marginTop: '5px' }}>
            Real-time fulfillment tracking and logistics management.
          </p>
        </div>
        <div className="header-btns" style={{ display: 'flex', gap: '15px' }}>
          <button 
            onClick={fetchOrders}
            style={{ 
              backgroundColor: 'rgba(196, 164, 132, 0.1)', 
              border: `1px solid ${theme.primary}`, 
              color: theme.primary, 
              padding: '12px 24px', 
              borderRadius: '10px', 
              cursor: 'pointer', 
              fontWeight: '600',
              transition: '0.3s'
            }}
          >
            Pull Orders (Refresh)
          </button>
          <button 
            onClick={exportPDF}
            style={{
              backgroundColor: theme.primary, color: theme.bg, border: 'none', 
              padding: '14px 28px', borderRadius: '14px', fontWeight: 'bold', 
              display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
              transition: '0.3s', boxShadow: '0 10px 20px rgba(196, 164, 132, 0.2)'
            }}>
            <Download size={20} /> Export PDF Report
          </button>
        </div>
      </div>

      <div className="table-wrapper" style={{ 
        position: 'relative',
        zIndex: 1,
        backgroundColor: theme.card, 
        borderRadius: '20px', 
        border: `1px solid ${theme.border}`, 
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center', color: theme.primary, fontWeight: 900 }}>
            RETRIEVING TRANSACTIONS...
          </div>
        ) : (
          <table width="100%" style={{ borderCollapse: 'collapse', color: theme.text }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(45, 41, 38, 0.7)' }}>
                <th style={{ padding: '20px', textAlign: 'left', fontSize: '0.8rem', letterSpacing: '1px', color: cellTextStyle.color }}>ORDER NO.</th>
                <th className="mobile-hide-col" style={{ padding: '20px', textAlign: 'left', fontSize: '0.8rem', letterSpacing: '1px', color: cellTextStyle.color }}>DATE & TIME</th>
                <th style={{ padding: '20px', textAlign: 'left', fontSize: '0.8rem', letterSpacing: '1px', color: cellTextStyle.color }}>TOTAL AMOUNT</th>
                <th style={{ padding: '20px', textAlign: 'left', fontSize: '0.8rem', letterSpacing: '1px', color: cellTextStyle.color }}>STATUS</th>
                <th style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', letterSpacing: '1px', color: cellTextStyle.color }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? orders.map((order, idx) => {
                const orderNo = `ORD-${String(order.id).padStart(3, '0')}`;
                return (
                <tr key={order.id} className="premium-row" style={{ borderBottom: `1px solid ${theme.border}` }}>
                  <td style={{ padding: '20px', color: theme.text, fontWeight: 'bold' }}>
                    <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #c7a57a 0%, #a47c4f 100%)', color: theme.bg, fontWeight: 900, letterSpacing: '1px', boxShadow: '0 4px 10px rgba(196, 164, 132, 0.3)' }}>{orderNo}</span>
                  </td>
                  <td className="mobile-hide-col" style={{ padding: '20px', color: cellTextStyle.color, fontSize: cellTextStyle.fontSize }}>
                    {order.created_at ? new Date(order.created_at).toLocaleString('en-GB') : 'N/A'}
                  </td>
                  <td style={{ padding: '20px', color: theme.primary, fontWeight: '700', fontSize: cellTextStyle.fontSize }}>
                    ¬JOD{parseFloat(order.total_amount || 0).toFixed(2)}
                  </td>
                  <td style={{ padding: '20px' }}>
                    <span style={{ 
                      color: (order.status === 'completed' || order.status === 'ready') ? '#38ef7d' : '#f59e0b', 
                      background: (order.status === 'completed' || order.status === 'ready') ? 'linear-gradient(135deg, rgba(56, 239, 125, 0.15), rgba(56, 239, 125, 0.05))' : 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(245, 158, 11, 0.05))', 
                      border: (order.status === 'completed' || order.status === 'ready') ? '1px solid rgba(56, 239, 125, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                      padding: '6px 14px', 
                      borderRadius: '12px', 
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      letterSpacing: '0.5px'
                    }}>
                      {order.status ? order.status.toUpperCase() : 'PENDING'}
                    </span>
                  </td>
                  <td style={{ padding: '20px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '15px', justifyContent: 'center' }}>
                    {(!order.status || order.status.toLowerCase() === 'preparing' || order.status.toLowerCase() === 'pending') && (
                      <>
                        <button onClick={(e) => extendTime(e, order.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', transition: '0.2s' }} title="Add +2 Minutes">
                          <BsClockHistory color={theme.info} size={20} />
                        </button>
                        <button onClick={(e) => markReady(e, order.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', transition: '0.2s' }} title="Mark as Ready">
                          <BsCheckCircle color={theme.success} size={20} />
                        </button>
                      </>
                    )}
                    {order.status && order.status.toLowerCase() === 'ready' && (
                      <button onClick={(e) => markCompleted(e, order.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', transition: '0.2s' }} title="Mark as Completed (Delivered)">
                        <CheckCircle2 color={theme.success} size={20} />
                      </button>
                    )}
                    <button 
                      onClick={() => viewOrder(order)} 
                      title="View Order Details"
                      style={{ 
                        background: 'linear-gradient(135deg, rgba(196,164,132,0.15), rgba(196,164,132,0.05))', 
                        border: `1px solid ${theme.primary}`, 
                        cursor: 'pointer', 
                        transition: 'all 0.25s ease',
                        borderRadius: '10px',
                        padding: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '7px',
                        color: theme.primary,
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        letterSpacing: '0.5px'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = theme.primary;
                        e.currentTarget.style.color = '#000';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = `0 6px 20px rgba(196,164,132,0.35)`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, rgba(196,164,132,0.15), rgba(196,164,132,0.05))';
                        e.currentTarget.style.color = theme.primary;
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <BsEye size={17} /> VIEW
                    </button>
                  </div>
                  </td>
                </tr>
              );
              }) : (
                <tr>
                  <td colSpan="5" style={{ padding: '100px', textAlign: 'center', color: '#555', letterSpacing: '1px' }}>
                    NO TRANSACTIONS FOUND IN DATABASE.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <style>{`
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

export default Orders;
