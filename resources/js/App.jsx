import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe, fetchSettings, logoutUser } from './features/auth/authSlice';

// Pages
import LandingPage from './components/pages/Landing';
import LoginPage from './components/pages/Login';
import RegisterPage from './components/pages/Register';
import DashboardPage from './components/pages/Dashboard';
import CbtPage from './components/pages/Cbt';
import ForumPage from './components/pages/Forum';
import ElearningPage from './components/pages/Elearning';
import AdminLandingPage from './components/pages/Admin/Landing';
import AdminUsersPage from './components/pages/Admin/Users';
import AdminElearningPage, { AdminElearningCurriculumPage } from './components/pages/Admin/Elearning';
import { AdminCbtPage, AdminExamQuestionsPage } from './components/pages/Admin/Cbt';
import AdminRolesPage from './components/pages/Admin/Roles';
import AdminSettingsPage from './components/pages/Admin/Settings/AdminSettingsPage';
import AdminLearningPackagePage from './components/pages/Admin/LearningPackage/AdminLearningPackagePage';

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
    dispatch(fetchSettings());
    
    if (token) {
      // Check if session is still valid
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const idleTime = Date.now() - parseInt(lastActivity, 10);
        // 55 minutes logout threshold
        if (idleTime > 55 * 60 * 1000) {
          dispatch(logoutUser());
          localStorage.removeItem('lastActivity');
          return;
        }
      }
      dispatch(fetchMe());
    }
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
      <Route path="/elearning/:courseSlug" element={<PrivateRoute><ElearningPage /></PrivateRoute>} />
      <Route path="/forum" element={<PrivateRoute><ForumPage /></PrivateRoute>} />

      {/* Admin routes */}
      <Route path="/admin/landing" element={<PrivateRoute><AdminLandingPage /></PrivateRoute>} />
      <Route path="/admin/users" element={<PrivateRoute><AdminUsersPage /></PrivateRoute>} />
      <Route path="/admin/elearning" element={<PrivateRoute><AdminElearningPage /></PrivateRoute>} />
      <Route path="/admin/elearning/courses/:courseId/curriculum" element={<PrivateRoute><AdminElearningCurriculumPage /></PrivateRoute>} />
      <Route path="/admin/cbt" element={<PrivateRoute><AdminCbtPage /></PrivateRoute>} />
      <Route path="/admin/cbt/:examId/questions" element={<PrivateRoute><AdminExamQuestionsPage /></PrivateRoute>} />
      <Route path="/admin/roles" element={<PrivateRoute><AdminRolesPage /></PrivateRoute>} />
      <Route path="/admin/settings" element={<PrivateRoute><AdminSettingsPage /></PrivateRoute>} />
      <Route path="/admin/learning-packages" element={<PrivateRoute><AdminLearningPackagePage /></PrivateRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SessionManager>
  );
}
