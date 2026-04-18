import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHCPs } from '../store';
import { Search, MapPin, Stethoscope, Building2, Phone } from 'lucide-react';

export default function HCPList() {
  const dispatch = useDispatch();
  const { list, loading } = useSelector(s => s.hcps);
  const [q, setQ] = useState('');

  useEffect(() => { dispatch(fetchHCPs()); }, [dispatch]);

  const filtered = list.filter(h =>
    !q || h.name.toLowerCase().includes(q.toLowerCase()) ||
    (h.specialty || '').toLowerCase().includes(q.toLowerCase()) ||
    (h.hospital || '').toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Healthcare Professionals</h1>
          <p style={{ color: 'var(--muted2)' }}>{list.length} HCPs in your territory</p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search HCPs..."
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 8, padding: '9px 14px 9px 34px',
              color: 'var(--text)', outline: 'none', width: 220, fontSize: 13,
            }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>Loading HCPs...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: 16 }}>
          {filtered.map(hcp => (
            <div key={hcp.id} className="fade-in" style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: 20, cursor: 'pointer',
              transition: 'border-color 0.15s, transform 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%',
                    background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0
                  }}>
                    {hcp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{hcp.name}</div>
                    <div style={{ color: 'var(--muted2)', fontSize: 12 }}>{hcp.specialty}</div>
                  </div>
                </div>
                <span className={`badge badge-${hcp.tier}`}>Tier {hcp.tier}</span>
              </div>

              {/* Details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted2)', fontSize: 12 }}>
                  <Building2 size={13} /> {hcp.hospital}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted2)', fontSize: 12 }}>
                  <MapPin size={13} /> {hcp.city}, {hcp.state}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--muted2)', fontSize: 12 }}>
                  <Phone size={13} /> {hcp.phone}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
