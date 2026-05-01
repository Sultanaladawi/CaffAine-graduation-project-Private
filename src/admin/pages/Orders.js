import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BsEye, BsClockHistory, BsCheckCircle } from 'react-icons/bs';
import { Download, X, CheckCircle2 } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const theme = {
    bg: 'var(--admin-bg)',
    card: 'var(--admin-card)',
    primary: 'var(--admin-accent)',
    border: 'var(--admin-border)',
    text: 'var(--admin-text)',
    success: '#38ef7d'  
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const cellTextStyle = { color: theme.text, fontSize: '1rem', fontWeight: 600, fontFamily: "'DM Serif Display', serif" };
  const headerTextStyle = { color: theme.text, fontSize: '2.2rem', fontFamily: "'DM Serif Display', serif", fontWeight: 700 };
  const headerBoxStyle = { display: 'inline-block', padding: '10px 18px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', marginBottom: '15px' };

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

  const exportPDF = () => {
    try {
      console.log("Generating PDF report with data:", orders);
      if (orders.length === 0) {
        alert("No orders available to export.");
        return;
      }
      
      const doc = new jsPDF();
      
      // Header
      doc.setFontSize(22);
      doc.setTextColor(45, 41, 38);
      doc.text('Faculty Coffee - Sales Report', 14, 22);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 32);
      doc.text('Total business performance and transaction history.', 14, 38);
      
      // Table
      const tableColumn = ["Order No.", "Date & Time", "Total Amount", "Status"];
      const tableRows = orders.map(order => [
        `ORD-${String(order.id).padStart(3, '0')}`,
        order.created_at ? new Date(order.created_at).toLocaleString('en-GB') : 'N/A',
        `£${parseFloat(order.total_amount || 0).toFixed(2)}`,
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

      doc.save(`Faculty_Coffee_Sales_Report_${Date.now()}.pdf`);
      console.log("PDF report generated successfully.");
    } catch (error) {
      console.error("PDF Export Error:", error);
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

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: '100vh', padding: '30px' }}>
      {/* Elegant Notification Toast */}
      {notification && (
        <div className={`premium-toast ${notification.type}`}>
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
          {notification.message}
        </div>
      )}

      {selectedOrder && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.85)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(8px)' }}>
          <div style={{ backgroundColor: theme.card, width: '100%', maxWidth: '500px', borderRadius: '30px', border: `1px solid ${theme.border}`, padding: '40px', position: 'relative', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
            <button onClick={closeDetails} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1.5rem' }}>&times;</button>
            <h3 style={{ color: theme.primary, margin: '0 0 20px 0', ...headerTextStyle }}>
              Order Details {' '}
              <span style={{ display: 'inline-block', padding: '6px 12px', borderRadius: '10px', background: 'linear-gradient(90deg, #c7a57a, #a47c4f)', color: theme.bg, fontWeight: 800, letterSpacing: '1px' }}>{`ORD-${String(selectedOrder.id).padStart(3, '0')}`}</span>
            </h3>
            
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
                          <td style={{ padding: '12px 10px', textAlign: 'right', color: theme.primary, fontFamily: cellTextStyle.fontFamily }}>£{(parseFloat(item.price) * item.quantity).toFixed(2)}</td>
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
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', color: theme.text, fontWeight: 'bold', fontSize: '1.1rem' }}>
                <span>Total Amount:</span>
                <span style={{ color: theme.primary }}>£{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
              </div>
            </div>
            <button onClick={closeDetails} style={{ width: '100%', marginTop: '30px', padding: '12px', backgroundColor: theme.primary, color: theme.bg, border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>Close Details</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
        <div>
          <div style={{ 
            fontFamily: "'DM Serif Display', serif", 
            fontSize: '1.8rem', 
            color: theme.primary, 
            lineHeight: '1',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            marginBottom: '15px'
          }}>
            Faculty<span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
          </div>
          <div style={headerBoxStyle}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: 0, ...headerTextStyle }}>
              <BsClockHistory size={32} color={theme.primary} /> Sales Orders
            </h2>
          </div>
          <p style={{ color: theme.primary, fontSize: '0.95rem', marginTop: '12px', opacity: 0.8 }}>Faculty Coffee | Real-time Transaction Records</p>
        </div>
        <div style={{ display: 'flex', gap: '15px' }}>
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

      <div style={{ 
        backgroundColor: theme.card, 
        borderRadius: '20px', 
        border: `1px solid ${theme.border}`, 
        overflow: 'hidden',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
      }}>
        {loading ? (
          <div style={{ padding: '100px', textAlign: 'center', color: theme.primary }}>
            RETRIEVING TRANSACTIONS...
          </div>
        ) : (
          <table width="100%" style={{ borderCollapse: 'collapse', color: theme.text }}>
            <thead>
              <tr style={{ backgroundColor: 'rgba(45, 41, 38, 0.7)' }}>
                <th style={{ padding: '20px', textAlign: 'left', fontSize: '0.8rem', letterSpacing: '1px', color: cellTextStyle.color }}>ORDER NO.</th>
                <th style={{ padding: '20px', textAlign: 'left', fontSize: '0.8rem', letterSpacing: '1px', color: cellTextStyle.color }}>DATE & TIME</th>
                <th style={{ padding: '20px', textAlign: 'left', fontSize: '0.8rem', letterSpacing: '1px', color: cellTextStyle.color }}>TOTAL AMOUNT</th>
                <th style={{ padding: '20px', textAlign: 'left', fontSize: '0.8rem', letterSpacing: '1px', color: cellTextStyle.color }}>STATUS</th>
                <th style={{ padding: '20px', textAlign: 'center', fontSize: '0.8rem', letterSpacing: '1px', color: cellTextStyle.color }}>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {orders.length > 0 ? orders.map((order, idx) => {
                const orderNo = `ORD-${String(order.id).padStart(3, '0')}`;
                return (
                <tr key={order.id} style={{ borderBottom: `1px solid ${theme.border}`, transition: '0.2s' }}>
                  <td style={{ padding: '20px', color: theme.text, fontWeight: 'bold' }}>
                    <span style={{ display: 'inline-block', padding: '6px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #c7a57a 0%, #a47c4f 100%)', color: theme.bg, fontWeight: 900, letterSpacing: '1px', boxShadow: '0 4px 10px rgba(196, 164, 132, 0.3)' }}>{orderNo}</span>
                  </td>
                  <td style={{ padding: '20px', color: cellTextStyle.color, fontSize: cellTextStyle.fontSize }}>
                    {order.created_at ? new Date(order.created_at).toLocaleString('en-GB') : 'N/A'}
                  </td>
                  <td style={{ padding: '20px', color: theme.primary, fontWeight: '700', fontSize: cellTextStyle.fontSize }}>
                    £{parseFloat(order.total_amount || 0).toFixed(2)}
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
                    <button onClick={() => viewOrder(order)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                      <BsEye color={theme.primary} size={20} />
                    </button>
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
    </div>
  );
};

export default Orders;