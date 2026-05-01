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

async function callAI(userMsg, history) {
  if (!GITHUB_API_KEY) throw new Error('API key missing');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...history.map(m => ({
      role: m.role === 'sophie' ? 'assistant' : 'user',
      content: m.text,
    })),
    { role: 'user', content: userMsg },
  ];

  const res = await fetch(GITHUB_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GITHUB_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      temperature: 0.75,
      max_tokens: 300,
    }),
  });

  if (!res.ok) throw new Error('AI service error');
  const data = await res.json();
  return data.choices?.[0]?.message?.content || "I'm a bit stuck! Reach us at hello@facultycoffee.co.uk ☕";
}

const WELCOME = [
  { id: 'w1', role: 'sophie', text: sophieKnowledge.greeting },
  { id: 'w2', role: 'sophie', text: sophieKnowledge.followUp },
];

export default function Chatbot() {
  const [open, setOpen]     = useState(false);
  const [msgs, setMsgs]     = useState(WELCOME);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(true);
  const endRef   = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs, typing]);
  useEffect(() => {
    if (open) { setUnread(false); setTimeout(() => inputRef.current?.focus(), 300); }
  }, [open]);

  const send = async (text) => {
    const t = text.trim();
    if (!t || typing) return;

    const userMsg = { id: Date.now(), role: 'user', text: t };
    setMsgs(p => [...p, userMsg]);
    setInput('');
    setTyping(true);

    try {
      const history = msgs.filter(m => m.id !== 'w1' && m.id !== 'w2');
      const reply = await callAI(t, history);
      setMsgs(p => [...p, { id: Date.now() + 1, role: 'sophie', text: reply }]);
      
      fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_msg: t, ai_msg: reply })
      }).catch(err => console.error("Sync Error:", err));

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
              <div className={styles.bubble}>{m.text}</div>
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
            placeholder="Ask Sophie anything..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            disabled={typing}
          />
          <button className={styles.sendBtn} onClick={() => send(input)} disabled={!input.trim() || typing}>
            <i className="fas fa-arrow-right" />
          </button>
        </div>
      </div>

      <button className={`${styles.fab} ${open ? styles.fabOpen : ''}`} onClick={() => setOpen(v => !v)}>
        {open ? <i className="fas fa-times" /> : <i className="fas fa-mug-hot" />}
        {unread && !open && <span className={styles.badge}>1</span>}
      </button>
    </>
  );
}