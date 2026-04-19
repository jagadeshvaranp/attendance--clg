import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function MyLeaves() {
  const { user } = useAuth();
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/leaves/my');
      setLeaves(data.leaves || []);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApply = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leaves', form);
      toast.success('Leave application submitted!');
      setShowApply(false);
      setForm({ leaveType: 'casual', startDate: '', endDate: '', reason: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to apply'); }
  };

  const cancelLeave = async (id) => {
    if (!confirm('Cancel this leave?')) return;
    try { await api.delete(`/leaves/${id}`); toast.success('Leave cancelled'); load(); }
    catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="page fade-in">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="page-title">◫ My Leaves</h1>
          <p className="page-subtitle">Apply for leave and track your applications</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowApply(true)}>+ Apply for Leave</button>
      </div>

      {/* Balance Cards */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        {[['Casual', user?.leaveBalance?.casual, 12, '#6c63ff'], ['Sick', user?.leaveBalance?.sick, 6, '#4ecdc4'], ['Earned', user?.leaveBalance?.earned, 15, '#ffd166']].map(([type, val, max, color]) => (
          <div key={type} className="card-sm">
            <div className="label">{type} Leave</div>
            <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'Space Mono', monospace" }}>{val ?? '—'}<span style={{ fontSize: 14, color: '#555', fontFamily: 'inherit' }}>/{max}</span></div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 3, marginTop: 8 }}>
              <div style={{ height: '100%', width: `${((val ?? 0) / max) * 100}%`, background: color, borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table>
            <thead><tr><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#555' }}>No leave applications yet</td></tr>
              ) : leaves.map(l => (
                <tr key={l._id}>
                  <td style={{ textTransform: 'capitalize', color: '#aaa' }}>{l.leaveType}</td>
                  <td style={{ color: '#888', fontSize: 13 }}>{new Date(l.startDate).toLocaleDateString('en-IN')}</td>
                  <td style={{ color: '#888', fontSize: 13 }}>{new Date(l.endDate).toLocaleDateString('en-IN')}</td>
                  <td style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: '#ffd166' }}>{l.totalDays}</td>
                  <td style={{ color: '#888', fontSize: 12, maxWidth: 200 }}>{l.reason}</td>
                  <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                  <td>
                    {l.status === 'pending' && (
                      <button className="btn btn-danger btn-sm" onClick={() => cancelLeave(l._id)}>Cancel</button>
                    )}
                    {l.status === 'rejected' && l.rejectionReason && (
                      <span style={{ color: '#ff6b6b', fontSize: 11 }}>{l.rejectionReason}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showApply && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18 }}>Apply for Leave</h2>
              <button onClick={() => setShowApply(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <form onSubmit={handleApply}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div>
                  <label className="label">Leave Type</label>
                  <select className="input" value={form.leaveType} onChange={e => setForm({...form, leaveType: e.target.value})}>
                    {['casual','sick','earned','unpaid'].map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div><label className="label">Start Date</label><input className="input" type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} required /></div>
                  <div><label className="label">End Date</label><input className="input" type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} required /></div>
                </div>
                <div>
                  <label className="label">Reason</label>
                  <textarea className="input" rows={3} placeholder="Brief reason for leave..." value={form.reason} onChange={e => setForm({...form, reason: e.target.value})} required style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowApply(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Submit Application</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
