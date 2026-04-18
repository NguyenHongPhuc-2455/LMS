import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import CourseManagement from './pages/admin/CourseManagement';
import SectionManagement from './pages/admin/SectionManagement';
import LessonManagement from './pages/admin/LessonManagement';
import CourseList from './pages/client/CourseList';
import CourseLearning from './pages/client/CourseLearning';
import CourseDetail from './pages/client/CourseDetail';
import UserManagement from './pages/admin/UserManagement';
import MainLayout from './components/MainLayout';
import AdminLayout from './components/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Profile from './pages/client/Profile';
import MyCourses from './pages/client/MyCourses';
import CourseRequests from './pages/admin/CourseRequests';
import PaymentResult from './pages/client/PaymentResult';
import ProgramManagement from './pages/admin/ProgramManagement';
import ProgramList from './pages/client/ProgramList';
import ProgramDetail from './pages/client/ProgramDetail';
import MyPrograms from './pages/client/MyPrograms';
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
