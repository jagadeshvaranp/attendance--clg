import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function MyAttendance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(new Date().getFullYear());

  const load = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.get(`/attendance/my?month=${month}&year=${year}`);
      setData(res);
    } catch { toast.error('Failed to load attendance'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [month, year]);

  const getStatusColor = (s) => ({ present: '#4ecdc4', late: '#ffd166', absent: '#ff6b6b', 'on-leave': '#74b9ff', 'half-day': '#a29bfe' }[s] || '#333');

  return (
    <div className="page fade-in">
      <h1 className="page-title">▦ My Attendance</h1>

      <div className="flex gap-3 mb-4 items-center flex-wrap">
        <select className="input" style={{ width: 140 }} value={month} onChange={e => setMonth(+e.target.value)}>
          {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i) => <option key={i} value={i+1}>{m}</option>)}
        </select>
        <select className="input" style={{ width: 100 }} value={year} onChange={e => setYear(+e.target.value)}>
          {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" style={{ width: 32, height: 32 }} /></div>
      ) : (
        <>
          <div className="stat-grid" style={{ marginBottom: 24 }}>
            {[
              ['Present', data?.stats?.present || 0, '#4ecdc4'],
              ['Late', data?.stats?.late || 0, '#ffd166'],
              ['Half Day', data?.stats?.halfDay || 0, '#a29bfe'],
              ['Absent', data?.stats?.absent || 0, '#ff6b6b'],
              ['Work Hours', `${data?.stats?.totalWorkHours || 0}h`, '#74b9ff'],
            ].map(([label, value, color]) => (
              <div key={label} className="card-sm">
                <div className="label">{label}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: "'Space Mono', monospace" }}>{value}</div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Daily Records</h3>
            {!data?.records?.length ? (
              <div style={{ textAlign: 'center', padding: 40, color: '#555' }}>No records for this month</div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead><tr><th>Date</th><th>Day</th><th>Check In</th><th>Check Out</th><th>Hours</th><th>Status</th></tr></thead>
                  <tbody>
                    {data.records.map(r => (
                      <tr key={r._id}>
                        <td style={{ fontFamily: "'Space Mono', monospace", fontSize: 13 }}>{r.date}</td>
                        <td style={{ color: '#888', fontSize: 12 }}>{new Date(r.date).toLocaleDateString('en-IN', { weekday: 'short' })}</td>
                        <td style={{ color: '#4ecdc4', fontFamily: "'Space Mono', monospace", fontSize: 13 }}>
                          {r.checkIn ? new Date(r.checkIn).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ color: '#ff6b6b', fontFamily: "'Space Mono', monospace", fontSize: 13 }}>
                          {r.checkOut ? new Date(r.checkOut).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ fontFamily: "'Space Mono', monospace", color: '#888' }}>{r.workHours ? `${r.workHours}h` : '—'}</td>
                        <td><span className={`badge badge-${r.status === 'present' ? 'present' : r.status === 'late' ? 'late' : r.status === 'on-leave' ? 'leave' : 'absent'}`}>{r.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
