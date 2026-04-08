import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import api from './services/api';
import ServerStatus from './components/ServerStatus';

import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Setup from './pages/Setup';
import CameraCheck from './pages/CameraCheck';
import Interview from './pages/Interview';
import Processing from './pages/Processing';
import FeedbackReport from './pages/FeedbackReport';
import SessionDetail from './pages/SessionDetail';
import SessionComplete from './pages/SessionComplete';
import Profile from './pages/Profile';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [wakingUp, setWakingUp] = useState(false);

  useEffect(() => {
    // Check if we've already confirmed the server is awake in this session
    const isAlreadyAwake = sessionStorage.getItem('mockvue_server_awake') === 'true';

    // Initial ping to wake up the backend if it's sleeping
    const timeout = setTimeout(() => {
      // Only show the waking up UI if server hasn't responded within 5s
      // and we haven't previously confirmed it's awake.
      if (!sessionStorage.getItem('mockvue_server_awake')) {
        setWakingUp(true);
      }
    }, 5000); // Increased threshold to 5s for better UX on slow connections

    // Ping with cache busting
    api.get(`/?t=${Date.now()}`).then(() => {
      clearTimeout(timeout);
      setWakingUp(false);
      sessionStorage.setItem('mockvue_server_awake', 'true');
    }).catch(() => {
      // Even on error, we stop the "waking up" UI if the server replied
      clearTimeout(timeout);
      setWakingUp(false);
    });
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ServerStatus wakingUp={wakingUp} />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
          <Route path="/check" element={<ProtectedRoute><CameraCheck /></ProtectedRoute>} />
          <Route path="/interview" element={<ProtectedRoute><ErrorBoundary><Interview /></ErrorBoundary></ProtectedRoute>} />
          <Route path="/processing" element={<ProtectedRoute><Processing /></ProtectedRoute>} />
          <Route path="/report/:answerId" element={<ProtectedRoute><FeedbackReport /></ProtectedRoute>} />
          <Route path="/session/:sessionId" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
          <Route path="/session-complete" element={<ProtectedRoute><ErrorBoundary><SessionComplete /></ErrorBoundary></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
