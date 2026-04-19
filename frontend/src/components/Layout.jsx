import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Briefcase,
  CalendarCheck2,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  ListTodo,
  LogOut,
  Plane,
  QrCode,
  ShieldCheck,
  UserCircle2,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const adminNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/scanner', icon: QrCode, label: 'QR Scanner' },
  { to: '/attendance', icon: CalendarCheck2, label: 'Attendance' },
  { to: '/employees', icon: Users, label: 'Employees' },
  { to: '/leaves', icon: Plane, label: 'Leave Mgmt' },
  { to: '/reports', icon: BarChart3, label: 'Reports' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
];

const employeeNav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/my-attendance', icon: CalendarCheck2, label: 'My Attendance' },
  { to: '/my-leaves', icon: Plane, label: 'My Leaves' },
  { to: '/tasks', icon: ListTodo, label: 'My Tasks' },
];

const COLORS = ['#38bdf8', '#34d399', '#fbbf24', '#60a5fa', '#fb7185', '#22d3ee'];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const navItems = user?.role === 'admin' ? adminNav : employeeNav;
  const initials = user?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const color = COLORS[user?.name?.charCodeAt(0) % COLORS.length] || '#38bdf8';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside
        className="sidebar-shell"
        style={{
          width: collapsed ? 88 : 260,
          transition: 'width 0.28s ease',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'relative',
            padding: '22px 18px 18px',
            borderBottom: '1px solid rgba(148, 163, 184, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            zIndex: 1,
          }}
        >
          <div className="brand-mark">
            <ShieldCheck size={20} strokeWidth={2.2} />
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontFamily: "'Space Mono', monospace", fontSize: 15, fontWeight: 700, color: '#fff', letterSpacing: 1 }}>
                ATTENDMS
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: 2, textTransform: 'uppercase' }}>
                Smart workforce flow
              </div>
            </div>
          )}
          <button className="sidebar-toggle" onClick={() => setCollapsed(!collapsed)} aria-label="Toggle sidebar">
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {!collapsed && (
          <div style={{ padding: '14px 18px 8px', position: 'relative', zIndex: 1 }}>
            <span className="surface-pill" style={{ color: user?.role === 'admin' ? 'var(--accent)' : 'var(--accent2)' }}>
              {user?.role === 'admin' ? <ShieldCheck size={14} /> : <Briefcase size={14} />}
              {user?.role}
            </span>
          </div>
        )}

        <nav style={{ flex: 1, padding: '10px 12px', position: 'relative', zIndex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
                style={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  padding: collapsed ? '12px 0' : '11px 12px',
                }}
              >
                {({ isActive }) => (
                  <>
                    <Icon size={18} strokeWidth={2.1} style={{ flexShrink: 0, opacity: isActive ? 1 : 0.82 }} />
                    {!collapsed && <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, whiteSpace: 'nowrap' }}>{item.label}</span>}
                    {!collapsed && isActive && <span className="nav-link-dot" style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        <div
          style={{
            padding: '14px',
            borderTop: '1px solid rgba(148, 163, 184, 0.08)',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <NavLink to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
              <div className="avatar" style={{ width: 38, height: 38, background: `linear-gradient(135deg, ${color}, #ffffff)` }}>
                {initials}
              </div>
              {!collapsed && (
                <div style={{ overflow: 'hidden', minWidth: 0 }}>
                  <div style={{ color: 'var(--text)', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.name}
                  </div>
                  <div style={{ color: 'var(--text3)', fontSize: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {user?.department}
                  </div>
                </div>
              )}
            </NavLink>
            {!collapsed ? (
              <button className="sidebar-toggle" onClick={handleLogout} title="Logout" aria-label="Logout">
                <LogOut size={16} />
              </button>
            ) : (
              <NavLink to="/profile" style={{ color: 'var(--text2)' }} aria-label="Profile">
                <UserCircle2 size={18} />
              </NavLink>
            )}
          </div>
        </div>
      </aside>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
