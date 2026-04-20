import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Input, Avatar, Dropdown, Badge, Space } from 'antd';
import {
    PieChartOutlined,
    BookOutlined,
    UserOutlined,
    MenuOutlined,
    BellOutlined,
    SearchOutlined,
    GlobalOutlined,
    DownOutlined,
    LogoutOutlined,
    CheckOutlined,
    MenuFoldOutlined,
    PlaySquareOutlined,
    ApartmentOutlined
} from '@ant-design/icons';
import styles from './AdminLayout.module.scss';


const { Header, Sider, Content } = Layout;

const AdminLayout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const userMenu = {
        items: [
            { key: '1', label: 'Tài khoản', icon: <UserOutlined />, onClick: () => navigate('/admin/profile') },
            { key: '2', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
        ]
    };

    return (
        <Layout className={styles.adminLayoutContainer}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                theme="light"
                width={250}
                className={styles.adminSidebar}
            >
                <div className={`${styles.adminLogoSection} ${collapsed ? styles.collapsed : styles.expanded}`}>
                    <MenuOutlined
                        className={styles.sidebarToggleIcon}
                        onClick={() => setCollapsed(!collapsed)}
                    />
                    {!collapsed && (
                        <img src="/logo/logo.png" alt="Logo" className={styles.adminLogoImg} />
                    )}
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    className={styles.adminMenu}
                    onClick={({ key }) => navigate(key)}
                    items={[
                        {
                            key: '/admin',
                            icon: <PieChartOutlined />,
                            label: 'Dashboard',
                        },
                        {
                            key: '/admin/courses',
                            icon: <BookOutlined />,
                            label: 'Khóa học',
                        },
                        {
                            key: '/admin/sections',
                            icon: <MenuFoldOutlined />,
                            label: 'Chương học',
                        },
                        {
                            key: '/admin/lessons',
                            icon: <PlaySquareOutlined />,
                            label: 'Bài giảng',
                        },
                        {
                            key: '/admin/users',
                            icon: <UserOutlined />,
                            label: 'Học viên',
                        },
                        {
                            key: '/admin/requests',
                            icon: <CheckOutlined />,
                            label: 'Duyệt yêu cầu',
                        },
                        {
                            key: '/admin/programs',
                            icon: <ApartmentOutlined />,
                            label: 'Chương trình học',
                        },


                        // {
                        //     key: '/admin/orders',
                        //     icon: <ShoppingCartOutlined />,
                        //     label: 'Đơn hàng',
                        // },
                        // {
                        //     key: '/admin/payments',
                        //     icon: <CreditCardOutlined />,
                        //     label: 'Thanh toán',
                        // },
                        // {
                        //     key: '/admin/reviews',
                        //     icon: <MessageOutlined />,
                        //     label: 'Thảo luận',
                        // },
                    ]}
                />
            </Sider>
            <Layout className={styles.adminMainLayout} style={{ marginLeft: collapsed ? 80 : 250 }}>
                <Header className={styles.adminHeader}>
                    <div className={styles.headerSearchWrapper}>
                        <Input
                            placeholder="Tìm kiếm khóa học, bài viết, video, ..."
                            prefix={<SearchOutlined />}
                            className={styles.adminSearchInput}
                        />
                    </div>

                    <Space size={24} className={styles.headerActions}>
                        <Badge count={6} size="small" offset={[-2, 5]}>
                            <BellOutlined className={styles.notificationIcon} />
                        </Badge>

                        <div className={styles.languageSelector}>
                            <GlobalOutlined className={styles.langIcon} />
                            <span className={styles.langText}>English</span>
                            <DownOutlined className={styles.langArrow} />
                        </div>

                        <Dropdown menu={userMenu} trigger={['click']}>
                            <div className={styles.userProfileDropdown}>
                                <Avatar
                                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'Admin')}&background=4880FF&color=fff`}
                                    size={40}
                                />
                                <div className={styles.userInfo}>
                                    <span className={styles.userName}>{user?.full_name || user?.username || 'Admin'}</span>
                                    <span className={styles.userRole}>
                                        {userRoles.map((r: any) => typeof r === 'string' ? r : r.name).join(', ')}
                                    </span>
                                </div>
                                <DownOutlined className={styles.userArrow} />
                            </div>
                        </Dropdown>
                    </Space>
                </Header>
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


