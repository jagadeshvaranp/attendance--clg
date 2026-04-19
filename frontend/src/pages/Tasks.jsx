import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PRIORITY_COLORS = { low: 'low', medium: 'medium', high: 'high', urgent: 'urgent' };
const STATUS_COLORS = { todo: 'pending', 'in-progress': 'leave', completed: 'approved', cancelled: 'rejected' };

export default function Tasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });

  const load = async () => {
    setLoading(true);
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const { data } = await api.get(`/tasks${params}`);
      setTasks(data.tasks || []);
    } catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [statusFilter]);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/employees').then(r => setEmployees(r.data.employees || [])).catch(() => {});
    }
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tasks', form);
      toast.success('Task assigned!');
      setShowAdd(false);
      setForm({ title: '', description: '', assignedTo: '', priority: 'medium', dueDate: '' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const updateStatus = async (id, status) => {
    try {
      await api.put(`/tasks/${id}`, { status });
      toast.success('Task updated');
      load();
    } catch { toast.error('Update failed'); }
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    try { await api.delete(`/tasks/${id}`); toast.success('Task deleted'); load(); }
    catch { toast.error('Delete failed'); }
  };

  const nextStatus = { todo: 'in-progress', 'in-progress': 'completed' };

  return (
    <div className="page fade-in">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="page-title">◧ {user?.role === 'admin' ? 'Task Management' : 'My Tasks'}</h1>
          <p className="page-subtitle">{user?.role === 'admin' ? 'Assign and track employee tasks' : 'View and update your assigned tasks'}</p>
        </div>
        {user?.role === 'admin' && <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Assign Task</button>}
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {['','todo','in-progress','completed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{
            padding: '7px 16px', borderRadius: 8, border: `1px solid ${statusFilter === s ? 'rgba(108,99,255,0.5)' : 'rgba(255,255,255,0.1)'}`,
            background: statusFilter === s ? 'rgba(108,99,255,0.15)' : 'transparent',
            color: statusFilter === s ? '#6c63ff' : '#666', cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
          }}>{s || 'All'}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {tasks.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 48, color: '#555', gridColumn: '1/-1' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>◧</div>
              <p>No tasks found</p>
            </div>
          ) : tasks.map(task => (
            <div key={task._id} className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="flex justify-between items-flex-start gap-2">
                <div>
                  <span className={`badge badge-${PRIORITY_COLORS[task.priority]}`} style={{ marginBottom: 8, display: 'inline-flex' }}>{task.priority}</span>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: '#e8e8f0' }}>{task.title}</h3>
                </div>
                <span className={`badge badge-${STATUS_COLORS[task.status]}`} style={{ flexShrink: 0, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{task.status}</span>
              </div>
              {task.description && <p style={{ fontSize: 13, color: '#888' }}>{task.description}</p>}
              <div style={{ fontSize: 12, color: '#666', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10 }}>
                <div>👤 {task.assignedTo?.name} ({task.assignedTo?.department})</div>
                <div>📅 Due: {new Date(task.dueDate).toLocaleDateString('en-IN')}</div>
                <div>📌 By: {task.assignedBy?.name}</div>
              </div>
              <div className="flex gap-2 mt-2">
                {nextStatus[task.status] && (
                  <button className="btn btn-success btn-sm" onClick={() => updateStatus(task._id, nextStatus[task.status])} style={{ flex: 1, justifyContent: 'center' }}>
                    → Mark {nextStatus[task.status] === 'in-progress' ? 'In Progress' : 'Complete'}
                  </button>
                )}
                {user?.role === 'admin' && (
                  <button className="btn btn-danger btn-sm" onClick={() => deleteTask(task._id)}>✕</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showAdd && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
              <h2 style={{ fontWeight: 700, fontSize: 18 }}>Assign New Task</h2>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>
            <form onSubmit={handleAdd}>
              <div style={{ display: 'grid', gap: 14 }}>
                <div><label className="label">Task Title</label><input className="input" placeholder="Fix login bug" value={form.title} onChange={e => setForm({...form, title: e.target.value})} required /></div>
                <div><label className="label">Description</label><textarea className="input" rows={2} placeholder="Describe the task..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} style={{ resize: 'vertical' }} /></div>
                <div>
                  <label className="label">Assign To</label>
                  <select className="input" value={form.assignedTo} onChange={e => setForm({...form, assignedTo: e.target.value})} required>
                    <option value="">Select employee</option>
                    {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name} ({emp.department})</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="label">Priority</label>
                    <select className="input" value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
                      {['low','medium','high','urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div><label className="label">Due Date</label><input className="input" type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} required /></div>
                </div>
              </div>
              <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Assign Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
