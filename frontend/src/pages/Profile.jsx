import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#6c63ff','#4ecdc4','#ff6b6b','#ffd166','#74b9ff','#a29bfe'];

export default function Profile() {
  const { user, refreshUser, logout } = useAuth();
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const color = COLORS[user?.name?.charCodeAt(0) % COLORS.length] || '#6c63ff';
  const initials = user?.name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() || 'U';

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirm) { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      toast.success('Password updated!');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page fade-in" style={{ maxWidth: 720 }}>
      <h1 className="page-title">◉ My Profile</h1>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="flex items-center gap-4" style={{ marginBottom: 24 }}>
          <div className="avatar" style={{ width: 72, height: 72, background: color, fontSize: 22 }}>{initials}</div>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700 }}>{user?.name}</h2>
            <p style={{ color: '#888', marginBottom: 4 }}>{user?.designation} · {user?.department}</p>
            <span style={{ padding: '3px 12px', borderRadius: 20, background: user?.role === 'admin' ? 'rgba(108,99,255,0.2)' : 'rgba(78,205,196,0.2)', color: user?.role === 'admin' ? '#6c63ff' : '#4ecdc4', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{user?.role}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[
            ['Employee ID', user?.employeeId],
            ['Email', user?.email],
            ['Department', user?.department],
            ['Joined', user?.joiningDate ? new Date(user.joiningDate).toLocaleDateString('en-IN') : '—'],
          ].map(([label, value]) => (
            <div key={label}>
              <div className="label">{label}</div>
              <div style={{ color: '#ddd', fontSize: 14 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* QR Code */}
      {user?.qrCode && (
        <div className="card" style={{ marginBottom: 20, textAlign: 'center' }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>My QR Badge</h3>
          <div style={{ padding: 16, background: '#fff', borderRadius: 12, display: 'inline-block', marginBottom: 12 }}>
            <img src={user.qrCode} alt="My QR" style={{ width: 160, height: 160 }} />
          </div>
          <p style={{ color: '#666', fontSize: 13, marginBottom: 12 }}>Show this QR code to the admin scanner for attendance</p>
          <button className="btn btn-outline btn-sm" onClick={() => {
            const a = document.createElement('a'); a.href = user.qrCode;
            a.download = `${user.employeeId}_qr.png`; a.click();
            toast.success('QR downloaded!');
          }}>↓ Download QR Code</button>
        </div>
      )}

      {/* Change Password */}
      <div className="card">
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 20 }}>Change Password</h3>
        <form onSubmit={handlePasswordChange}>
          <div style={{ display: 'grid', gap: 14 }}>
            {[['currentPassword','Current Password'], ['newPassword','New Password'], ['confirm','Confirm Password']].map(([key, label]) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input className="input" type="password" placeholder="••••••••" value={pwForm[key]} onChange={e => setPwForm({...pwForm, [key]: e.target.value})} required />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
