import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, MessageSquare, 
  CheckSquare, Zap
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import HCPList from './pages/HCPList';
import LogInteraction from './pages/LogInteraction';
import ChatLog from './pages/ChatLog';
import FollowUps from './pages/FollowUps';

const NAV = [
  { to: '/',            icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/hcps',        icon: Users,           label: 'HCPs' },
  { to: '/log',         icon: FileText,        label: 'Log Interaction' },
  { to: '/chat',        icon: MessageSquare,   label: 'AI Chat Log' },
  { to: '/followups',   icon: CheckSquare,     label: 'Follow-Ups' },
];

export default function App() {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: 220, flexShrink: 0,
        background: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 0'
      }}>
        {/* Logo */}
        <div style={{ padding: '0 20px 28px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Zap size={18} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.01em' }}>PharmaRep</div>
              <div style={{ color: 'var(--muted)', fontSize: 11 }}>HCP CRM</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8,
                color: isActive ? '#fff' : 'var(--muted2)',
                background: isActive ? 'linear-gradient(135deg,rgba(59,130,246,0.18),rgba(99,102,241,0.18))' : 'transparent',
                fontWeight: isActive ? 600 : 400,
                fontSize: 13,
                transition: 'all 0.15s',
                border: isActive ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
              })}
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', borderRadius: 8,
            background: 'var(--surface2)'
          }}>
            <div style={{
              width: 30, height: 30, borderRadius: '50%',
              background: 'linear-gradient(135deg,#3b82f6,#6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: '#fff'
            }}>SR</div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>Sales Rep</div>
              <div style={{ fontSize: 11, color: 'var(--muted)' }}>Chennai Region</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--bg)' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/hcps" element={<HCPList />} />
          <Route path="/log" element={<LogInteraction />} />
          <Route path="/chat" element={<ChatLog />} />
          <Route path="/followups" element={<FollowUps />} />
        </Routes>
      </main>
    </div>
  );
}
