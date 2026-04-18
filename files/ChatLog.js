import React, { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendChatMessage, addUserMessage, clearChat } from '../store';
import { Send, Bot, User, Loader, Trash2, Wrench, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  "Log a visit with Dr. Priya Sharma about CardioMax",
  "Search for cardiologists in my territory",
  "Schedule a follow-up for interaction #1 due next Monday",
  "Analyze the sentiment of interaction #1",
  "Edit the notes of interaction #1",
];

export default function ChatLog() {
  const dispatch = useDispatch();
  const { messages, loading } = useSelector(s => s.chat);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const history = messages.map(m => ({ role: m.role, content: m.content }));

  const handleSend = async (msg) => {
    const text = (msg || input).trim();
    if (!text) return;
    setInput('');
    dispatch(addUserMessage(text));
    dispatch(sendChatMessage({ message: text, history }));
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100vh' }}>
      {/* Header */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15 }}>AI HCP Assistant</div>
            <div style={{ fontSize: 11, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
              LangGraph + Groq gemma2-9b-it • 5 tools active
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => dispatch(clearChat())} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', color: 'var(--muted)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trash2 size={13} /> Clear
          </button>
        )}
      </div>

      {/* Tool chips */}
      <div style={{ padding: '10px 28px', background: 'var(--surface2)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0, overflowX: 'auto' }}>
        {['log_interaction', 'edit_interaction', 'search_hcp', 'schedule_followup', 'analyze_sentiment'].map(t => (
          <span key={t} style={{ padding: '3px 10px', borderRadius: 99, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--accent2)', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Wrench size={10} /> {t}
          </span>
        ))}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Sparkles size={28} color="var(--accent)" />
            </div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>Talk to your AI CRM</div>
            <div style={{ color: 'var(--muted2)', fontSize: 13, marginBottom: 24 }}>Log interactions, search HCPs, schedule follow-ups — all via natural language.</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 560, margin: '0 auto' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => handleSend(s)} style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px', color: 'var(--muted2)',
                  fontSize: 12, cursor: 'pointer', textAlign: 'left', lineHeight: 1.5,
                  transition: 'border-color 0.15s, color 0.15s'
                }}
                  onMouseEnter={e => { e.target.style.borderColor = 'rgba(99,102,241,0.4)'; e.target.style.color = 'var(--text)'; }}
                  onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted2)'; }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className="fade-in" style={{ display: 'flex', gap: 12, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'var(--surface2)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              {msg.role === 'user' ? <User size={15} color="#fff" /> : <Bot size={15} color="var(--accent)" />}
            </div>
            <div style={{ maxWidth: '75%' }}>
              <div style={{
                background: msg.role === 'user' ? 'linear-gradient(135deg,rgba(59,130,246,0.2),rgba(99,102,241,0.2))' : 'var(--surface)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(99,102,241,0.25)' : 'var(--border)'}`,
                borderRadius: 12, padding: '12px 16px', fontSize: 13, lineHeight: 1.7,
                whiteSpace: 'pre-wrap'
              }}>
                {msg.content}
              </div>
              {/* Tool calls */}
              {msg.tool_calls && msg.tool_calls.length > 0 && (
                <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {msg.tool_calls.map((tc, j) => (
                    <span key={j} style={{ padding: '2px 8px', borderRadius: 99, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: 'var(--success)', fontSize: 11, fontWeight: 600 }}>
                      ✓ {tc.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="fade-in" style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={15} color="var(--accent)" />
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 16px' }}>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
              </div>
              <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-6px)} }`}</style>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '16px 28px', borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask the AI to log an interaction, search for an HCP, schedule a follow-up..."
            rows={2}
            style={{
              flex: 1, background: 'var(--surface2)', border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 14px', color: 'var(--text)',
              outline: 'none', resize: 'none', fontSize: 13, lineHeight: 1.6
            }}
          />
          <button onClick={() => handleSend()} disabled={loading || !input.trim()} style={{
            width: 44, height: 44, borderRadius: 10, border: 'none', alignSelf: 'flex-end',
            background: (loading || !input.trim()) ? 'var(--surface3)' : 'linear-gradient(135deg,#3b82f6,#6366f1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: (loading || !input.trim()) ? 'not-allowed' : 'pointer'
          }}>
            {loading ? <Loader size={16} className="spin" color="#fff" /> : <Send size={16} color="#fff" />}
          </button>
        </div>
        <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
          Enter to send • Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
