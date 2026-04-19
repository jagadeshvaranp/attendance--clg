import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#6c63ff','#4ecdc4','#ff6b6b','#ffd166','#74b9ff','#a29bfe'];

export default function Attendance() {
  const [records, setRecords] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('today'); // today | monthly
  const [monthlyData, setMonthlyData] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadToday = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/attendance/today');
      setRecords(data.records || []);
      setStats(data.stats || {});
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  const loadMonthly = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/attendance/monthly?month=${selectedMonth}&year=${selectedYear}`);
      setMonthlyData(data.summary || []);
    } catch { toast.error('Failed to load monthly data'); }
    finally { setLoading(false); }
  };

  useEffect(() => { view === 'today' ? loadToday() : loadMonthly(); }, [view, selectedMonth, selectedYear]);

  const downloadReport = async (type) => {
    try {
      const params = type === 'daily'
        ? `date=${new Date().toISOString().split('T')[0]}`
        : `month=${selectedMonth}&year=${selectedYear}`;
      const res = await api.get(`/reports/${type}?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `${type}_attendance_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
      toast.success('Report downloaded!');
    } catch { toast.error('Download failed'); }
  };

  const filteredRecords = records.filter(r =>
    r.employee?.name?.toLowerCase().includes(search.toLowerCase()) ||
    r.employee?.employeeId?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredMonthly = monthlyData.filter(r =>
    r.employee?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page fade-in">
      <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
        <div>
          <h1 className="page-title">▦ Attendance Register</h1>
          <p className="page-subtitle">Track and manage employee attendance records</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="btn btn-success btn-sm" onClick={() => downloadReport('daily')}>↓ Daily Excel</button>
          <button className="btn btn-outline btn-sm" onClick={() => downloadReport('weekly')}>↓ Weekly Excel</button>
          <button className="btn btn-outline btn-sm" onClick={() => downloadReport('monthly')}>↓ Monthly Excel</button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2 mb-4 flex-wrap items-center">
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: 10, padding: 3 }}>
          {['today', 'monthly'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '8px 18px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: view === v ? 'rgba(108,99,255,0.3)' : 'transparent',
              color: view === v ? '#6c63ff' : '#666', fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
            }}>{v === 'today' ? "Today's Attendance" : 'Monthly View'}</button>
          ))}
        </div>
        {view === 'monthly' && (
          <div className="flex gap-2">
            <select className="input" style={{ width: 120 }} value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}>
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m, i) => (
                <option key={i} value={i + 1}>{m}</option>
              ))}
            </select>
            <select className="input" style={{ width: 90 }} value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}>
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        )}
        <input className="input" placeholder="Search employee..." style={{ width: 200, marginLeft: 'auto' }}
          value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Stats */}
      {view === 'today' && (
        <div className="stat-grid" style={{ marginBottom: 20 }}>
          {[['Total Staff', stats.total || 0, '#888'], ['Present', stats.present || 0, '#4ecdc4'], ['Absent', stats.absent || 0, '#ff6b6b'], ['Late', stats.late || 0, '#ffd166']].map(([label, value, color]) => (
            <div key={label} className="card-sm flex items-center gap-3">
              <div style={{ flex: 1 }}>
                <div className="label">{label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'Space Mono', monospace" }}>{value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'auto' }}>
          {view === 'today' ? (
            <table>
              <thead><tr>
                <th>Employee</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Status</th>
              </tr></thead>
              <tbody>
                {filteredRecords.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 48, color: '#555' }}>No attendance records for today</td></tr>
                ) : filteredRecords.map((r, i) => (
                  <tr key={r._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar" style={{ width: 32, height: 32, background: COLORS[i % 6], fontSize: 11 }}>
                          {r.employee?.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#ddd' }}>{r.employee?.name}</div>
                          <div style={{ color: '#555', fontSize: 11 }}>{r.employee?.department} • {r.employee?.employeeId}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#4ecdc4', fontFamily: "'Space Mono', monospace", fontSize: 13 }}>
                      {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ color: '#ff6b6b', fontFamily: "'Space Mono', monospace", fontSize: 13 }}>
                      {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ fontFamily: "'Space Mono', monospace", fontWeight: 700, color: r.workHours >= 8 ? '#4ecdc4' : '#ffd166' }}>
                      {r.workHours ? `${r.workHours}h` : '—'}
                    </td>
                    <td><span className={`badge badge-${r.status === 'present' ? 'present' : r.status === 'late' ? 'late' : r.status === 'on-leave' ? 'leave' : 'absent'}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table>
              <thead><tr>
                <th>Employee</th><th>Present</th><th>Late</th><th>Half Day</th><th>Absent</th><th>On Leave</th><th>Hours</th><th>Attendance %</th>
              </tr></thead>
              <tbody>
                {filteredMonthly.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 48, color: '#555' }}>No data available</td></tr>
                ) : filteredMonthly.map((r, i) => (
                  <tr key={r.employee?._id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="avatar" style={{ width: 32, height: 32, background: COLORS[i % 6], fontSize: 11 }}>
                          {r.employee?.name?.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: '#ddd' }}>{r.employee?.name}</div>
                          <div style={{ color: '#555', fontSize: 11 }}>{r.employee?.department}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: '#4ecdc4', fontWeight: 700, fontFamily: "'Space Mono', monospace" }}>{r.present}</td>
                    <td style={{ color: '#ffd166', fontFamily: "'Space Mono', monospace" }}>{r.late}</td>
                    <td style={{ color: '#74b9ff', fontFamily: "'Space Mono', monospace" }}>{r.halfDay}</td>
                    <td style={{ color: '#ff6b6b', fontFamily: "'Space Mono', monospace" }}>{r.absent}</td>
                    <td style={{ color: '#a29bfe', fontFamily: "'Space Mono', monospace" }}>{r.onLeave || 0}</td>
                    <td style={{ fontFamily: "'Space Mono', monospace", color: '#888' }}>{r.totalHours}h</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.08)', borderRadius: 3, minWidth: 60 }}>
                          <div style={{ height: '100%', width: `${r.attendancePercent}%`, background: r.attendancePercent >= 85 ? '#4ecdc4' : r.attendancePercent >= 70 ? '#ffd166' : '#ff6b6b', borderRadius: 3 }} />
                        </div>
                        <span style={{ fontFamily: "'Space Mono', monospace", fontSize: 12, fontWeight: 700, color: r.attendancePercent >= 85 ? '#4ecdc4' : r.attendancePercent >= 70 ? '#ffd166' : '#ff6b6b' }}>{r.attendancePercent}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
