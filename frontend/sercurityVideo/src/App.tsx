import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/admin/Dashboard';
import CourseList from './pages/client/CourseList';
import CourseLearning from './pages/client/CourseLearning';
import CourseDetail from './pages/client/CourseDetail';
import UserManagement from './pages/admin/UserManagement';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Profile from './pages/client/Profile';
import MyCourses from './pages/client/MyCourses';
import PaymentResult from './pages/client/PaymentResult';
import { App as AntdApp, ConfigProvider, theme } from 'antd';

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
            </Route>

            {/* Admin Routes with DashStack Layout */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="courses" element={<Dashboard />} />
              <Route path="users" element={<UserManagement />} />
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
