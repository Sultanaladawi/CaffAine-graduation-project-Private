import { useState, useRef, useEffect } from 'react';
import { shopInfo, sophieKnowledge } from '../data/shopData';
import styles from './Chatbot.module.css';

const GITHUB_API_KEY = process.env.REACT_APP_GITHUB_AI_KEY;
const GITHUB_URL     = 'https://models.inference.ai.azure.com/chat/completions';

const SYSTEM_PROMPT = `
You are Sophie, the friendly barista bot for Faculty Coffee, Birmingham.
Your personality: warm, casual, helpful. Use ☕ 🌿 ☀️. Keep replies under 140 words.
Knowledge Base:
- Location: 14 Piccadilly Arcade, Birmingham.
- Hours: Mon-Fri 07:30-17:00, Sat 09:00-18:00, Sun 10:00-16:00.
- Specialties: Flat White (£3.60), V60 Pour-Over (£4.50), Iced Latte (£4.20).
- Best for: Studying (weekday mornings), Dates (afternoons), Hangouts (weekends).
- Careers: Apply via careers@facultycoffee.co.uk.
- Rules: Only discuss Faculty Coffee, coffee culture, and nutrition. Redirect other topics.
`;

async function callAI(userMsg) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s timeout

  try {
    const res = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMsg }),
      signal: controller.signal
    });

    if (!res.ok) throw new Error('AI service error');
    const data = await res.json();
    return data.reply || "I'm a bit stuck! Reach us at hello@facultycoffee.co.uk ☕";
  } catch (err) {
    if (err.name === 'AbortError') {
      console.warn("[Chatbot] Request timed out");
      return "I'm taking a bit too long to think! Could you try again? ☕";
    }
    console.error("[Chatbot] AI Call Failed:", err);
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

const WELCOME = [
  { id: 'w1', role: 'sophie', text: sophieKnowledge.greeting },
  { id: 'w2', role: 'sophie', text: sophieKnowledge.followUp },
];

export default function Chatbot() {
  const [open, setOpen]           = useState(false);
  const [msgs, setMsgs]           = useState(WELCOME);
  const [input, setInput]         = useState('');
  const [typing, setTyping]       = useState(false);
  const [unread, setUnread]       = useState(true);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [voiceLang, setVoiceLang] = useState('en-GB'); // 'en-GB' or 'ar-SA'
  const endRef         = useRef(null);
  const inputRef       = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);
  useEffect(() => {
    if (open) { setUnread(false); setTimeout(() => inputRef.current?.focus(), 300); }
    else { stopSpeech(); } // Stop talking if window closed
  }, [open]);

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, []);

  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Please try Chrome.');
      return;
    }

    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = voiceLang;  // 'en-GB' or 'ar-SA'
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setListening(true);
    recognition.onend   = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognition.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map(r => r[0].transcript)
        .join('');
      
      // Clean transcript: remove punctuation for better processing
      const cleanTranscript = transcript.replace(/[.,]/g, '').trim();
      setInput(cleanTranscript);
      
      // Auto-send when speech is final
      if (e.results[e.results.length - 1].isFinal) {
        setTimeout(() => send(cleanTranscript), 300);
      }
    };

    recognition.start();
  };

  const stopSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
    }
  };

  const speakText = (text) => {
    if (!window.speechSynthesis || !text) return;
    try {
      window.speechSynthesis.cancel(); 
      const utterance = new SpeechSynthesisUtterance(String(text));
      utterance.lang = voiceLang;
      utterance.onstart = () => setSpeaking(true);
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("Speech synthesis error:", e);
      setSpeaking(false);
    }
  };

  const send = async (text) => {
    const t = text.trim();
    if (!t || typing) return;

    const userMsg = { id: Date.now(), role: 'user', text: t };
    setMsgs(p => [...p, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const reply = await callAI(t);
      const aiMsg = { id: Date.now() + 1, role: 'sophie', text: reply };
      setMsgs(prev => [...prev, aiMsg]);
      speakText(reply);
      
      console.log('[Chatbot] Syncing message to DB...');
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_msg: t, ai_msg: reply })
      })
      .then(r => r.json())
      .then(data => console.log('[Chatbot] Sync Success:', data))
      .catch(err => console.error("[Chatbot] Sync Error:", err));

    } catch {
      setMsgs(p => [...p, { id: Date.now() + 1, role: 'sophie', text: `Sorry, I'm having trouble. Email us at ${shopInfo.email} ☕` }]);
    } finally {
      setTyping(false);
    }
  };

  const onKey = e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } };

  return (
    <>
      <div className={`${styles.window} ${open ? styles.open : ''}`} role="dialog">
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <div className={styles.avatar}>
              <i className="fas fa-mug-hot" />
              <span className={styles.dot} />
            </div>
            <div>
              <div className={styles.name}>Sophie</div>
              <div className={styles.status}>Faculty Coffee · Barista Bot</div>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close">
            <i className="fas fa-times" />
          </button>
        </div>

        <div className={styles.messages}>
          {msgs.map(m => (
            <div key={m.id} className={`${styles.msg} ${m.role === 'user' ? styles.userMsg : styles.sophieMsg}`}>
              {m.role === 'sophie' && <div className={styles.msgAvatar}><i className="fas fa-mug-hot" /></div>}
              <div className={styles.bubble}>
                {m.text}
                {m.role === 'sophie' && (
                  <div style={{ textAlign: 'left' }}>
                    <button 
                      onClick={() => speaking ? stopSpeech() : speakText(m.text)}
                      title={speaking ? (voiceLang === 'ar-SA' ? 'إيقاف' : 'Stop') : (voiceLang === 'ar-SA' ? 'استمع للرسالة' : 'Listen to message')}
                      className={styles.listenBtn}
                      style={speaking ? { background: 'rgba(255, 77, 77, 0.2)', color: '#ff4d4d' } : {}}
                    >
                      <i className={`fas ${speaking ? 'fa-stop-circle' : 'fa-volume-up'}`} /> 
                      {speaking ? (voiceLang === 'ar-SA' ? ' إيقاف' : ' Stop') : (voiceLang === 'ar-SA' ? ' استمع' : ' Listen')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {typing && (
            <div className={`${styles.msg} ${styles.sophieMsg}`}>
              <div className={styles.msgAvatar}><i className="fas fa-mug-hot" /></div>
              <div className={`${styles.bubble} ${styles.typing}`}><span /><span /><span /></div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {msgs.length === WELCOME.length && (
          <div className={styles.quickReplies}>
            {sophieKnowledge.quickReplies.map(q => (
              <button key={q} className={styles.chip} onClick={() => send(q)}>{q}</button>
            ))}
          </div>
        )}

        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            type="text"
            placeholder={listening
              ? (voiceLang === 'ar-SA' ? '🎙️ جاري الاستماع...' : '🎙️ Listening...')
              : (voiceLang === 'ar-SA' ? 'اسألي صوفي...' : 'Ask Sophie anything...')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={typing}
            style={listening ? { borderColor: '#ff4d4d', boxShadow: '0 0 0 2px rgba(255,77,77,0.15)' } : {}}
          />
          
          <div className={styles.actionGroup}>
            {/* Language Toggle */}
            <button
              onClick={() => setVoiceLang(v => v === 'en-GB' ? 'ar-SA' : 'en-GB')}
              disabled={listening || typing}
              title={voiceLang === 'ar-SA' ? 'Switch to English' : 'التبديل إلى العربية'}
              className={styles.langBtn}
            >
              {voiceLang === 'ar-SA' ? 'SA AR' : 'GB EN'}
            </button>

            {/* Microphone Button */}
            <button
              className={styles.micBtn}
              onClick={startVoice}
              disabled={typing}
              title={listening ? 'Stop recording' : 'Speak to Sophie'}
              style={{
                background: listening
                  ? 'linear-gradient(135deg, #ff4d4d, #cc0000)'
                  : 'linear-gradient(135deg, #8c6a56, #5a3500)',
                animation: listening ? 'micPulse 1.2s infinite' : 'none',
              }}
            >
              <i className={`fas ${listening ? 'fa-stop' : 'fa-microphone'}`} />
            </button>

            {/* Send Button */}
            <button className={styles.sendBtn} onClick={() => send(input)} disabled={!input.trim() || typing}>
              <i className="fas fa-arrow-right" />
            </button>
          </div>
        </div>
      </div>

      <button className={`${styles.fab} ${open ? styles.fabOpen : ''}`} onClick={() => setOpen(v => !v)}>
        {open ? <i className="fas fa-times" /> : <i className="fas fa-mug-hot" />}
        {unread && !open && <span className={styles.badge}>1</span>}
      </button>
    </>
  );
}