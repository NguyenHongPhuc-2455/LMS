import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, theme, Skeleton } from 'antd';

import { MainLayout, AdminLayout } from '@/components';
import { ROUTES } from './constants/routes';
import api from './services/api';

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
const UserManagement = lazy(() => import('./pages/admin/UserManagement/UserManagement'));
const CourseRequestManagement = lazy(() => import('./pages/admin/CourseRequestManagement/CourseRequestManagement'));
const ProgramManagement = lazy(() => import('./pages/admin/ProgramManagement/ProgramManagement'));
const CategoryManagement = lazy(() => import('./pages/admin/CategoryManagement/CategoryManagement'));
const CourseProgress = lazy(() => import('./pages/admin/CourseProgress/CourseProgress'));
const BannerManagement = lazy(() => import('./pages/admin/BannerManagement/BannerManagement'));
const UnifiedContent = lazy(() => import('./pages/admin/UnifiedContent/UnifiedContent'));
const DepartmentManagement = lazy(() => import('./pages/admin/DepartmentManagement/DepartmentManagement'));
const OnboardingReport = lazy(() => import('./pages/admin/OnboardingReport/OnboardingReport'));
const PositionManagement = lazy(() => import('./pages/admin/PositionManagement/PositionManagement'));
const RoleManagement = lazy(() => import('./pages/admin/RoleManagement/RoleManagement'));
const ManagerEmployees = lazy(() => import('./pages/admin/ManagerEmployees/ManagerEmployees'));

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

function App() {
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const res = await api.get('system/settings');
        if (res.data && res.data.status === 'success') {
          const settings = res.data.data;
          localStorage.setItem('system_settings', JSON.stringify(settings));
          
          // Cập nhật lại baseURL nếu đang chạy qua ngrok
          const isNgrok = window.location.hostname.includes('ngrok');
          if (isNgrok && settings.ngrok_be_url) {
            api.defaults.baseURL = settings.ngrok_be_url.replace(/\/$/, '') + '/api/';
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải cấu hình hệ thống khởi động:', error);
      }
    };
    fetchSystemSettings();
  }, []);

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#C72127',
          borderRadius: 5,
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
              <Route path={ROUTES.LOGIN} element={<Login />} />
              <Route path={ROUTES.REGISTER} element={<Register />} />
              <Route path="/" element={<Navigate to={ROUTES.HOME} replace />} />

              {/* Private SPA Routes with Header */}
              <Route element={<MainLayout />}>
                <Route path={ROUTES.HOME} element={<Home />} />
                <Route path={ROUTES.COURSE_LIST} element={<CourseList />} />
                <Route path={ROUTES.CATEGORIES || "/categories"} element={<CategorizedCourses />} />
                <Route path="/categories/:id" element={<CategoryCourseView />} />
                <Route path={ROUTES.MY_COURSES} element={<MyCourses />} />
                <Route path="/course/:id" element={<CourseDetail />} />
                <Route path="/course/:id/learning" element={<CourseLearning />} />
                <Route path={ROUTES.PROFILE} element={<Profile />} />
                <Route path={ROUTES.PROGRAMS} element={<ProgramList />} />
                <Route path="/programs/:id" element={<ProgramDetail />} />
                <Route path={ROUTES.MY_PROGRAMS} element={<MyPrograms />} />
                <Route path={ROUTES.CONTACT} element={<Contact />} />
              </Route>

              {/* Admin Routes with DashStack Layout */}
              <Route path={ROUTES.ADMIN_DASHBOARD} element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="courses" element={<UnifiedContent />} />
                <Route path="courses/:courseId/sections" element={<UnifiedContent />} />
                <Route path="courses/:courseId/sections/:sectionId/lessons" element={<UnifiedContent />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="requests" element={<CourseRequestManagement />} />
                <Route path="programs" element={<ProgramManagement />} />
                <Route path="categories" element={<CategoryManagement />} />
                <Route path="progress" element={<CourseProgress />} />
                <Route path="banners" element={<BannerManagement />} />
                <Route path="departments" element={<DepartmentManagement />} />
                <Route path="positions" element={<PositionManagement />} />
                <Route path="roles" element={<RoleManagement />} />
                <Route path="onboarding-report" element={<OnboardingReport />} />
                <Route path="manager/employees" element={<ManagerEmployees />} />
                <Route path="profile" element={<Profile />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />
            </Routes>
          </Suspense>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
