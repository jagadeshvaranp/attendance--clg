import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
import api from '../utils/api';

export default function QRScanner() {
  const [scanType, setScanType] = useState('checkin');
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [html5Qr, setHtml5Qr] = useState(null);
  const scannerRef = useRef(null);
  const isScanning = useRef(false);

  const startScanner = async () => {
    if (isScanning.current) return;
    try {
      const scanner = new Html5Qrcode('qr-reader');
      setHtml5Qr(scanner);

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          if (isScanning.current) return;
          isScanning.current = true;

          try {
            const { data } = await api.post('/attendance/scan', {
              qrData: decodedText,
              scanType,
            });

            setLastScan({ ...data, timestamp: new Date() });
            setRecentLogs(prev => [{ ...data, timestamp: new Date() }, ...prev.slice(0, 9)]);
            toast.success(data.message);
          } catch (err) {
            toast.error(err.response?.data?.message || 'Scan failed');
          } finally {
            setTimeout(() => { isScanning.current = false; }, 3000);
          }
        },
        () => {}
      );
      setScanning(true);
    } catch (err) {
      toast.error('Camera not available. Please allow camera access.');
    }
  };

  const stopScanner = async () => {
    if (html5Qr && scanning) {
      try { await html5Qr.stop(); } catch {}
      setScanning(false);
      isScanning.current = false;
    }
  };

  useEffect(() => { return () => { stopScanner(); }; }, [html5Qr]);

  return (
    <div className="page fade-in">
      <h1 className="page-title">◈ QR Scanner</h1>
      <p className="page-subtitle">Open camera, show employee QR badge to mark attendance</p>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Scanner */}
        <div style={{ flex: '0 0 360px' }}>
          {/* Type Toggle */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {['checkin', 'checkout'].map(t => (
              <button key={t} onClick={() => setScanType(t)} style={{
                flex: 1, padding: 12, borderRadius: 10, border: `2px solid ${scanType === t ? (t === 'checkin' ? '#4ecdc4' : '#ff6b6b') : 'rgba(255,255,255,0.1)'}`,
                background: scanType === t ? (t === 'checkin' ? 'rgba(78,205,196,0.1)' : 'rgba(255,107,107,0.1)') : 'transparent',
                color: scanType === t ? (t === 'checkin' ? '#4ecdc4' : '#ff6b6b') : '#666',
                cursor: 'pointer', fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase',
                transition: 'all 0.2s',
              }}>{t === 'checkin' ? '→ Check IN' : '← Check OUT'}</button>
            ))}
          </div>

          {/* Camera Box */}
          <div className="card" style={{ padding: 20 }}>
            <div style={{
              position: 'relative', borderRadius: 12, overflow: 'hidden',
              border: `2px solid ${scanning ? (scanType === 'checkin' ? '#4ecdc4' : '#ff6b6b') : 'rgba(255,255,255,0.1)'}`,
              minHeight: 280, background: '#050508',
            }}>
              <div id="qr-reader" style={{ width: '100%' }} />
              {!scanning && (
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                  <div style={{ fontSize: 56, opacity: 0.3 }}>📷</div>
                  <p style={{ color: '#555', fontSize: 13 }}>Camera not started</p>
                </div>
              )}
              {/* Corner brackets */}
              {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v, h]) => (
                <div key={`${v}${h}`} style={{
                  position: 'absolute', [v]: 12, [h]: 12, width: 22, height: 22,
                  borderTop: v === 'top' ? `2px solid ${scanType === 'checkin' ? '#4ecdc4' : '#ff6b6b'}` : 'none',
                  borderBottom: v === 'bottom' ? `2px solid ${scanType === 'checkin' ? '#4ecdc4' : '#ff6b6b'}` : 'none',
                  borderLeft: h === 'left' ? `2px solid ${scanType === 'checkin' ? '#4ecdc4' : '#ff6b6b'}` : 'none',
                  borderRight: h === 'right' ? `2px solid ${scanType === 'checkin' ? '#4ecdc4' : '#ff6b6b'}` : 'none',
                  pointerEvents: 'none', zIndex: 2,
                }} />
              ))}
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              {!scanning ? (
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={startScanner}>
                  📷 Start Camera
                </button>
              ) : (
                <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={stopScanner}>
                  ⏹ Stop Camera
                </button>
              )}
            </div>
          </div>

          {/* Last scan result */}
          {lastScan && (
            <div style={{
              marginTop: 16, padding: 16, borderRadius: 12,
              background: lastScan.type === 'checkin' ? 'rgba(78,205,196,0.1)' : 'rgba(255,107,107,0.1)',
              border: `1px solid ${lastScan.type === 'checkin' ? 'rgba(78,205,196,0.3)' : 'rgba(255,107,107,0.3)'}`,
              animation: 'fadeIn 0.3s ease',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, marginBottom: 4 }}>✓ {lastScan.employee?.name}</div>
                  <div style={{ color: '#888', fontSize: 12 }}>{lastScan.employee?.department} • {lastScan.employee?.employeeId}</div>
                  <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>{lastScan.message}</div>
                </div>
                <span className={`badge badge-${lastScan.type === 'checkin' ? 'present' : 'absent'}`}>{lastScan.type === 'checkin' ? 'IN' : 'OUT'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Log */}
        <div style={{ flex: 1, minWidth: 280 }}>
          <div className="card">
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>Scan History</h3>
            {recentLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#555' }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>◈</div>
                <p style={{ fontSize: 13 }}>No scans yet. Start scanning.</p>
              </div>
            ) : (
              recentLogs.map((log, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: i < recentLogs.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                  <div>
                    <div style={{ color: '#ddd', fontSize: 13, fontWeight: 600 }}>{log.employee?.name}</div>
                    <div style={{ color: '#555', fontSize: 11 }}>{log.employee?.department} • {log.timestamp?.toLocaleTimeString()}</div>
                  </div>
                  <span className={`badge badge-${log.type === 'checkin' ? 'present' : 'absent'}`}>{log.type === 'checkin' ? 'IN' : 'OUT'}</span>
                </div>
              ))
            )}
          </div>

          <div className="card" style={{ marginTop: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Instructions</h3>
            {['Click "Start Camera" to activate the camera', 'Toggle between Check IN / Check OUT mode', 'Employee shows their QR code badge to camera', 'System auto-detects and logs the attendance', 'Confirmation shown instantly on screen'].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(108,99,255,0.2)', color: '#6c63ff', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                <p style={{ fontSize: 13, color: '#888' }}>{step}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
