import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, theme, Skeleton } from 'antd';

import { MainLayout, AdminLayout } from '@/components';

// Shared Components
const Profile = lazy(() => import('./pages/client/Profile/Profile'));

// Public Pages
const Login = lazy(() => import('./pages/Login/Login'));
const Register = lazy(() => import('./pages/Register/Register'));

// Client Pages
const Home = lazy(() => import('./pages/client/Home/Home'));
const CourseList = lazy(() => import('./pages/client/CourseList/CourseList'));
const CategorizedCourses = lazy(() => import('./pages/client/CategorizedCourses/CategorizedCourses'));
const CategoryCourseView = lazy(() => import('./pages/client/CategoryCourseView/CategoryCourseView'));
const MyCourses = lazy(() => import('./pages/client/MyCourses/MyCourses'));
const CourseDetail = lazy(() => import('./pages/client/CourseDetail/CourseDetail'));
const CourseLearning = lazy(() => import('./pages/client/CourseLearning/CourseLearning'));
const ProgramList = lazy(() => import('./pages/client/ProgramList/ProgramList'));
const ProgramDetail = lazy(() => import('./pages/client/ProgramDetail/ProgramDetail'));
const MyPrograms = lazy(() => import('./pages/client/MyPrograms/MyPrograms'));
const Contact = lazy(() => import('./pages/client/Contact/Contact'));

// Admin Pages
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard/AdminDashboard'));
const CourseManagement = lazy(() => import('./pages/admin/CourseManagement/CourseManagement'));
const SectionManagement = lazy(() => import('./pages/admin/SectionManagement/SectionManagement'));
const LessonManagement = lazy(() => import('./pages/admin/LessonManagement/LessonManagement'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement/UserManagement'));
const CourseRequestManagement = lazy(() => import('./pages/admin/CourseRequestManagement/CourseRequestManagement'));
const ProgramManagement = lazy(() => import('./pages/admin/ProgramManagement/ProgramManagement'));
const CategoryManagement = lazy(() => import('./pages/admin/CategoryManagement/CategoryManagement'));
const CourseProgress = lazy(() => import('./pages/admin/CourseProgress/CourseProgress'));

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
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
        },
        components: {
          Menu: {
            itemSelectedColor: '#C72127',
            itemSelectedBg: 'rgba(199, 33, 39, 0.05)',
          },
        },
      }}
    >
      <AntdApp>
        <Router>
          <ScrollToTop />
          <Suspense fallback={<div style={{ padding: '24px' }}><Skeleton active paragraph={{ rows: 10 }} /></div>}>
            <Routes>

              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/" element={<Navigate to="/home" replace />} />

              {/* Private SPA Routes with Header */}
              <Route element={<MainLayout />}>
                <Route path="/home" element={<Home />} />
                <Route path="/course" element={<CourseList />} />
                <Route path="/categories" element={<CategorizedCourses />} />
                <Route path="/categories/:id" element={<CategoryCourseView />} />
                <Route path="/my-courses" element={<MyCourses />} />
                <Route path="/course/:id" element={<CourseDetail />} />
                <Route path="/course/:id/learning" element={<CourseLearning />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/programs" element={<ProgramList />} />
                <Route path="/programs/:id" element={<ProgramDetail />} />
                <Route path="/my-programs" element={<MyPrograms />} />
                <Route path="/contact" element={<Contact />} />
              </Route>

              {/* Admin Routes with DashStack Layout */}
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="sections" element={<SectionManagement />} />
                <Route path="lessons" element={<LessonManagement />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="requests" element={<CourseRequestManagement />} />
                <Route path="programs" element={<ProgramManagement />} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="progress" element={<CourseProgress />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
