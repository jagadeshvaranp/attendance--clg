import { useEffect, useState } from 'react';
import { BarChart3, CalendarDays, Clock3, TrendingUp, UserCheck, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="card stat-card" style={{ overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: -18, right: -18, width: 96, height: 96, borderRadius: '50%', background: color, opacity: 0.14 }} />
    <div
      style={{
        width: 46,
        height: 46,
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        background: `linear-gradient(135deg, ${color}, rgba(255,255,255,0.92))`,
        color: '#03111f',
        boxShadow: '0 16px 24px rgba(2, 8, 23, 0.24)',
      }}
    >
      <Icon size={20} strokeWidth={2.4} />
    </div>
    <div className="label">{label}</div>
    <div style={{ fontSize: 32, fontWeight: 700, fontFamily: "'Space Mono', monospace", color: '#fff' }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color, marginTop: 6, fontWeight: 600 }}>{sub}</div>}
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: 'rgba(8, 20, 35, 0.96)',
        border: '1px solid rgba(148, 163, 184, 0.18)',
        borderRadius: 14,
        padding: '12px 14px',
        boxShadow: '0 18px 34px rgba(2, 8, 23, 0.34)',
      }}
    >
      <p style={{ color: 'var(--text2)', fontSize: 12, marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color, fontSize: 13 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/dashboard').then((res) => setData(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  const stats = data?.stats || {};
  const weekTrend = data?.weekTrend || [];

  return (
    <div className="page fade-in">
      <div style={{ marginBottom: 28 }}>
        <div className="surface-pill" style={{ marginBottom: 14 }}>
          <CalendarDays size={14} />
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </div>
        <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart3 size={24} />
          Dashboard
        </h1>
        <p className="page-subtitle">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]}.
          Your attendance overview is ready.
        </p>
      </div>

      {user?.role === 'admin' ? (
        <>
          <div className="stat-grid">
            <StatCard icon={Users} label="Total Employees" value={stats.totalEmployees || 0} sub="Active staff" color="#38bdf8" />
            <StatCard icon={UserCheck} label="Present Today" value={stats.presentToday || 0} sub={`${stats.attendanceRate || 0}% rate`} color="#34d399" />
            <StatCard icon={TrendingUp} label="Absent Today" value={stats.absentToday || 0} sub="Needs follow-up" color="#fb7185" />
            <StatCard icon={Clock3} label="Late Today" value={stats.lateToday || 0} sub="After 9:15 AM" color="#fbbf24" />
            <StatCard icon={CalendarDays} label="Pending Leaves" value={stats.pendingLeaves || 0} sub="Awaiting approval" color="#60a5fa" />
          </div>

          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1 }}>
                7-Day Attendance Trend
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weekTrend} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" />
                <XAxis dataKey="day" stroke="#6f87a8" tick={{ fontSize: 12, fill: '#8ea6c4' }} />
                <YAxis stroke="#6f87a8" tick={{ fontSize: 12, fill: '#8ea6c4' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="present" name="Present" fill="#38bdf8" radius={[8, 8, 0, 0]} />
                <Bar dataKey="absent" name="Absent" fill="rgba(251,113,133,0.75)" radius={[8, 8, 0, 0]} />
                <Bar dataKey="late" name="Late" fill="rgba(251,191,36,0.75)" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <div style={{ maxWidth: 680 }}>
          <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <StatCard icon={UserCheck} label="Present This Month" value="22" sub="Consistent attendance" color="#34d399" />
            <StatCard icon={CalendarDays} label="Leave Balance" value={user?.leaveBalance?.casual || 12} sub="Casual leaves" color="#60a5fa" />
          </div>
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 18 }}>
              Leave Balance Summary
            </h3>
            {[['Casual', user?.leaveBalance?.casual || 12, 12, '#38bdf8'], ['Sick', user?.leaveBalance?.sick || 6, 6, '#34d399'], ['Earned', user?.leaveBalance?.earned || 15, 15, '#fbbf24']].map(([name, val, max, color]) => (
              <div key={name} style={{ marginBottom: 18 }}>
                <div className="flex justify-between" style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text2)' }}>{name} Leave</span>
                  <span style={{ fontSize: 13, color, fontFamily: "'Space Mono', monospace", fontWeight: 700 }}>{val}/{max}</span>
                </div>
                <div style={{ height: 9, background: 'rgba(148,163,184,0.12)', borderRadius: '999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(val / max) * 100}%`,
                      background: `linear-gradient(90deg, ${color}, rgba(255,255,255,0.95))`,
                      borderRadius: '999px',
                      transition: 'width 0.6s ease',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
