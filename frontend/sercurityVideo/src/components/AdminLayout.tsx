import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { Layout, Menu, Input, Avatar, Dropdown, Badge, Space } from 'antd';
import {
    PieChartOutlined,
    BookOutlined,
    UserOutlined,
    ShoppingCartOutlined,
    CreditCardOutlined,
    MessageOutlined,
    MenuOutlined,
    BellOutlined,
    SearchOutlined,
    GlobalOutlined,
    DownOutlined,
    LogoutOutlined,
    CheckOutlined,
    MenuFoldOutlined,
    PlaySquareOutlined
} from '@ant-design/icons';

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
        <Layout style={{ minHeight: '100vh', background: '#F5F6FA', fontFamily: "'Outfit', 'Inter', sans-serif" }}>
            <Sider
                trigger={null}
                collapsible
                collapsed={collapsed}
                theme="light"
                width={250}
                style={{
                    borderRight: '1px solid #E0E0E0',
                    background: '#FFFFFF',
                    overflow: 'auto',
                    height: '100vh',
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    zIndex: 100
                }}
            >
                <div style={{
                    height: 70,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    padding: collapsed ? 0 : '0 28px',
                    gap: '16px',
                    borderBottom: '1px solid #F1F5F9'
                }}>
                    <MenuOutlined
                        style={{ fontSize: '20px', cursor: 'pointer', color: '#718096' }}
                        onClick={() => setCollapsed(!collapsed)}
                    />
                    {!collapsed && (
                        <div style={{
                            color: '#C82020',
                            fontSize: '20px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '-0.5px'
                        }}>
                            RITA VÕ<span style={{ fontSize: '12px', verticalAlign: 'top', fontWeight: 700 }}>®</span>
                        </div>
                    )}
                </div>

                {/* <div style={{ padding: '0 16px', marginBottom: '8px' }}>
                    {!collapsed && <div style={{ fontSize: '11px', fontWeight: 600, color: '#A0AEC0', marginBottom: 8, letterSpacing: '0.05em' }}>MAIN MENU</div>}
                </div> */}

                <Menu
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    style={{ borderRight: 0, padding: '0 10px' }}
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
                            key: '/admin/orders',
                            icon: <ShoppingCartOutlined />,
                            label: 'Đơn hàng',
                        },
                        {
                            key: '/admin/payments',
                            icon: <CreditCardOutlined />,
                            label: 'Thanh toán',
                        },
                        {
                            key: '/admin/reviews',
                            icon: <MessageOutlined />,
                            label: 'Thảo luận',
                        },
                    ]}
                />
            </Sider>
            <Layout style={{ marginLeft: collapsed ? 80 : 250, transition: 'all 0.2s ease 0s' }}>
                <Header style={{
                    padding: '0 24px',
                    background: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid #E0E0E0',
                    height: '70px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 99
                }}>
                    <div style={{ position: 'relative', width: '380px' }}>
                        <Input
                            placeholder="Tìm kiếm khóa học, bài viết, video, ..."
                            prefix={<SearchOutlined style={{ color: '#757575', fontSize: '18px', marginRight: '8px' }} />}
                            style={{
                                borderRadius: '20px',
                                background: '#FFF',
                                border: '2px solid #e8e8e8',
                                padding: '6px 18px',
                                height: '40px',
                                fontSize: '14px',
                                transition: 'all 0.2s ease',
                                boxShadow: 'none'
                            }}
                            className="search-input"
                        />
                    </div>

                    <Space size={24} style={{ display: 'flex', alignItems: 'center' }}>
                        <Badge count={6} size="small" offset={[-2, 5]}>
                            <BellOutlined style={{ fontSize: '20px', color: '#718096', cursor: 'pointer' }} />
                        </Badge>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                            <GlobalOutlined style={{ fontSize: '20px', color: '#718096' }} />
                            <span style={{ fontWeight: 500, color: '#4A5568' }}>English</span>
                            <DownOutlined style={{ fontSize: '10px', color: '#A0AEC0' }} />
                        </div>

                        <Dropdown menu={userMenu} trigger={['click']}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                                <Avatar
                                    src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'Admin')}&background=4880FF&color=fff`}
                                    size={40}
                                />
                                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                                    <span style={{ fontWeight: 600, color: '#2D3748' }}>{user?.full_name || user?.username || 'Admin'}</span>
                                    <span style={{ fontSize: '12px', color: '#A0AEC0', textTransform: 'capitalize' }}>
                                        {userRoles.map((r: any) => typeof r === 'string' ? r : r.name).join(', ')}
                                    </span>
                                </div>
                                <DownOutlined style={{ fontSize: '10px', color: '#A0AEC0' }} />
                            </div>
                        </Dropdown>
                    </Space>
                </Header>
                <Content style={{ padding: '24px 30px', minHeight: 280 }}>
                    <div className="animate-fade-in">
                        <Outlet />
                    </div>
                </Content>
            </Layout>
            <style>{`
                .ant-menu-light .ant-menu-item { border-radius: 8px; margin-bottom: 4px; color: #4A5568; }
                .ant-menu-light .ant-menu-item-selected { background-color: #4880FF !important; color: #FFFFFF !important; font-weight: 500; }
                .ant-menu-light .ant-menu-item-selected .anticon { color: #FFFFFF !important; }
                .ant-menu-light .ant-menu-item:hover:not(.ant-menu-item-selected) { background-color: #F7FAFC; }
                .f8-search-input:hover { border-color: #bdbdbd !important; }
                .f8-search-input:focus, .f8-search-input-focused { border-color: #444 !important; box-shadow: none !important; }
                .f8-search-input input::placeholder { color: #757575; font-weight: 400; }
            `}</style>
        </Layout>
    );
};

export default AdminLayout;
