import { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Reports() {
  const [loading, setLoading] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const download = async (type, params = '') => {
    setLoading(prev => ({ ...prev, [type]: true }));
    try {
      const res = await api.get(`/reports/${type}?${params}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a'); a.href = url;
      a.download = `${type}_report_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click(); URL.revokeObjectURL(url);
      toast.success(`${type} report downloaded!`);
    } catch { toast.error('Download failed'); }
    finally { setLoading(prev => ({ ...prev, [type]: false })); }
  };

  return (
    <div className="page fade-in">
      <h1 className="page-title">⬟ Reports & Export</h1>
      <p className="page-subtitle">Download Excel reports — daily, weekly, and monthly</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
        {/* Daily */}
        <div className="card">
          <div style={{ fontSize: 32, marginBottom: 12 }}>📅</div>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Daily Report</h3>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>All employee check-in/out times for a specific date. Includes work hours and status.</p>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Select Date</label>
            <input className="input" type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <button className="btn btn-success" style={{ width: '100%', justifyContent: 'center' }} disabled={loading.daily}
            onClick={() => download('daily', `date=${selectedDate}`)}>
            {loading.daily ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Generating...</> : '↓ Download Daily Excel'}
          </button>
        </div>

        {/* Weekly */}
        <div className="card">
          <div style={{ fontSize: 32, marginBottom: 12 }}>📆</div>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Weekly Report</h3>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>7-day summary with daily sheets + weekly totals per employee.</p>
          <div style={{ marginBottom: 14 }}>
            <label className="label">Week Starting</label>
            <input className="input" type="date" onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <button className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', borderColor: 'rgba(108,99,255,0.4)', color: '#6c63ff' }}
            disabled={loading.weekly} onClick={() => download('weekly', `weekStart=${selectedDate}`)}>
            {loading.weekly ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Generating...</> : '↓ Download Weekly Excel'}
          </button>
        </div>

        {/* Monthly */}
        <div className="card">
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗂️</div>
          <h3 style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>Monthly Report</h3>
          <p style={{ color: '#888', fontSize: 13, marginBottom: 20 }}>Full monthly breakdown with attendance %, leave balance, overtime, and dept summary.</p>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label className="label">Month</label>
              <select className="input" value={selectedMonth} onChange={e => setSelectedMonth(+e.target.value)}>
                {['January','February','March','April','May','June','July','August','September','October','November','December'].map((m,i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="label">Year</label>
              <select className="input" value={selectedYear} onChange={e => setSelectedYear(+e.target.value)}>
                {[2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading.monthly} onClick={() => download('monthly', `month=${selectedMonth}&year=${selectedYear}`)}>
            {loading.monthly ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Generating...</> : '↓ Download Monthly Excel'}
          </button>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>What's included in reports?</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 12 }}>
          {[
            ['📋 Employee Details', 'Name, ID, department, designation'],
            ['⏰ Time Records', 'Check-in, check-out, work hours'],
            ['📊 Attendance Stats', 'Present/absent/late counts and %'],
            ['🏖️ Leave Data', 'Leave types taken and balance'],
            ['⚡ Overtime', 'Extra hours worked beyond 8h'],
            ['🏢 Dept Summary', 'Department-wise attendance breakdown'],
          ].map(([title, desc]) => (
            <div key={title} style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
              <div style={{ color: '#666', fontSize: 12 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
