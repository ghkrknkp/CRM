import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHCPs, createInteraction, clearLastCreated, analyzeInteraction } from '../store';
import { FileText, MessageSquare, CheckCircle, Loader, Brain, Sparkles, Edit3 } from 'lucide-react';
import EditModal from '../components/EditModal';

const PRODUCTS = ['CardioMax 5mg', 'DiabeCare XR', 'NeuroShield', 'OncoPrime', 'PulmoFree'];
const TYPES = ['visit', 'call', 'email', 'conference', 'webinar'];

const inputStyle = {
  width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '10px 14px', color: 'var(--text)',
  outline: 'none', fontSize: 13, transition: 'border-color 0.15s'
};

const labelStyle = { display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };

export default function LogInteraction() {
  const dispatch = useDispatch();
  const { list: hcps } = useSelector(s => s.hcps);
  const { lastCreated } = useSelector(s => s.interactions);

  const [mode, setMode] = useState('form'); // 'form' | 'result'
  const [loading, setLoading] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const [form, setForm] = useState({
    hcp_id: '', hcp_name: '', rep_name: 'Sales Rep',
    interaction_type: 'visit', location: '',
    products_discussed: '', topics_discussed: '',
    samples_given: '', notes: ''
  });

  useEffect(() => { dispatch(fetchHCPs()); }, [dispatch]);
  useEffect(() => { if (lastCreated) dispatch(clearLastCreated()); }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleHCPChange = (e) => {
    const id = parseInt(e.target.value);
    const hcp = hcps.find(h => h.id === id);
    set('hcp_id', id);
    if (hcp) set('hcp_name', hcp.name);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.hcp_id) return alert('Please select an HCP.');
    setLoading(true);
    const result = await dispatch(createInteraction(form));
    setLoading(false);
    if (result.payload?.success) {
      setMode('result');
    }
  };

  const handleAnalyze = async () => {
    if (!lastCreated?.interaction_id) return;
    setAnalyzing(true);
    const r = await dispatch(analyzeInteraction(lastCreated.interaction_id));
    setAnalyzing(false);
    setAnalysisResult(r.payload);
  };

  const sentimentColor = (s) => {
    if (s === 'positive') return 'var(--success)';
    if (s === 'negative') return 'var(--danger)';
    return 'var(--muted2)';
  };

  if (mode === 'result' && lastCreated) {
    return (
      <div style={{ padding: '32px 36px', maxWidth: 720 }}>
        <div className="fade-in" style={{
          background: 'var(--surface)', border: '1px solid rgba(16,185,129,0.3)',
          borderRadius: 'var(--radius)', padding: 28
        }}>
          {/* Success header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={22} color="var(--success)" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Interaction Logged Successfully!</div>
              <div style={{ color: 'var(--muted2)', fontSize: 12 }}>ID #{lastCreated.interaction_id} • AI-enhanced by Groq gemma2-9b-it</div>
            </div>
          </div>

          {/* AI Summary */}
          <div style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16, marginBottom: 16, borderLeft: '3px solid var(--accent)' }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Sparkles size={12} style={{ marginRight: 4 }} /> AI Summary
            </div>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>{lastCreated.ai_summary}</p>
          </div>

          {/* Metrics row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 16 }}>
            {[
              { label: 'Sentiment', value: lastCreated.sentiment, badge: true },
              { label: 'Engagement Score', value: `${lastCreated.engagement_score?.toFixed(1)} / 10` },
              { label: 'Status', value: 'Logged' },
            ].map(m => (
              <div key={m.label} style={{ background: 'var(--surface3)', borderRadius: 8, padding: '12px 16px' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{m.label}</div>
                {m.badge
                  ? <span className={`badge badge-${lastCreated.sentiment}`}>{lastCreated.sentiment}</span>
                  : <div style={{ fontWeight: 700, fontSize: 14 }}>{m.value}</div>
                }
              </div>
            ))}
          </div>

          {/* Next steps */}
          {lastCreated.next_steps && (
            <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--warning)', marginBottom: 4 }}>Suggested Next Steps</div>
              <p style={{ fontSize: 13 }}>{lastCreated.next_steps}</p>
            </div>
          )}

          {/* Deep Analysis */}
          {analysisResult && (
            <div className="fade-in" style={{ background: 'var(--surface2)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent2)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                <Brain size={12} style={{ marginRight: 4 }} /> Deep Sentiment Analysis (llama-3.3-70b)
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Overall Sentiment</div>
                  <span className={`badge badge-${analysisResult.overall_sentiment}`}>{analysisResult.overall_sentiment}</span>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Confidence</div>
                  <div style={{ fontWeight: 700 }}>{Math.round((analysisResult.confidence || 0) * 100)}%</div>
                </div>
              </div>
              {analysisResult.key_signals && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 6 }}>Key Signals</div>
                  {analysisResult.key_signals.map((s, i) => (
                    <div key={i} style={{ fontSize: 12, color: 'var(--muted2)', padding: '3px 0' }}>• {s}</div>
                  ))}
                </div>
              )}
              {analysisResult.recommendation && (
                <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--surface3)', borderRadius: 8, fontSize: 12, color: 'var(--muted2)' }}>
                  💡 {analysisResult.recommendation}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => { setMode('form'); setAnalysisResult(null); setForm({ hcp_id: '', hcp_name: '', rep_name: 'Sales Rep', interaction_type: 'visit', location: '', products_discussed: '', topics_discussed: '', samples_given: '', notes: '' }); }}
              style={{ flex: 1, padding: '10px', background: 'var(--surface3)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontWeight: 600, fontSize: 13 }}>
              + Log Another
            </button>
            <button onClick={() => setEditOpen(true)}
              style={{ padding: '10px 18px', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, color: 'var(--accent2)', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Edit3 size={14} /> Edit
            </button>
            <button onClick={handleAnalyze} disabled={analyzing}
              style={{ padding: '10px 18px', background: 'linear-gradient(135deg,#3b82f6,#6366f1)', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, opacity: analyzing ? 0.7 : 1 }}>
              {analyzing ? <><Loader size={14} className="spin" /> Analyzing...</> : <><Brain size={14} /> Deep Analyze</>}
            </button>
          </div>
        </div>

        {editOpen && (
          <EditModal interactionId={lastCreated.interaction_id} onClose={() => setEditOpen(false)} />
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 820 }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Log HCP Interaction</h1>
        <p style={{ color: 'var(--muted2)' }}>Use the structured form to log a visit. AI will auto-generate a summary.</p>
      </div>

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, marginBottom: 24, width: 'fit-content' }}>
        {[
          { id: 'form', icon: FileText, label: 'Structured Form' },
          { id: 'chat', icon: MessageSquare, label: 'AI Chat (go to Chat tab)' },
        ].map(t => (
          <button key={t.id}
            onClick={() => { if (t.id === 'chat') window.location.href = '/chat'; }}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '8px 16px',
              borderRadius: 7, border: 'none', fontSize: 13, fontWeight: 500,
              background: mode === t.id ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'transparent',
              color: mode === t.id ? '#fff' : 'var(--muted2)',
              cursor: 'pointer', transition: 'all 0.15s'
            }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {/* Section: HCP & Basic Info */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>HCP & Visit Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Select HCP *</label>
                <select value={form.hcp_id} onChange={handleHCPChange} required style={{ ...inputStyle }}>
                  <option value="">Choose HCP...</option>
                  {hcps.map(h => <option key={h.id} value={h.id}>{h.name} — {h.specialty}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Rep Name</label>
                <input value={form.rep_name} onChange={e => set('rep_name', e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Interaction Type</label>
                <select value={form.interaction_type} onChange={e => set('interaction_type', e.target.value)} style={inputStyle}>
                  {TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Location</label>
                <input value={form.location} onChange={e => set('location', e.target.value)} placeholder="e.g., Apollo Hospitals, Chennai" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Section: Products & Discussion */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent2)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Products & Discussion</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Products Discussed</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  {PRODUCTS.map(p => (
                    <button type="button" key={p}
                      onClick={() => {
                        const current = form.products_discussed.split(',').map(x => x.trim()).filter(Boolean);
                        const idx = current.indexOf(p);
                        if (idx === -1) set('products_discussed', [...current, p].join(', '));
                        else { current.splice(idx, 1); set('products_discussed', current.join(', ')); }
                      }}
                      style={{
                        padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                        border: '1px solid', cursor: 'pointer',
                        background: form.products_discussed.includes(p) ? 'rgba(59,130,246,0.15)' : 'transparent',
                        borderColor: form.products_discussed.includes(p) ? 'rgba(59,130,246,0.4)' : 'var(--border)',
                        color: form.products_discussed.includes(p) ? 'var(--accent)' : 'var(--muted2)',
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
                <input value={form.products_discussed} onChange={e => set('products_discussed', e.target.value)}
                  placeholder="Or type manually..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Topics Discussed</label>
                <input value={form.topics_discussed} onChange={e => set('topics_discussed', e.target.value)}
                  placeholder="e.g., Clinical efficacy, Side effects, Pricing..." style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Samples Given</label>
                <input value={form.samples_given} onChange={e => set('samples_given', e.target.value)}
                  placeholder="e.g., CardioMax 5mg x 5 units" style={inputStyle} />
              </div>
            </div>
          </div>

          {/* Section: Notes */}
          <div style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <Sparkles size={12} style={{ marginRight: 4 }} /> Notes (AI will summarize)
            </div>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)}
              rows={4} placeholder="Write your notes about the interaction, HCP's feedback, objections, interest level..."
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }} />
            <div style={{ marginTop: 8, fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
              <Brain size={12} /> Groq gemma2-9b-it will auto-generate an AI summary, sentiment & engagement score
            </div>
          </div>
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} style={{
          marginTop: 16, width: '100%', padding: '14px', fontSize: 14, fontWeight: 700,
          background: loading ? 'var(--surface3)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
          border: 'none', borderRadius: 10, color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          transition: 'opacity 0.15s'
        }}>
          {loading ? (
            <><Loader size={16} className="spin" /> AI is processing your interaction...</>
          ) : (
            <><Sparkles size={16} /> Log Interaction with AI Enhancement</>
          )}
        </button>
      </form>
    </div>
  );
}
