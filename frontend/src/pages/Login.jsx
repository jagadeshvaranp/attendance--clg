import { useState } from 'react';
import { ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const { login, loading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Attempting login with:', form.email);
    const result = await login(form.email, form.password);
    console.log('Login result:', result);
    if (!result.success) {
      toast.error(result.message);
    } else {
      toast.success('Login successful!');
    }
  };

  return (
    <div className="login-shell">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="ambient-orb orb-a" />
        <div className="ambient-orb orb-b" />
        <div className="grid-glow" />
      </div>

      <div className="login-wrap">
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div className="brand-mark" style={{ width: 58, height: 58, borderRadius: 18, margin: '0 auto 18px' }}>
            <ShieldCheck size={28} strokeWidth={2.3} />
          </div>
        
          <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: 26, fontWeight: 700, color: '#fff', marginBottom: 8 }}>
            ATTEND<span style={{ color: 'var(--accent)' }}>MS</span>
          </h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>
            Attendance management with a cleaner, calmer interface
          </p>
        </div>

        <div className="card login-card">
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>Sign In</h2>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 24 }}>
            Use your company account to continue to the dashboard.
          </p>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Email Address</label>
              <input
                className="input"
                type="email"
                placeholder="admin@company.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
              />
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} /> Signing in...
                </>
              ) : (
                <>
                  Continue <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: 'rgba(56, 189, 248, 0.08)',
              borderRadius: 14,
              border: '1px solid rgba(56, 189, 248, 0.16)',
            }}
          >
            <p style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8, fontWeight: 700 }}>Demo Credentials</p>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>Admin: admin@company.com / admin123</p>
            <p style={{ fontSize: 12, color: 'var(--text3)' }}>Employee: emp@company.com / emp123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
