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
import './AdminLayout.scss';

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
        <Layout className="admin-layout-container">
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                theme="light"
                width={250}
                className="admin-sidebar"
            >
                <div className={`admin-logo-section ${collapsed ? 'collapsed' : 'expanded'}`}>
                    <MenuOutlined
                        className="sidebar-toggle-icon"
                        onClick={() => setCollapsed(!collapsed)}
                    />
                    {!collapsed && (
                        <img src="/logo/logo.png" alt="Logo" className="admin-logo-img" />
                    )}
                </div>

                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    className="admin-menu"
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
            <Layout className="admin-main-layout" style={{ marginLeft: collapsed ? 80 : 250 }}>
                <Header className="admin-header">
                    <div className="header-search-wrapper">
                        <Input
                            placeholder="Tìm kiếm khóa học, bài viết, video, ..."
                            prefix={<SearchOutlined />}
                            className="admin-search-input"
                        />
                    </div>

                    <Space size={24} className="header-actions">
                        <Badge count={6} size="small" offset={[-2, 5]}>
                            <BellOutlined className="notification-icon" />
                        </Badge>

                        <div className="language-selector">
                            <GlobalOutlined className="lang-icon" />
                            <span className="lang-text">English</span>
                            <DownOutlined className="lang-arrow" />
                        </div>

                        <Dropdown menu={userMenu} trigger={['click']}>
                            <div className="user-profile-dropdown">
                                <Avatar
                                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'Admin')}&background=4880FF&color=fff`}
                                    size={40}
                                />
                                <div className="user-info">
                                    <span className="user-name">{user?.full_name || user?.username || 'Admin'}</span>
                                    <span className="user-role">
                                        {userRoles.map((r: any) => typeof r === 'string' ? r : r.name).join(', ')}
                                    </span>
                                </div>
                                <DownOutlined className="user-arrow" />
                            </div>
                        </Dropdown>
                    </Space>
                </Header>
                <Content className="admin-content">
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    );
};

export default AdminLayout;


