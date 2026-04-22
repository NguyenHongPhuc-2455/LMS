import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider, theme } from 'antd';
import styles from './AdminLayout.module.scss';

// New specialized components
import AdminSidebar from './components/AdminSidebar';
import AppHeader from '../AppHeader/AppHeader';

const { Content } = Layout;

const AdminLayout: React.FC = () => {
    // Kiểm tra Auth & Role
    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    // Kiểm tra role (Hỗ trợ cả mảng string ['admin'] hoặc mảng object [{name: 'admin'}])
    const userRoles = user?.roles || [];
    const isAdmin = userRoles.some((r: any) => {
        const roleName = typeof r === 'string' ? r : r.name;
        return ['admin', 'manager'].includes(roleName?.toLowerCase());
    });

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (!isAdmin) {
        return <Navigate to="/course" replace />;
    }

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.defaultAlgorithm,
                token: {
                    borderRadius: 8,
                    borderRadiusLG: 8,
                    borderRadiusSM: 8,
                    borderRadiusXS: 8,
                },
                components: {
                    Table: {
                        headerBg: '#B8121A',
                        headerColor: '#ffffff',
                        headerSortHoverBg: '#B8121A',
                        headerSortActiveBg: '#B8121A',
                        headerBorderRadius: 8,
                    },
                    Menu: {
                        itemSelectedColor: '#C72127',
                        itemActiveBg: 'rgba(199, 33, 39, 0.05)',
                        itemSelectedBg: 'rgba(199, 33, 39, 0.05)',
                    },
                    Card: {
                        borderRadiusLG: 0,
                    },
                    Button: {
                        borderRadius: 8,
                        borderRadiusLG: 8,
                        borderRadiusSM: 8,
                    },
                    Input: {
                        borderRadius: 8,
                    },
                    Select: {
                        borderRadius: 8,
                    },
                    Pagination: {
                        itemActiveBg: '#B8121A',
                        itemActiveColor: '#ffffff',
                        borderRadius: 8,
                        itemSize: 32,
                    }
                }
            }}
        >
            <Layout className={styles.adminLayoutContainer}>
                <AppHeader />

                <Layout className={styles.adminMainLayout}>
                    <AdminSidebar />

                    <Content className={styles.adminContent}>
                        <div className="animate-fade-in">
                            <Outlet />
                        </div>
                    </Content>
                </Layout>
            </Layout>
        </ConfigProvider>
    );
};

export default AdminLayout;
