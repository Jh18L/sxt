import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';

// 用户端页面
import LoginPage from './pages/user/LoginPage';
import BindPage from './pages/user/BindPage';
import WelcomePage from './pages/user/WelcomePage';
import ProfilePage from './pages/user/ProfilePage';
import ExamListPage from './pages/user/ExamListPage';
import ExamDetailPage from './pages/user/ExamDetailPage';
import QuestionScorePage from './pages/user/QuestionScorePage';
import ScoreAnalysisPage from './pages/user/ScoreAnalysisPage';
import KnowledgeAnalysisPage from './pages/user/KnowledgeAnalysisPage';
import ScoreReportPage from './pages/user/ScoreReportPage';
import AboutPage from './pages/user/AboutPage';

// 管理端页面
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUserManagementPage from './pages/admin/AdminUserManagementPage';
import AdminReportManagementPage from './pages/admin/AdminReportManagementPage';
import AdminBlacklistPage from './pages/admin/AdminBlacklistPage';
import AdminLogsPage from './pages/admin/AdminLogsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminAnnouncementPage from './pages/admin/AdminAnnouncementPage';

// 受保护的路由组件
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';

const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* 用户端路由 */}
        <Route path="/login" element={<motion.div {...pageTransition}><LoginPage /></motion.div>} />
        <Route path="/bind" element={<ProtectedRoute><motion.div {...pageTransition}><BindPage /></motion.div></ProtectedRoute>} />
        <Route path="/welcome" element={<ProtectedRoute><motion.div {...pageTransition}><WelcomePage /></motion.div></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><motion.div {...pageTransition}><ProfilePage /></motion.div></ProtectedRoute>} />
        <Route path="/exams" element={<ProtectedRoute><motion.div {...pageTransition}><ExamListPage /></motion.div></ProtectedRoute>} />
        <Route path="/exam/:examId" element={<ProtectedRoute><motion.div {...pageTransition}><ExamDetailPage /></motion.div></ProtectedRoute>} />
        <Route path="/exam/:examId/question/:examCourseId" element={<ProtectedRoute><motion.div {...pageTransition}><QuestionScorePage /></motion.div></ProtectedRoute>} />
        <Route path="/exam/:examId/analysis/:examCourseId" element={<ProtectedRoute><motion.div {...pageTransition}><ScoreAnalysisPage /></motion.div></ProtectedRoute>} />
        <Route path="/exam/:examId/knowledge/:examCourseId" element={<ProtectedRoute><motion.div {...pageTransition}><KnowledgeAnalysisPage /></motion.div></ProtectedRoute>} />
        <Route path="/score-report" element={<ProtectedRoute><motion.div {...pageTransition}><ScoreReportPage /></motion.div></ProtectedRoute>} />
        <Route path="/about" element={<ProtectedRoute><motion.div {...pageTransition}><AboutPage /></motion.div></ProtectedRoute>} />

        {/* 管理端路由 */}
        <Route path="/admin/login" element={<motion.div {...pageTransition}><AdminLoginPage /></motion.div>} />
        <Route path="/admin" element={<AdminProtectedRoute><motion.div {...pageTransition}><AdminDashboardPage /></motion.div></AdminProtectedRoute>} />
        <Route path="/admin/users" element={<AdminProtectedRoute><motion.div {...pageTransition}><AdminUserManagementPage /></motion.div></AdminProtectedRoute>} />
        <Route path="/admin/reports" element={<AdminProtectedRoute><motion.div {...pageTransition}><AdminReportManagementPage /></motion.div></AdminProtectedRoute>} />
        <Route path="/admin/blacklist" element={<AdminProtectedRoute><motion.div {...pageTransition}><AdminBlacklistPage /></motion.div></AdminProtectedRoute>} />
        <Route path="/admin/logs" element={<AdminProtectedRoute><motion.div {...pageTransition}><AdminLogsPage /></motion.div></AdminProtectedRoute>} />
        <Route path="/admin/settings" element={<AdminProtectedRoute><motion.div {...pageTransition}><AdminSettingsPage /></motion.div></AdminProtectedRoute>} />
        <Route path="/admin/announcement" element={<AdminProtectedRoute><motion.div {...pageTransition}><AdminAnnouncementPage /></motion.div></AdminProtectedRoute>} />

        {/* 默认重定向 - 已登录用户跳转到欢迎页，未登录跳转到登录页 */}
        <Route path="/" element={<ProtectedRoute><Navigate to="/welcome" replace /></ProtectedRoute>} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
