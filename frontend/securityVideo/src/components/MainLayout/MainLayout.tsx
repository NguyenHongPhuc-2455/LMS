import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar, AppHeader, AppFooter } from '../';

import { Layout } from 'antd';
import './MainLayout.scss';

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
        <Layout className="main-layout">
            <AppHeader />
            <Layout className="main-layout-body">
                <Sidebar />
                <Content className="main-content">
                    <div className="animate-fade-in page-wrapper">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
            <AppFooter />
        </Layout>
    );
};

export default MainLayout;


