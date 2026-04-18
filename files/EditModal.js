import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateInteraction } from '../store';
import { X, Save, Loader } from 'lucide-react';

const EDITABLE_FIELDS = [
  { key: 'notes', label: 'Notes', type: 'textarea' },
  { key: 'products_discussed', label: 'Products Discussed', type: 'text' },
  { key: 'topics_discussed', label: 'Topics Discussed', type: 'text' },
  { key: 'samples_given', label: 'Samples Given', type: 'text' },
  { key: 'location', label: 'Location', type: 'text' },
  { key: 'next_steps', label: 'Next Steps', type: 'text' },
  { key: 'status', label: 'Status', type: 'select', options: ['draft', 'logged', 'reviewed'] },
];

export default function EditModal({ interactionId, onClose }) {
  const dispatch = useDispatch();
  const [field, setField] = useState('notes');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const fieldDef = EDITABLE_FIELDS.find(f => f.key === field);

  const handleSave = async () => {
    if (!value.trim()) return;
    setLoading(true);
    const r = await dispatch(updateInteraction({ id: interactionId, field, new_value: value }));
    setLoading(false);
    if (r.payload?.success) { setSuccess(true); setTimeout(() => { setSuccess(false); setValue(''); }, 2000); }
  };

  const overlayStyle = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
  };

  return (
    <div style={overlayStyle} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 28, width: 480, boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>Edit Interaction #{interactionId}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--muted2)', cursor: 'pointer' }}><X size={18} /></button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Field to Edit</label>
          <select value={field} onChange={e => { setField(e.target.value); setValue(''); }}
            style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: 13 }}>
            {EDITABLE_FIELDS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
          </select>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--muted2)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Value</label>
          {fieldDef?.type === 'textarea' ? (
            <textarea value={value} onChange={e => setValue(e.target.value)} rows={4}
              placeholder={`Enter new ${fieldDef.label}...`}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', outline: 'none', resize: 'vertical', fontSize: 13, lineHeight: 1.6 }} />
          ) : fieldDef?.type === 'select' ? (
            <select value={value} onChange={e => setValue(e.target.value)}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: 13 }}>
              <option value="">Select...</option>
              {fieldDef.options.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input value={value} onChange={e => setValue(e.target.value)} placeholder={`Enter new ${fieldDef?.label}...`}
              style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', outline: 'none', fontSize: 13 }} />
          )}
        </div>

        {success && (
          <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: 'var(--success)', fontSize: 13, fontWeight: 600 }}>
            ✓ Field updated & AI summary regenerated!
          </div>
        )}

        <button onClick={handleSave} disabled={loading || !value.trim()} style={{
          width: '100%', padding: '11px', background: loading ? 'var(--surface3)' : 'linear-gradient(135deg,#3b82f6,#6366f1)',
          border: 'none', borderRadius: 8, color: '#fff', fontWeight: 700, fontSize: 13,
          cursor: (loading || !value.trim()) ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
        }}>
          {loading ? <><Loader size={14} className="spin" /> Saving...</> : <><Save size={14} /> Save & Re-summarize</>}
        </button>
      </div>
    </div>
  );
}
