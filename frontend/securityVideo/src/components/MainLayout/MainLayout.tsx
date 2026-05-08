import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar, AppHeader, AppFooter } from '../';

import { Layout } from 'antd';
import styles from './MainLayout.module.scss';

const { Content } = Layout;

/**
 * MainLayout dành cho các trang SPA có kèm Header (Navbar)
 * Giúp quản lý cấu trúc trang tập trung
 */
const MainLayout: React.FC = () => {
    // Check Auth - Nếu chưa login thì văng ra login
    const isAuthenticated = !!localStorage.getItem('accessToken');

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return (
        <Layout className={styles.mainLayout}>
            <AppHeader />
            <Layout className={styles.mainLayoutBody}>
                <Sidebar />
                <Content className={styles.mainContent}>
                    <div className={`animate-fade-in ${styles.pageWrapper}`}>
                        <Outlet />
                    </div>
                </Content>
            </Layout>
            {/* <AppFooter /> */}
        </Layout>
    );
};


export default MainLayout;


