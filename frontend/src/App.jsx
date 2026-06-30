import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminRoute } from './components/AdminRoute';
import InstallPrompt from './components/InstallPrompt';

// Public Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import CareerExplorer from './pages/CareerExplorer';
import CareerDetails from './pages/CareerDetails';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Protected User Pages
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ResumeBuilder from './pages/ResumeBuilder';
import SkillExplorer from './pages/SkillExplorer';
import SkillDetails from './pages/SkillDetails';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageCareers from './pages/admin/ManageCareers';
import ManageRoadmaps from './pages/admin/ManageRoadmaps';
import ManageResources from './pages/admin/ManageResources';
import ManageCareerResources from './pages/admin/ManageCareerResources';
import ManageUsers from './pages/admin/ManageUsers';
import ManageAnnouncements from './pages/admin/ManageAnnouncements';
import ManagePushNotifications from './pages/admin/ManagePushNotifications';

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <Router>
          <InstallPrompt />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/explorer" element={<CareerExplorer />} />
            <Route path="/career/:id" element={<CareerDetails />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/skills" element={<SkillExplorer />} />
            <Route path="/skill/:name" element={<SkillDetails />} />

            {/* Protected User Routes */}
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/resume" element={<ProtectedRoute><ResumeBuilder /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/careers" element={<AdminRoute><ManageCareers /></AdminRoute>} />
            <Route path="/admin/roadmaps" element={<AdminRoute><ManageRoadmaps /></AdminRoute>} />
            <Route path="/admin/resources" element={<AdminRoute><ManageResources /></AdminRoute>} />
            <Route path="/admin/career-resources" element={<AdminRoute><ManageCareerResources /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><ManageUsers /></AdminRoute>} />
            <Route path="/admin/announcements" element={<AdminRoute><ManageAnnouncements /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><ManagePushNotifications /></AdminRoute>} />

            {/* Catch all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
