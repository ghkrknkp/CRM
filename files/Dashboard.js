import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDashboard } from '../store';
import { TrendingUp, Users, FileText, Clock, Activity, ChevronRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div style={{
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '20px 24px',
    display: 'flex', alignItems: 'flex-start', gap: 16,
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 10, flexShrink: 0,
      background: `${color}18`,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <Icon size={20} color={color} />
    </div>
    <div>
      <div style={{ color: 'var(--muted2)', fontSize: 12, fontWeight: 500, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ color: 'var(--muted)', fontSize: 12, marginTop: 4 }}>{sub}</div>}
    </div>
  </div>
);

const sentimentColor = (s) => {
  if (s === 'positive') return 'var(--success)';
  if (s === 'negative') return 'var(--danger)';
  return 'var(--muted2)';
};

export default function Dashboard() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector(s => s.dashboard);

  useEffect(() => { dispatch(fetchDashboard()); }, [dispatch]);

  if (loading || !data) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spin" style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--accent)', borderRadius: '50%', margin: '0 auto 12px' }} />
        <div style={{ color: 'var(--muted)' }}>Loading dashboard...</div>
      </div>
    </div>
  );

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Good morning, Sales Rep 👋</h1>
        <p style={{ color: 'var(--muted2)' }}>Here's your HCP activity overview for Chennai Region.</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard icon={FileText} label="Total Interactions" value={data.total_interactions} sub="All time" color="#3b82f6" />
        <StatCard icon={Users} label="Total HCPs" value={data.total_hcps} sub="In your territory" color="#6366f1" />
        <StatCard icon={TrendingUp} label="Positive Sentiment" value={`${data.positive_sentiment_pct}%`} sub="Of all interactions" color="#10b981" />
        <StatCard icon={Clock} label="Pending Follow-Ups" value={data.pending_followups} sub="Need attention" color="#f59e0b" />
      </div>

      {/* Recent Interactions */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={16} color="var(--accent)" />
            <span style={{ fontWeight: 700, fontSize: 14 }}>Recent Interactions</span>
          </div>
          <a href="/log" style={{ fontSize: 12, color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 4 }}>
            Log new <ChevronRight size={12} />
          </a>
        </div>
        {data.recent_interactions.length === 0 ? (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--muted)' }}>No interactions logged yet.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['HCP Name', 'Type', 'Date', 'Sentiment', 'Engagement'].map(h => (
                  <th key={h} style={{ padding: '10px 24px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.recent_interactions.map(i => (
                <tr key={i.id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 24px', fontWeight: 600 }}>{i.hcp_name}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--muted2)', textTransform: 'capitalize' }}>{i.interaction_type}</td>
                  <td style={{ padding: '14px 24px', color: 'var(--muted2)' }}>
                    {i.date ? format(parseISO(i.date), 'MMM d, yyyy') : '—'}
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <span className={`badge badge-${i.sentiment}`}>{i.sentiment || '—'}</span>
                  </td>
                  <td style={{ padding: '14px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                        <div style={{ width: `${(i.engagement_score || 0) * 10}%`, height: '100%', background: sentimentColor(i.sentiment), borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 12, color: 'var(--muted2)', width: 24 }}>{i.engagement_score?.toFixed(1) || '—'}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
