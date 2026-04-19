import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import QRScanner from './pages/QRScanner';
import Employees from './pages/Employees';
import Leaves from './pages/Leaves';
import Reports from './pages/Reports';
import Tasks from './pages/Tasks';
import MyAttendance from './pages/MyAttendance';
import MyLeaves from './pages/MyLeaves';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children, adminOnly }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="attendance" element={<ProtectedRoute adminOnly><Attendance /></ProtectedRoute>} />
        <Route path="scanner" element={<ProtectedRoute adminOnly><QRScanner /></ProtectedRoute>} />
        <Route path="employees" element={<ProtectedRoute adminOnly><Employees /></ProtectedRoute>} />
        <Route path="leaves" element={<ProtectedRoute adminOnly><Leaves /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute adminOnly><Reports /></ProtectedRoute>} />
        <Route path="tasks" element={<Tasks />} />
        <Route path="my-attendance" element={<MyAttendance />} />
        <Route path="my-leaves" element={<MyLeaves />} />
        <Route path="profile" element={<Profile />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
return (
  <AuthProvider>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppRoutes />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: 'rgba(8, 20, 35, 0.96)',
            color: '#edf4ff',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            boxShadow: '0 18px 34px rgba(2, 8, 23, 0.32)',
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#03111f' } },
          error: { iconTheme: { primary: '#fb7185', secondary: '#03111f' } },
        }}
      />
    </BrowserRouter>
  </AuthProvider>
);
}
