import React, { useState, memo, useMemo } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider, theme, Drawer, Button, Tooltip } from 'antd';
import { MenuOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import styles from './AdminLayout.module.scss';

import AdminSidebar from './components/AdminSidebar';
import AppHeader from '../AppHeader/AppHeader';
import { SidebarProvider, useSidebar } from '@/context/SidebarContext';

const { Content } = Layout;

// Component phụ để cô lập việc re-render của Sidebar và Nút Toggle
const AdminSidebarWrapper = memo(() => {
    const { collapsed, setCollapsed } = useSidebar();
    
    return (
        <div className={styles.sidebarWrapper}>
            <AdminSidebar collapsed={collapsed} />
            
            <Tooltip title={collapsed ? "Mở rộng menu" : "Thu gọn menu"} placement="right">
                <Button 
                    type="text"
                    className={`${styles.collapseToggle} ${collapsed ? styles.collapsed : ''}`}
                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                    onClick={() => setCollapsed(!collapsed)}
                />
            </Tooltip>
        </div>
    );
});

AdminSidebarWrapper.displayName = 'AdminSidebarWrapper';

// Component để cô lập phần Content, ngăn không cho render lại khi collapsed thay đổi
const AdminContentContainer = memo(({ children }: { children: React.ReactNode }) => {
    return (
        <Content className={styles.adminContent}>
            {children}
        </Content>
    );
});

AdminContentContainer.displayName = 'AdminContentContainer';

const AdminLayoutInner: React.FC = () => {
    const [drawerVisible, setDrawerVisible] = useState(false);
    const { collapsed } = useSidebar(); // Lắng nghe để cập nhật class CSS nếu cần, nhưng không render lại Content

    const token = localStorage.getItem('accessToken');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const memoizedContent = useMemo(() => <Outlet />, []);

    const userRoles = user?.roles || [];
    const isAdmin = userRoles.some((r: any) => {
        const roleName = typeof r === 'string' ? r : r.name;
        return ['admin', 'manager'].includes(roleName?.toLowerCase());
    });

    if (!token) return <Navigate to="/login" replace />;
    if (!isAdmin) return <Navigate to="/course" replace />;

    return (
        <Layout className={styles.adminLayoutContainer}>
            <AppHeader />

            <Button
                className={styles.mobileMenuToggle}
                icon={<MenuOutlined />}
                onClick={() => setDrawerVisible(true)}
            />

            <Layout className={styles.adminMainLayout}>
                <AdminSidebarWrapper />

                <Drawer
                    placement="left"
                    onClose={() => setDrawerVisible(false)}
                    destroyOnHidden={true}
                    open={drawerVisible}
                    width={250}
                    styles={{ body: { padding: 0 } }}
                    className={styles.adminDrawer}
                >
                    <AdminSidebar isMobile onClose={() => setDrawerVisible(false)} />
                </Drawer>

                {/* Outlet được giữ cố định, không render lại khi sidebar đóng/mở */}
                <AdminContentContainer>
                    {memoizedContent}
                </AdminContentContainer>
            </Layout>
        </Layout>
    );
};

const AdminLayout: React.FC = () => {
    return (
        <ConfigProvider
            theme={{
                algorithm: theme.defaultAlgorithm,
                token: { borderRadius: 8 },
                components: {
                    Table: { headerBg: '#B8121A', headerColor: '#ffffff' },
                    Menu: {
                        itemSelectedColor: '#C72127',
                        itemActiveBg: 'rgba(199, 33, 39, 0.05)',
                        itemSelectedBg: 'rgba(199, 33, 39, 0.05)',
                    }
                }
            }}
        >
            <SidebarProvider>
                <AdminLayoutInner />
            </SidebarProvider>
        </ConfigProvider>
    );
};

export default AdminLayout;
