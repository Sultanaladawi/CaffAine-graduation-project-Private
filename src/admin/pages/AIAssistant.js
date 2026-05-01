import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BsSendFill, BsTrash, BsCpu, BsPerson } from 'react-icons/bs';
import { BrainCircuit } from 'lucide-react';

const AIAssistant = () => {
  const [messages, setMessages] = useState([
    { 
      id: 1, type: 'bot', 
      text: "Welcome back, Admin. I'm your Faculty Coffee AI, now synced with your live data. How can I help you analyze the business today?",
      metrics: { status: "Active", db: "Connected" }
    }
  ]);
  const [input, setInput] = useState("");
  const [customerQueries, setCustomerQueries] = useState([]);
  const chatEndRef = useRef(null);

  const theme = {
    espresso: 'var(--admin-bg)', 
    bean: 'var(--admin-card)',
    crema: 'var(--admin-accent)',
    latte: 'var(--admin-text)',
    border: 'var(--admin-border)'
  };

  const fetchCustomerQueries = async () => {
    try {
      const res = await axios.get('/api/messages');
      setCustomerQueries(res.data);
    } catch (err) {
      console.error("Fetch Queries Error:", err);
    }
  };

  useEffect(() => {
    fetchCustomerQueries();
    const interval = setInterval(fetchCustomerQueries, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    try {
      const response = await axios.get('/api/dashboard-stats'); 
      const stats = response.data.data;

      let reply = "";
      const lowerInput = input.toLowerCase();
      
      if (lowerInput.includes('sale') || lowerInput.includes('revenue')) {
        reply = `Revenue analysis complete: £${parseFloat(stats.totalSales).toFixed(2)}. The business is performing well.`;
      } else if (lowerInput.includes('order')) {
        reply = `Order volume: ${stats.totalOrders} total transactions recorded.`;
      } else if (lowerInput.includes('inventory') || lowerInput.includes('stock')) {
        reply = stats.lowStock > 0 
          ? `Inventory Alert: ${stats.lowStock} items are low. Visit the Inventory page for details.`
          : `Inventory check complete. All stock levels are healthy.`;
      } else {
        reply = `Quick Summary: ${stats.totalProducts} products, ${stats.totalOrders} orders, and £${parseFloat(stats.totalSales).toFixed(0)} total sales.`;
      }

      const botMsg = { 
        id: Date.now() + 1, type: 'bot', 
        text: reply,
        metrics: { 
          SALES: `£${Math.floor(stats.totalSales)}`, 
          ORDERS: stats.totalOrders, 
          ITEMS: stats.totalProducts 
        }
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      setMessages(prev => [...prev, { id: Date.now()+1, type: 'bot', text: "Database sync interrupted. Check server status." }]);
    }
  };

  return (
    <div style={{ backgroundColor: theme.espresso, minHeight: '80vh', padding: '30px', display: 'flex', gap: '25px', borderRadius: '20px' }}>
      
      <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
        <header style={{ borderBottom: `1px solid ${theme.border}`, paddingBottom: '20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ 
              fontFamily: "'DM Serif Display', serif", 
              fontSize: '1.8rem', 
              color: theme.crema, 
              lineHeight: '1',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              marginBottom: '15px'
            }}>
              Faculty<span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
            </div>
            <h1 style={{ color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '15px', fontSize: '1.8rem', fontWeight: '800', fontFamily: "'DM Serif Display', serif" }}>
              <BrainCircuit color={theme.crema} size={32} /> AI Intelligence
            </h1>
            <p style={{ color: theme.crema, fontSize: '0.8rem', margin: '5px 0 0', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 'bold' }}>
              Real-time Business Analysis
            </p>
          </div>
          <button onClick={() => setMessages([])} style={{ background: 'transparent', border: `1px solid ${theme.border}`, color: '#666', padding: '8px 18px', borderRadius: '10px', cursor: 'pointer' }}>
            <BsTrash /> Clear Logs
          </button>
        </header>

        <div style={{ flex: 1, background: theme.bean, borderRadius: '20px', border: `1px solid ${theme.border}`, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '480px' }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display: 'flex', gap: '12px', alignSelf: msg.type === 'user' ? 'flex-end' : 'flex-start', flexDirection: msg.type === 'user' ? 'row-reverse' : 'row', maxWidth: '85%' }}>
              <div style={{ background: msg.type === 'user' ? theme.border : theme.crema, width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {msg.type === 'user' ? <BsPerson color={theme.crema} size={20} /> : <BsCpu color={theme.espresso} size={20} />}
              </div>
              <div style={{ background: msg.type === 'user' ? theme.crema : theme.espresso, color: msg.type === 'user' ? theme.espresso : theme.latte, padding: '15px 20px', borderRadius: '18px', border: `1px solid ${theme.border}` }}>
                <div style={{ fontSize: '0.95rem' }}>{msg.text}</div>
                {msg.metrics && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginTop: '15px', borderTop: `1px solid ${theme.border}`, paddingTop: '12px' }}>
                    {Object.entries(msg.metrics).map(([k, v]) => (
                      <div key={k} style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: '1rem', fontWeight: '900', color: theme.crema }}>{v}</span>
                        <span style={{ fontSize: '0.6rem', opacity: 0.6, textTransform: 'uppercase', color: theme.latte }}>{k}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div style={{ marginTop: '20px', display: 'flex', gap: '12px', background: theme.bean, padding: '12px', borderRadius: '18px', border: `1px solid ${theme.border}` }}>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', padding: '10px', resize: 'none', fontSize: '0.95rem' }} placeholder="Ask about sales, stock or trends..." />
          <button onClick={handleSend} style={{ background: theme.crema, border: 'none', width: '50px', height: '50px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BsSendFill color={theme.espresso} size={20} />
          </button>
        </div>
      </div>

      <div style={{ flex: 1, background: theme.bean, borderRadius: '20px', border: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ color: theme.crema, margin: 0, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer Queries</h3>
          <p style={{ color: theme.latte, fontSize: '0.7rem', margin: '5px 0 0', opacity: 0.7 }}>Live logs from Client Chatbot</p>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {customerQueries.length === 0 ? (
            <div style={{ color: '#444', textAlign: 'center', marginTop: '50px', fontSize: '0.9rem' }}>No recent inquiries</div>
          ) : (
            customerQueries.map(q => (
              <div key={q.id} style={{ padding: '15px', background: theme.espresso, borderRadius: '12px', border: `1px solid ${theme.border}` }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '8px' }}>
                  <div style={{ background: theme.border, width: '24px', height: '24px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BsPerson size={14} color={theme.crema} />
                  </div>
                  <span style={{ color: theme.crema, fontSize: '0.85rem', fontWeight: 'bold' }}>Customer</span>
                </div>
                <p style={{ color: theme.latte, fontSize: '0.85rem', margin: '0 0 10px 0', paddingLeft: '34px' }}>{q.user_msg}</p>
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '12px', borderTop: `1px dotted ${theme.border}`, paddingTop: '10px' }}>
                  <div style={{ background: theme.crema, width: '24px', height: '24px', borderRadius: '5px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <BsCpu size={14} color={theme.espresso} />
                  </div>
                  <span style={{ color: theme.latte, fontSize: '0.75rem', fontStyle: 'italic' }}>Sophie's Reply:</span>
                </div>
                <p style={{ color: theme.latte, fontSize: '0.8rem', margin: '5px 0 0', paddingLeft: '34px', opacity: 0.8 }}>{q.ai_msg}</p>
                <div style={{ fontSize: '0.6rem', color: '#444', textAlign: 'right', marginTop: '8px' }}>
                  {new Date(q.created_at).toLocaleString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
