// Removed unused React import
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Layout, Menu, Space, Typography, Avatar, Dropdown, Button, Badge, Popover, List, Empty
} from 'antd';
import {
    DashboardOutlined, UserOutlined,
    LogoutOutlined, SettingOutlined, CrownOutlined,
    BellOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useNotifications } from '../hooks/useNotifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

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

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications
    } = useNotifications(user?.id);

    const notificationContent = (
        <div style={{ width: '310px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', padding: '0 4px' }}>
                <Text strong style={{ fontSize: '14px' }}>Thông báo</Text>
                <Space size={8}>
                    {unreadCount > 0 && (
                        <Button type="link" size="small" onClick={markAllAsRead} style={{ padding: 0, fontSize: '11px' }}>
                            Đọc hết
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button type="link" danger size="small" onClick={deleteAllNotifications} style={{ padding: 0, fontSize: '11px' }}>
                            Xóa hết
                        </Button>
                    )}
                </Space>
            </div>
            <List
                loading={loading}
                itemLayout="horizontal"
                dataSource={notifications}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có thông báo nào" /> }}
                renderItem={(item) => (
                    <List.Item
                        style={{
                            padding: '8px 10px',
                            cursor: 'pointer',
                            background: item.is_read ? 'transparent' : '#f0f7ff',
                            borderRadius: '8px',
                            marginBottom: '4px',
                            transition: 'all 0.2s',
                            border: 'none'
                        }}
                        onClick={() => !item.is_read && markAsRead(item.id)}
                        actions={[
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined style={{ color: '#ff4d4f', fontSize: '12px' }} />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(item.id);
                                }}
                                style={{ width: '24px', height: '24px', padding: 0 }}
                            />
                        ]}
                    >
                        <List.Item.Meta
                            title={
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                                    <Text strong={!item.is_read} style={{ fontSize: '12px', lineHeight: '1.4', flex: 1 }}>{item.title}</Text>
                                    <Text type="secondary" style={{ fontSize: '10px', whiteSpace: 'nowrap' }}>{dayjs(item.created_at).fromNow()}</Text>
                                </div>
                            }
                            description={
                                <Text type={item.is_read ? 'secondary' : undefined} style={{ fontSize: '11px', lineHeight: '1.4', display: 'block', marginTop: '2px' }}>
                                    {item.message}
                                </Text>
                            }
                        />
                    </List.Item>
                )}
                style={{ maxHeight: '400px', overflowY: 'auto' }}
            />
        </div>
    );

    const menuItems = [
        {
            key: '/course',
            label: 'Khóa học',
            onClick: () => navigate('/course')
        },
        {
            key: '/my-courses',
            label: 'Khóa học của tôi',
            onClick: () => navigate('/my-courses')
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
            { key: 'my-courses', label: 'Khóa học của tôi', icon: <CrownOutlined />, onClick: () => navigate('/my-courses') },
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
                <img src="/logo/logo.png" alt="Logo" style={{ height: '50px', objectFit: 'contain' }} />
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
                <Popover
                    content={notificationContent}
                    trigger="click"
                    placement="bottomRight"
                    overlayClassName="notification-popover"
                >
                    <Badge dot={unreadCount > 0} offset={[-4, 4]}>
                        <Button
                            type="text"
                            icon={<BellOutlined style={{ fontSize: '20px', color: '#64748b' }} />}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        />
                    </Badge>
                </Popover>

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
