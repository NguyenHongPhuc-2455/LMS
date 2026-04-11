import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CourseList from './pages/CourseList';
import Course from './pages/Course';
import UserManagement from './pages/UserManagement';
import Navbar from './components/Navbar';
import type { JSX } from 'react';
import { App as AntdApp, ConfigProvider, theme } from 'antd';

function App() {
  const PrivateRoute = ({ children }: { children: JSX.Element }) => {
    return localStorage.getItem('token') ? children : <Navigate to="/login" />;
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#6366f1',
          borderRadius: 12,
          colorBgContainer: '#ffffff',
          colorBgLayout: '#f8fafc',
        },
      }}
    >
      <AntdApp>
        <Router>
          <div className="app-container" style={{ minHeight: '100vh', background: '#f8fafc', color: '#0f172a' }}>
            <Navbar />
            <div className="main-content">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/course" element={<PrivateRoute><CourseList /></PrivateRoute>} />
                <Route path="/course/:id" element={<PrivateRoute><Course /></PrivateRoute>} />
                <Route path="/admin/users" element={<PrivateRoute><UserManagement /></PrivateRoute>} />
                <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              </Routes>
            </div>
          </div>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
