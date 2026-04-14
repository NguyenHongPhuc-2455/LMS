import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Layout, Menu, Space, Typography, Avatar, Dropdown, Button, Badge
} from 'antd';
import {
    DashboardOutlined, BookOutlined, UserOutlined,
    LogoutOutlined, SettingOutlined, CrownOutlined,
    BellOutlined
} from '@ant-design/icons';

const { Header } = Layout;
const { Text } = Typography;

/**
 * Premium Header Component cho SPA
 */
export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    let user = null;
    try {
        const userStr = localStorage.getItem('user');
        user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        localStorage.removeItem('user');
    }

    const isAdmin = user?.roles?.includes('admin');

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const menuItems = [
        {
            key: '/course',
            label: 'Khóa học',
            onClick: () => navigate('/course')
        },
        // {
        //     key: '/',
        //     icon: <DashboardOutlined />,
        //     label: isAdmin ? 'Admin Panel' : 'Bảng điều khiển',
        //     onClick: () => navigate('/')
        // },
        isAdmin && {
            key: '/admin',
            icon: <DashboardOutlined />,
            label: 'Quản trị hệ thống',
            onClick: () => navigate('/admin')
        },
        isAdmin && {
            key: '/admin/users',
            icon: <CrownOutlined />,
            label: 'Quản lý thành viên',
            onClick: () => navigate('/admin/users')
        }
    ].filter(Boolean) as any[];

    const userMenu = {
        items: [
            isAdmin && { key: 'admin', label: 'Trang quản trị', icon: <DashboardOutlined />, onClick: () => navigate('/admin') },
            { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined />, onClick: () => navigate('/profile') },
            { key: 'settings', label: 'Cài đặt', icon: <SettingOutlined /> },
            { type: 'divider' as const },
            { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
        ]
    };

    return (
        <Header style={{
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(10px)',
            padding: '0 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '72px',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            borderBottom: '1px solid rgba(0, 0, 0, 0.05)',
            boxShadow: '0 4px 30px rgba(0, 0, 0, 0.03)'
        }}>
            {/* Logo Section */}
            <div
                style={{ display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer' }}
                onClick={() => navigate('/')}
            >
                {/* <div style={{
                    width: 42,
                    height: 42,
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    boxShadow: '0 8px 16px rgba(99, 102, 241, 0.25)'
                }}>
                    <CrownOutlined style={{ color: 'white', fontSize: '22px' }} />
                </div> */}
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <div style={{
                        margin: 0,
                        color: '#C82020',
                        fontSize: '24px',
                        fontWeight: 900,
                        letterSpacing: '-1px',
                        textTransform: 'uppercase',
                        fontFamily: "'Inter', sans-serif"
                    }}>
                        RITA VÕ<span style={{ fontSize: '10px', verticalAlign: 'top', marginLeft: '2px' }}>®</span>
                    </div>
                    <Text style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Education Cloud
                    </Text>
                </div>
            </div>

            {/* Navigation Menu */}
            <Menu
                mode="horizontal"
                selectedKeys={[location.pathname]}
                style={{
                    flex: 1,
                    borderBottom: 'none',
                    background: 'transparent',
                    fontWeight: 600,
                    fontSize: '15px'
                }}
                items={menuItems}
            />

            {/* Right Actions */}
            <Space size={24}>
                <Badge dot color="#6366f1" offset={[-4, 4]}>
                    <Button
                        type="text"
                        icon={<BellOutlined style={{ fontSize: '20px', color: '#64748b' }} />}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    />
                </Badge>

                <div style={{ height: '32px', width: '1px', background: '#e2e8f0' }} />

                <Dropdown menu={userMenu} placement="bottomRight" arrow={{ pointAtCenter: true }} trigger={['click']}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <div style={{ textAlign: 'right', display: 'none', flexDirection: 'column', lineHeight: '1.2' }} className="user-info-text">
                            <Text strong style={{ color: '#1e293b', fontSize: '14px' }}>{user?.full_name || user?.username}</Text>
                            <Text style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 600 }}>{isAdmin ? 'Quản trị viên' : 'Học viên'}</Text>
                        </div>
                        <Avatar
                            src={user?.avatar}
                            size={44}
                            icon={<UserOutlined />}
                            style={{
                                background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                                border: '2px solid white',
                                boxShadow: '0 4px 10px rgba(99, 102, 241, 0.2)'
                            }}
                        />
                    </div>
                </Dropdown>
            </Space>

            <style>{`
                @media (min-width: 768px) {
                    .user-info-text { display: flex !important; }
                }
                .ant-menu-horizontal > .ant-menu-item::after {
                    border-bottom-width: 3px !important;
                    border-radius: 4px;
                }
            `}</style>
        </Header>
    );
}
