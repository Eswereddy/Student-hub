import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './components/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StudentPortal from './pages/StudentPortal';
import FacultyPortal from './pages/FacultyPortal';
import ParentPortal from './pages/ParentPortal';
import AdminPortal from './pages/AdminPortal';
import AIAdminPortal from './pages/AIAdminPortal';

const ProtectedRoute: React.FC<{ children: React.ReactNode; roles?: string[] }> = ({ children, roles }) => {
  const { user, profile, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );

  if (!user) return <Navigate to="/login" />;

  if (roles && profile && !roles.includes(profile.role)) {
    return <Navigate to="/" />;
  }

  return <Layout>{children}</Layout>;
};

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />

          <Route path="/student" element={
            <ProtectedRoute roles={['student', 'admin', 'ai_admin']}>
              <StudentPortal />
            </ProtectedRoute>
          } />

          <Route path="/faculty" element={
            <ProtectedRoute roles={['faculty', 'admin', 'ai_admin']}>
              <FacultyPortal />
            </ProtectedRoute>
          } />

          <Route path="/parent" element={
            <ProtectedRoute roles={['parent', 'admin', 'ai_admin']}>
              <ParentPortal />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute roles={['admin', 'ai_admin']}>
              <AdminPortal />
            </ProtectedRoute>
          } />

          <Route path="/ai-admin" element={
            <ProtectedRoute roles={['ai_admin', 'admin']}>
              <AIAdminPortal />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
