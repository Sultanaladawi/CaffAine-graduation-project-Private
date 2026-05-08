import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BsSendFill, BsTrash, BsCpu, BsPerson, BsMicFill } from 'react-icons/bs';
import { BrainCircuit, Volume2, Square } from 'lucide-react';

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
  const [liveStats, setLiveStats] = useState({ todaySales: 0, todayOrders: 0 });
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState(null);
  const [micLang, setMicLang] = useState('ar-SA');
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
      
      const statsRes = await axios.get('/api/dashboard-stats');
      const d = statsRes.data.data || statsRes.data;
      setLiveStats({
        todaySales: d.todaySales || 0,
        todayOrders: d.todayOrders || 0
      });
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
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  const toggleSpeech = (id, text) => {
    if (speakingId === id) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
    } else {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const isArabic = /[\u0600-\u06FF]/.test(text);
      utterance.lang = isArabic ? 'ar-SA' : 'en-US';

      const voices = window.speechSynthesis.getVoices();
      let bestVoice = null;

      if (isArabic) {
        // Look for premium online/cloud Arabic voices, or specific high-quality local ones
        bestVoice = voices.find(v => v.lang.includes('ar') && (v.name.includes('Online') || v.name.includes('Google') || v.name.includes('Microsoft Naayf') || v.name.includes('Microsoft Hoda')));
        if (!bestVoice) bestVoice = voices.find(v => v.lang.includes('ar'));
      } else {
        bestVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Online') || v.name.includes('Google') || v.name.includes('Microsoft Zira') || v.name.includes('Samantha')));
        if (!bestVoice) bestVoice = voices.find(v => v.lang.includes('en'));
      }

      if (bestVoice) {
        utterance.voice = bestVoice;
      }

      // Small tweaks to make the voice sound more natural and less fuzzy
      utterance.rate = 1.05; 
      utterance.pitch = 1.1; 

      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      window.speechSynthesis.speak(utterance);
      setSpeakingId(id);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = { id: Date.now(), type: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    const sentMessage = input;
    setInput("");

    // Show typing indicator
    const typingId = Date.now() + 1;
    setMessages(prev => [...prev, { id: typingId, type: 'bot', text: '...' }]);

    try {
      const chatHistory = messages.slice(-10).map(m => ({ role: m.type === 'user' ? 'user' : 'assistant', content: m.text }));
      // Increased to 120 seconds to guarantee no aborted requests
      const response = await axios.post('/api/ai-chat', { message: sentMessage, isAdmin: true, history: chatHistory }, {
        timeout: 120000 
      });
      setMessages(prev => prev.filter(m => m.id !== typingId));
      const botMsg = { id: Date.now() + 2, type: 'bot', text: response.data.reply };
      setMessages(prev => [...prev, botMsg]);

      // Save to admin logs
      axios.post('/api/ai-assistant-logs', { 
        admin_query: sentMessage, 
        ai_response: response.data.reply 
      }).catch(err => console.error("Log Error:", err));

    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== typingId));
      if (error.code === 'ECONNABORTED') {
        setMessages(prev => [...prev, { id: Date.now()+1, type: 'bot', text: "عذراً، السيرفر مشغول حالياً بتحليل كمية بيانات ضخمة، يرجى المحاولة بعد قليل." }]);
      } else {
        setMessages(prev => [...prev, { id: Date.now()+1, type: 'bot', text: "Connection error. Please check that the server and database are running." }]);
      }
    }
  };

  // Voice Recognition Logic (Web Speech API)
  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Your browser does not support speech recognition. Please use Google Chrome or Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = micLang;
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev + (prev ? ' ' : '') + transcript);
    };

    recognition.onerror = (event) => console.error("Speech recognition error", event.error);
    
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  return (
    <div className="dashboard-fade-in" style={{ 
      color: theme.latte, 
      backgroundColor: theme.espresso, 
      minHeight: '100vh', 
      padding: '40px 10px 40px 5px',
      position: 'relative',
      display: 'flex', gap: '25px'
    }}>
      {/* Premium Background Elements */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: `radial-gradient(circle at 50% -20%, #2a1b10 0%, #070504 70%)` }} />
        <div className="orb orb-1" />
        <div className="orb orb-2" />
      </div>
      <style>{`
        .orb { position: absolute; border-radius: 50%; filter: blur(100px); z-index: 0; opacity: 0.05; animation: float 25s infinite alternate ease-in-out; }
        .orb-1 { width: 600px; height: 600px; background: ${theme.crema}; top: -200px; right: -100px; }
        .orb-2 { width: 500px; height: 500px; background: #2a1b10; bottom: -100px; left: -100px; }
        @keyframes float { 0% { transform: translate(0, 0) scale(1); } 100% { transform: translate(50px, 50px) scale(1.1); } }
        .page-badge { background: #1b130e; border: 1px solid ${theme.border}; padding: 12px 25px; border-radius: 18px; display: inline-flex; align-items: center; gap: 12px; margin: 20px 0; }
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
      
      <div style={{ position: 'relative', zIndex: 1, flex: 2, display: 'flex', flexDirection: 'column' }}>
        <header style={{ borderBottom: `1px dashed ${theme.border}`, paddingBottom: '20px', marginBottom: '25px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: '2.8rem', color: theme.crema, lineHeight: 1 }}>
              Faculty <span style={{ color: '#fff', fontStyle: 'italic' }}>Coffee.</span>
            </div>
            <div className="page-badge">
              <BrainCircuit size={28} color={theme.crema} />
              <span>AI Intelligence</span>
            </div>
            
            {/* Real-time Summary Cards */}
            <div style={{ display: 'flex', gap: '15px', marginTop: '15px' }}>
              <div style={{ background: 'rgba(56, 239, 125, 0.05)', border: '1px solid rgba(56, 239, 125, 0.15)', padding: '10px 20px', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.6rem', color: '#38ef7d', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Today's Revenue</div>
                <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '900' }}>£{parseFloat(liveStats.todaySales || 0).toFixed(2)}</div>
              </div>
              <div style={{ background: 'rgba(79, 172, 254, 0.05)', border: '1px solid rgba(79, 172, 254, 0.15)', padding: '10px 20px', borderRadius: '14px' }}>
                <div style={{ fontSize: '0.6rem', color: '#4facfe', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Today's Orders</div>
                <div style={{ fontSize: '1.2rem', color: '#fff', fontWeight: '900' }}>{liveStats.todayOrders || 0}</div>
              </div>
            </div>
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
                <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                
                {msg.type === 'bot' && msg.text !== '...' && (
                  <button 
                    onClick={() => toggleSpeech(msg.id, msg.text)}
                    style={{
                      marginTop: '10px', background: 'transparent', border: 'none', 
                      color: speakingId === msg.id ? '#e74a3b' : theme.crema, 
                      cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px',
                      fontSize: '0.8rem', padding: '4px 8px', borderRadius: '8px',
                      transition: '0.3s', backgroundColor: 'rgba(255,255,255,0.05)'
                    }}
                    title={speakingId === msg.id ? "Stop reading" : "Listen to response"}
                  >
                    {speakingId === msg.id ? <Square size={14} /> : <Volume2 size={14} />}
                    {speakingId === msg.id ? 'Stop' : 'Listen'}
                  </button>
                )}

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
          <button 
            onClick={() => setMicLang(prev => prev === 'ar-SA' ? 'en-US' : 'ar-SA')}
            style={{
              background: 'transparent', border: `1px solid ${theme.border}`, 
              color: theme.crema, width: '50px', height: '50px', borderRadius: '14px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: '900', transition: 'all 0.3s'
            }}
            title="Toggle Mic Language"
          >
            {micLang === 'ar-SA' ? 'AR' : 'EN'}
          </button>
          <button 
            onClick={toggleListening} 
            style={{ 
              background: isListening ? 'rgba(231, 74, 59, 0.2)' : 'transparent', 
              border: `1px solid ${isListening ? '#e74a3b' : theme.border}`, 
              width: '50px', height: '50px', borderRadius: '14px', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.3s'
            }}
            title={isListening ? "Listening... Click to stop" : "Use Voice Typing"}
          >
            <BsMicFill color={isListening ? "#e74a3b" : theme.crema} size={20} className={isListening ? "animate-pulse" : ""} />
          </button>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none', padding: '10px', resize: 'none', fontSize: '0.95rem' }} placeholder="Ask about sales, stock or trends..." />
          <button onClick={handleSend} style={{ background: theme.crema, border: 'none', width: '50px', height: '50px', borderRadius: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BsSendFill color={theme.espresso} size={20} />
          </button>
        </div>
      </div>

      <div style={{ 
        position: 'sticky', 
        top: '40px', 
        zIndex: 1, 
        flex: 1, 
        height: 'calc(100vh - 80px)', // Fixed height based on viewport
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '20px', 
        border: `1px solid rgba(255,255,255,0.06)`, 
        backdropFilter: 'blur(10px)', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden', 
        boxShadow: '0 20px 40px rgba(0,0,0,0.4)' 
      }}>
        <style>{`
          @keyframes pulse-mic { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.7; } 100% { transform: scale(1); opacity: 1; } }
          .animate-pulse { animation: pulse-mic 1.5s infinite; }
        `}</style>
        <div style={{ padding: '20px', borderBottom: `1px solid ${theme.border}`, background: 'rgba(255,255,255,0.02)' }}>
          <h3 style={{ color: theme.crema, margin: 0, fontSize: '1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Customer Queries</h3>
          <p style={{ color: theme.latte, fontSize: '0.7rem', margin: '5px 0 0', opacity: 0.7 }}>Live logs from Client Chatbot</p>
        </div>
        <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '15px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <style>{`
            .custom-scrollbar::-webkit-scrollbar { width: 4px; }
            .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
            .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme.border}; border-radius: 10px; }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: ${theme.crema}; }
          `}</style>
          {customerQueries.length === 0 ? (
            <div style={{ color: '#444', textAlign: 'center', marginTop: '50px', fontSize: '0.9rem' }}>No recent inquiries</div>
          ) : (
            customerQueries.map(q => (
              <div key={q.id} className="premium-row" style={{ padding: '15px', background: 'rgba(0,0,0,0.3)', borderRadius: '12px', border: `1px solid ${theme.border}` }}>
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
