import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#6c63ff','#4ecdc4','#ff6b6b','#ffd166','#74b9ff','#a29bfe'];
const DEPTS = ['Engineering','Design','Marketing','HR','Finance','Operations','Sales'];

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex justify-between items-center" style={{ marginBottom: 20 }}>
          <h2 className="modal-title" style={{ margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', fontSize: 20 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [showQR, setShowQR] = useState(null);
  const [form, setForm] = useState({ name: '', email: '', password: '', department: 'Engineering', designation: '', phone: '', role: 'employee' });

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (deptFilter) params.set('department', deptFilter);
      const { data } = await api.get(`/employees?${params}`);
      setEmployees(data.employees || []);
    } catch { toast.error('Failed to load employees'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [search, deptFilter]);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth/register', form);
      toast.success('Employee added successfully!');
      setShowAdd(false);
      setForm({ name: '', email: '', password: '', department: 'Engineering', designation: '', phone: '', role: 'employee' });
      load();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to add employee'); }
  };

  const toggleStatus = async (emp) => {
    try {
      await api.put(`/employees/${emp._id}`, { isActive: !emp.isActive });
      toast.success(`Employee ${emp.isActive ? 'deactivated' : 'activated'}`);
      load();
    } catch { toast.error('Update failed'); }
  };

  const showQRCode = async (emp) => {
    try {
      if (!emp.qrCode) {
        const { data } = await api.post(`/employees/${emp._id}/qr`);
        setShowQR({ ...emp, qrCode: data.qrCode });
      } else {
        setShowQR(emp);
      }
    } catch { toast.error('Failed to load QR'); }
  };

  return (
    <div className="page fade-in">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="page-title">◉ Employees</h1>
          <p className="page-subtitle">Manage employee profiles and QR badges</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(true)}>+ Add Employee</button>
      </div>

      <div className="flex gap-3 mb-4 flex-wrap">
        <input className="input" placeholder="Search by name, ID, email..." style={{ maxWidth: 260 }} value={search} onChange={e => setSearch(e.target.value)} />
        <select className="input" style={{ maxWidth: 180 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
          <option value="">All Departments</option>
          {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Designation</th><th>Email</th><th>Joined</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {employees.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#555' }}>No employees found</td></tr>
              ) : employees.map((emp, i) => (
                <tr key={emp._id}>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="avatar" style={{ width: 36, height: 36, background: COLORS[i % 6], fontSize: 12 }}>
                        {emp.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: '#ddd' }}>{emp.name}</div>
                        <div style={{ color: '#555', fontSize: 11 }}>{emp.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: '#aaa' }}>{emp.department}</td>
                  <td style={{ color: '#888', fontSize: 12 }}>{emp.designation}</td>
                  <td style={{ color: '#888', fontSize: 12 }}>{emp.email}</td>
                  <td style={{ color: '#666', fontSize: 12 }}>{new Date(emp.joiningDate).toLocaleDateString('en-IN')}</td>
                  <td>
                    <span className={`badge badge-${emp.isActive ? 'approved' : 'rejected'}`}>{emp.isActive ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td>
                    <div className="flex gap-2">
                      <button className="btn btn-outline btn-sm" onClick={() => showQRCode(emp)}>🔲 QR</button>
                      <button className={`btn btn-sm ${emp.isActive ? 'btn-danger' : 'btn-success'}`} onClick={() => toggleStatus(emp)}>
                        {emp.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAdd && (
        <Modal title="Add New Employee" onClose={() => setShowAdd(false)}>
          <form onSubmit={handleAdd}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              {[['name','Full Name','text','Arjun Sharma'],['email','Email','email','arjun@company.com'],['password','Password','password','Min 6 chars'],['designation','Designation','text','Software Engineer'],['phone','Phone','tel','+91 9876543210']].map(([key, label, type, placeholder]) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input className="input" type={type} placeholder={placeholder} value={form[key]} onChange={e => setForm({...form, [key]: e.target.value})} required={key !== 'phone'} />
                </div>
              ))}
              <div>
                <label className="label">Department</label>
                <select className="input" value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                  {DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={e => setForm({...form, role: e.target.value})}>
                  <option value="employee">Employee</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4" style={{ justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-outline" onClick={() => setShowAdd(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Add Employee</button>
            </div>
          </form>
        </Modal>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <Modal title={`QR Badge — ${showQR.name}`} onClose={() => setShowQR(null)}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ padding: 20, background: '#fff', borderRadius: 12, display: 'inline-block', marginBottom: 16 }}>
              <img src={showQR.qrCode} alt="QR Code" style={{ width: 200, height: 200 }} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontWeight: 700, color: '#ddd', marginBottom: 4 }}>{showQR.name}</p>
              <p style={{ color: '#888', fontSize: 13 }}>{showQR.employeeId} • {showQR.department}</p>
            </div>
            <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }} onClick={() => {
              const a = document.createElement('a'); a.href = showQR.qrCode;
              a.download = `${showQR.employeeId}_qr.png`; a.click();
              toast.success('QR downloaded!');
            }}>↓ Download QR Code</button>
          </div>
        </Modal>
      )}
    </div>
  );
}
