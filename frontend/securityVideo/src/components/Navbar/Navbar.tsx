// Removed unused React import
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Layout, Menu, Space, Typography, Avatar, Dropdown, Button, Badge, Popover, List, Empty
} from 'antd';
import {
    DashboardOutlined, UserOutlined,
    LogoutOutlined, SettingOutlined, CrownOutlined,
    BellOutlined, DeleteOutlined
} from '@ant-design/icons';
import { useNotifications } from '../../hooks/useNotifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import './Navbar.scss';

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
        <div className="notification-container">
            <div className="notification-header">
                <Text strong className="notif-title">Thông báo</Text>
                <Space size={8}>
                    {unreadCount > 0 && (
                        <Button type="link" size="small" onClick={markAllAsRead} className="action-btn">
                            Đọc hết
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button type="link" danger size="small" onClick={deleteAllNotifications} className="action-btn">
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
                        className={`notification-item ${item.is_read ? 'read' : 'unread'}`}
                        onClick={() => !item.is_read && markAsRead(item.id)}
                        actions={[
                            <Button
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(item.id);
                                }}
                                className="delete-notif-btn"
                            />
                        ]}
                    >
                        <List.Item.Meta
                            title={
                                <div className="notif-item-title-wrapper">
                                    <Text strong={!item.is_read} className="notif-item-title">{item.title}</Text>
                                    <Text type="secondary" className="notif-time">{dayjs(item.created_at).fromNow()}</Text>
                                </div>
                            }
                            description={
                                <Text type={item.is_read ? 'secondary' : undefined} className="notif-item-desc">
                                    {item.message}
                                </Text>
                            }
                        />
                    </List.Item>
                )}
                className="notification-list"
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
        <Header className="navbar-header">
            {/* Logo Section */}
            <div
                className="navbar-logo-section"
                onClick={() => navigate('/')}
            >
                <img src="/logo/logo.png" alt="Logo" className="logo-img" />
            </div>

            {/* Navigation Menu */}
            <Menu
                mode="horizontal"
                selectedKeys={[location.pathname]}
                className="navbar-menu"
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
                            icon={<BellOutlined />}
                            className="bell-btn"
                        />
                    </Badge>
                </Popover>

                <div className="vertical-divider" />

                <Dropdown menu={userMenu} placement="bottomRight" arrow={{ pointAtCenter: true }} trigger={['click']}>
                    <div className="user-dropdown-trigger">
                        <div className="user-info-text">
                            <Text strong className="user-name-text">{user?.full_name || user?.username}</Text>
                            <Text className="user-role-text">{isAdmin ? 'Quản trị viên' : 'Học viên'}</Text>
                        </div>
                        <Avatar
                            src={user?.avatar}
                            size={44}
                            icon={<UserOutlined />}
                            className="user-navbar-avatar"
                        />
                    </div>
                </Dropdown>
            </Space>
        </Header>
    );
}


