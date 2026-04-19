import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/leaves?status=${statusFilter}`);
      setLeaves(data.leaves || []);
    } catch { toast.error('Failed to load leaves'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id, status, reason) => {
    try {
      await api.put(`/leaves/${id}/status`, { status, rejectionReason: reason });
      toast.success(`Leave ${status}!`);
      setRejectModal(null);
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed'); }
  };

  return (
    <div className="page fade-in">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="page-title">◫ Leave Management</h1>
          <p className="page-subtitle">Review and approve employee leave applications</p>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {['pending','approved','rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '8px 18px', borderRadius: 8, border: `1px solid ${statusFilter === s ? 'rgba(108,99,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
            background: statusFilter === s ? 'rgba(108,99,255,0.15)' : 'transparent',
            color: statusFilter === s ? '#6c63ff' : '#666', cursor: 'pointer', fontSize: 13, fontWeight: 600, textTransform: 'capitalize',
          }}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table>
            <thead><tr><th>Employee</th><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {leaves.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#555' }}>No {statusFilter} leaves</td></tr>
              ) : leaves.map(l => (
                <tr key={l._id}>
                  <td>
                    <div style={{ fontWeight: 600, color: '#ddd' }}>{l.employee?.name}</div>
                    <div style={{ color: '#555', fontSize: 11 }}>{l.employee?.department} • {l.employee?.employeeId}</div>
                  </td>
                  <td><span style={{ textTransform: 'capitalize', color: '#aaa', fontSize: 13 }}>{l.leaveType}</span></td>
                  <td style={{ color: '#888', fontSize: 13 }}>{new Date(l.startDate).toLocaleDateString('en-IN')}</td>
                  <td style={{ color: '#888', fontSize: 13 }}>{new Date(l.endDate).toLocaleDateString('en-IN')}</td>
                  <td style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: '#ffd166' }}>{l.totalDays}</td>
                  <td style={{ color: '#888', fontSize: 12, maxWidth: 180 }}>{l.reason}</td>
                  <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                  <td>
                    {l.status === 'pending' && (
                      <div className="flex gap-2">
                        <button className="btn btn-success btn-sm" onClick={() => updateStatus(l._id, 'approved')}>✓ Approve</button>
                        <button className="btn btn-danger btn-sm" onClick={() => { setRejectModal(l._id); setRejectReason(''); }}>✕ Reject</button>
                      </div>
                    )}
                    {l.status === 'approved' && <span style={{ color: '#555', fontSize: 12 }}>Approved by {l.approvedBy?.name}</span>}
                    {l.status === 'rejected' && <span style={{ color: '#555', fontSize: 12 }}>{l.rejectionReason}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 16, fontWeight: 700 }}>Reject Leave Application</h3>
            <label className="label">Rejection Reason</label>
            <textarea className="input" rows={3} placeholder="Provide a reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} style={{ resize: 'vertical' }} />
            <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-outline" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => updateStatus(rejectModal, 'rejected', rejectReason)}>Reject Leave</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
