import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Layout, Menu, Space, Typography, Avatar, Dropdown
} from 'antd';
import {
    DashboardOutlined, BookOutlined, UserOutlined,
    LogoutOutlined, SettingOutlined, CrownOutlined
} from '@ant-design/icons';

const { Header } = Layout;
const { Text, Title } = Typography;

export default function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    let user = null;
    try {
        const userStr = localStorage.getItem('user');
        user = userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        console.error('Lỗi parse user data');
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
            icon: <BookOutlined />,
            label: 'Khóa học',
            onClick: () => navigate('/course')
        },
        isAdmin && {
            key: '/',
            icon: <DashboardOutlined />,
            label: 'Admin Panel',
            onClick: () => navigate('/')
        },
        isAdmin && {
            key: '/admin/users',
            icon: <CrownOutlined />,
            label: 'Hệ thống User',
            onClick: () => navigate('/admin/users')
        }
    ].filter(Boolean) as any[];

    if (location.pathname === '/login' || location.pathname === '/register') return null;

    const userMenu = {
        items: [
            { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined /> },
            { key: 'settings', label: 'Cài đặt', icon: <SettingOutlined /> },
            { type: 'divider' as const },
            { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
        ]
    };

    return (
        <Header style={{
            background: '#ffffff',
            padding: '0 40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            height: '70px',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            borderBottom: '1px solid #f0f0f0'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => navigate('/')}>
                <div style={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, #0061ff 0%, #d11b22 100%)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <CrownOutlined style={{ color: 'white', fontSize: '20px' }} />
                </div>
                <Title level={4} style={{ margin: 0, color: '#1e293b', letterSpacing: '1px', fontWeight: 700 }}>RitaVo <span style={{ fontWeight: 400, fontSize: '14px', color: '#64748b' }}>LMS</span></Title>
            </div>

            <Menu
                mode="horizontal"
                selectedKeys={[location.pathname]}
                style={{
                    flex: 1,
                    justifyContent: 'center',
                    borderBottom: 'none',
                    background: 'transparent',
                    fontWeight: 500
                }}
                items={menuItems}
            />
            <Space size={20}>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                    <Text strong style={{ color: '#1e293b' }}>{user?.username || 'Guest'}</Text>
                    <Text style={{ color: '#64748b', fontSize: '11px' }}>{isAdmin ? 'Quản trị viên' : 'Học viên'}</Text>
                </div>
                <Dropdown menu={userMenu} placement="bottomRight" arrow>
                    <Avatar
                        src={user?.avatar}
                        size={42}
                        icon={<UserOutlined />}
                        style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', border: '2px solid rgba(255, 255, 255, 0.2)' }}
                    />
                </Dropdown>
            </Space>
        </Header>
    );
}
