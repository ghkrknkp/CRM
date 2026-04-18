import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFollowUps } from '../store';
import { CheckSquare, Calendar, AlertCircle } from 'lucide-react';
import { format, parseISO, isPast } from 'date-fns';

const priorityColor = (p) => {
  if (p === 'high') return 'var(--danger)';
  if (p === 'medium') return 'var(--warning)';
  return 'var(--muted2)';
};

export default function FollowUps() {
  const dispatch = useDispatch();
  const { list } = useSelector(s => s.followups);

  useEffect(() => { dispatch(fetchFollowUps()); }, [dispatch]);

  const pending = list.filter(f => !f.completed);
  const done = list.filter(f => f.completed);

  return (
    <div style={{ padding: '32px 36px', maxWidth: 800 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>Follow-Ups</h1>
        <p style={{ color: 'var(--muted2)' }}>{pending.length} pending tasks</p>
      </div>

      {list.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--muted)' }}>
          <CheckSquare size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <div>No follow-ups yet. Schedule them via the AI Chat or after logging an interaction.</div>
        </div>
      ) : (
        <>
          {pending.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Pending ({pending.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {pending.map(f => {
                  const overdue = f.due_date && isPast(parseISO(f.due_date));
                  return (
                    <div key={f.id} className="fade-in" style={{
                      background: 'var(--surface)', border: `1px solid ${overdue ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius)', padding: '16px 20px',
                      display: 'flex', alignItems: 'flex-start', gap: 14
                    }}>
                      <div style={{ width: 20, height: 20, borderRadius: 5, border: '2px solid var(--border)', flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: 6 }}>{f.task}</div>
                        <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--muted2)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} />
                            {f.due_date ? format(parseISO(f.due_date), 'MMM d, yyyy') : '—'}
                          </span>
                          {overdue && <span style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={12} /> Overdue</span>}
                        </div>
                      </div>
                      <span style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: `${priorityColor(f.priority)}18`, color: priorityColor(f.priority), border: `1px solid ${priorityColor(f.priority)}30`, textTransform: 'capitalize' }}>
                        {f.priority}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          {done.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Completed ({done.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {done.map(f => (
                  <div key={f.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '14px 20px', opacity: 0.5, display: 'flex', gap: 14 }}>
                    <CheckSquare size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ flex: 1, textDecoration: 'line-through', color: 'var(--muted)' }}>{f.task}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
