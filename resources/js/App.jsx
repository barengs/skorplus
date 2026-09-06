import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './features/auth/authSlice';

// Pages
import LandingPage from './components/pages/Landing';
import LoginPage from './components/pages/Login';
import RegisterPage from './components/pages/Register';
import DashboardPage from './components/pages/Dashboard';
import CbtPage from './components/pages/Cbt';
import ForumPage from './components/pages/Forum';
import ElearningPage from './components/pages/Elearning';
import RiasecPage from './components/pages/Riasec';
import AdminLandingPage from './components/pages/Admin/Landing';
import AdminUsersPage from './components/pages/Admin/Users';
import AdminElearningPage, { AdminElearningCurriculumPage } from './components/pages/Admin/Elearning';
import { AdminCbtPage, AdminExamQuestionsPage } from './components/pages/Admin/Cbt';
import AdminRolesPage from './components/pages/Admin/Roles';

// Route guard — redirects to /login if no token
function PrivateRoute({ children }) {
  const { token, user } = useSelector((s) => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

// Redirect if already logged in
function GuestRoute({ children }) {
  const token = useSelector((s) => s.auth.token);
  if (token) return <Navigate to="/dashboard" replace />;
  return children;
}

import SessionManager from './components/utils/SessionManager';

export default function App() {
  const dispatch = useDispatch();
  const token = useSelector((s) => s.auth.token);

  // Restore user from token on mount
  useEffect(() => {
    if (token) dispatch(fetchMe());
  }, []);

  return (
    <SessionManager>
      <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />

      {/* Guest routes */}
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/daftar" element={<GuestRoute><RegisterPage /></GuestRoute>} />

      {/* Protected routes */}
      <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="/cbt" element={<PrivateRoute><CbtPage /></PrivateRoute>} />
      <Route path="/elearning" element={<PrivateRoute><ElearningPage /></PrivateRoute>} />
      <Route path="/riasec" element={<PrivateRoute><RiasecPage /></PrivateRoute>} />
      <Route path="/forum" element={<PrivateRoute><ForumPage /></PrivateRoute>} />

      {/* Admin routes */}
      <Route path="/admin/landing" element={<PrivateRoute><AdminLandingPage /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute><AdminUsersPage /></PrivateRoute>} />
      <Route path="/admin/elearning" element={<PrivateRoute><AdminElearningPage /></PrivateRoute>} />
      <Route path="/admin/elearning/courses/:courseId/curriculum" element={<PrivateRoute><AdminElearningCurriculumPage /></PrivateRoute>} />
      <Route path="/admin/cbt" element={<PrivateRoute><AdminCbtPage /></PrivateRoute>} />
      <Route path="/admin/cbt/:examId/questions" element={<PrivateRoute><AdminExamQuestionsPage /></PrivateRoute>} />
      <Route path="/admin/roles" element={<PrivateRoute><AdminRolesPage /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionManager>
  );
}
