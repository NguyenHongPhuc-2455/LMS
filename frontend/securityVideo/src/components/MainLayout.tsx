import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import AppFooter from './AppFooter';
import { Layout } from 'antd';

const { Content } = Layout;

/**
 * MainLayout dành cho các trang SPA có kèm Header (Navbar)
 * Giúp quản lý cấu trúc trang tập trung
 */
const MainLayout: React.FC = () => {
    // Check Auth - Nếu chưa login thì văng ra login
    const isAuthenticated = !!localStorage.getItem('token');

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Layout style={{ minHeight: '100vh', background: '#FFFFFF' }}>
            <AppHeader />
            <Layout style={{ display: 'flex', flexDirection: 'row', background: '#FFFFFF' }}>
                <Sidebar />
                <Content style={{
                    minHeight: 'calc(100vh - 66px)',
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1
                }}>
                    <div className="animate-fade-in" style={{ width: '100%', padding: '24px 40px', flex: 1 }}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>
            <AppFooter />
        </Layout>
    );
};

export default MainLayout;
