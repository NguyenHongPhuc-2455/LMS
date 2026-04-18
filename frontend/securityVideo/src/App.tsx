import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login, Register } from './pages';
import {
  AdminDashboard, CourseManagement, CourseRequests,
  LessonManagement, ProgramManagement, SectionManagement,
  UserManagement
} from './pages/admin';
import {
  CourseDetail, CourseLearning, CourseList,
  MyCourses, MyPrograms, PaymentResult,
  Profile, ProgramDetail, ProgramList
} from './pages/client';
import { MainLayout, AdminLayout } from './components';

import { App as AntdApp, ConfigProvider, theme } from 'antd';
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 12,
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f8fafc',
          fontFamily: "'Outfit', 'Inter', sans-serif",
        },
      }}
    >
      <AntdApp>
        <Router>
          <ScrollToTop />
          <Routes>

            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/course" replace />} />

            {/* Private SPA Routes with Header */}
            <Route element={<MainLayout />}>
              <Route path="/course" element={<CourseList />} />
              <Route path="/my-courses" element={<MyCourses />} />
              <Route path="/course/:id" element={<CourseDetail />} />
              <Route path="/course/:id/learning" element={<CourseLearning />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/payment-result" element={<PaymentResult />} />
              <Route path="/programs" element={<ProgramList />} />
              <Route path="/programs/:id" element={<ProgramDetail />} />
              <Route path="/my-programs" element={<MyPrograms />} />
            </Route>

            {/* Admin Routes with DashStack Layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="courses" element={<CourseManagement />} />
              <Route path="sections" element={<SectionManagement />} />
              <Route path="lessons" element={<LessonManagement />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="requests" element={<CourseRequests />} />
              <Route path="programs" element={<ProgramManagement />} />
              <Route path="profile" element={<Profile />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
