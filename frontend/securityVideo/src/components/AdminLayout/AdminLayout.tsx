import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Layout } from 'antd';
import styles from './AdminLayout.module.scss';

// New specialized components
import AdminSidebar from './components/AdminSidebar';
import AdminHeader from './components/AdminHeader';

const { Content } = Layout;

const AdminLayout: React.FC = () => {
    const [collapsed, setCollapsed] = useState(false);

    // Kiểm tra Auth & Role
    const token = localStorage.getItem('token');
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
        <Layout className={styles.adminLayoutContainer}>
            <AdminSidebar collapsed={collapsed} setCollapsed={setCollapsed} />

            <Layout className={styles.adminMainLayout} style={{ marginLeft: collapsed ? 80 : 250 }}>
                <AdminHeader user={user} userRoles={userRoles} />

                <Content className={styles.adminContent}>
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;
