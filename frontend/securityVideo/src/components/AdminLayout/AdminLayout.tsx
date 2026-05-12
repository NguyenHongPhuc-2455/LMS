import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Layout, ConfigProvider, theme, Drawer, Button } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import styles from './AdminLayout.module.scss';

// New specialized components
import AdminSidebar from './components/AdminSidebar';
import AppHeader from '../AppHeader/AppHeader';

const { Content } = Layout;

const AdminLayout: React.FC = () => {
    const [drawerVisible, setDrawerVisible] = React.useState(false);

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
                        itemSelectedColor: 'C72127',
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
                        itemActiveBg: '#8F000D',
                        itemActiveColor: '#ffffff',
                        borderRadius: 8,
                        itemSize: 32,
                    }
                }
            }}
        >
            <Layout className={styles.adminLayoutContainer}>
                <AppHeader />

                {/* Mobile/Tablet Menu Button */}
                <Button
                    className={styles.mobileMenuToggle}
                    icon={<MenuOutlined />}
                    onClick={() => setDrawerVisible(true)}
                />

                <Layout className={styles.adminMainLayout}>
                    {/* Desktop Sidebar */}
                    <AdminSidebar />

                    {/* Mobile/Tablet Drawer */}
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
