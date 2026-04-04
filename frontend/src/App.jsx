import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import CameraCheck from './pages/CameraCheck';
import Interview from './pages/Interview';
import Processing from './pages/Processing';
import FeedbackReport from './pages/FeedbackReport';
import SessionComplete from './pages/SessionComplete';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
          <Route path="/check" element={<ProtectedRoute><CameraCheck /></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><Interview /></ProtectedRoute>} />
          <Route path="/processing" element={<ProtectedRoute><Processing /></ProtectedRoute>} />
          <Route path="/report/:answerId" element={<ProtectedRoute><FeedbackReport /></ProtectedRoute>} />
          <Route path="/session-complete" element={<ProtectedRoute><SessionComplete /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
