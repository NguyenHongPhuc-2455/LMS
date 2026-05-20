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
import styles from './Navbar.module.scss';


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
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
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
        <div className={styles.notificationContainer}>
            <div className={styles.notificationHeader}>
                <Text strong className={styles.notifTitle}>Thông báo</Text>
                <Space size={8}>
                    {unreadCount > 0 && (
                        <Button type="link" size="small" onClick={markAllAsRead} className={styles.actionBtn}>
                            Đọc hết
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button type="link" danger size="small" onClick={deleteAllNotifications} className={styles.actionBtn}>
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
                        className={`${styles.notificationItem} ${item.is_read ? styles.read : styles.unread}`}
                        onClick={() => !item.is_read && markAsRead(item.id)}
                        actions={[
                            <Button
                                key={`delete-${item.id}`}
                                type="text"
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    deleteNotification(item.id);
                                }}
                                className={styles.deleteNotifBtn}
                            />
                        ]}
                    >
                        <List.Item.Meta
                            title={
                                <div className={styles.notifItemTitleWrapper}>
                                    <Text strong={!item.is_read} className={styles.notifItemTitle}>{item.title}</Text>
                                    <Text type="secondary" className={styles.notifTime}>{dayjs(item.created_at).fromNow()}</Text>
                                </div>
                            }
                            description={
                                <Text type={item.is_read ? 'secondary' : undefined} className={styles.notifItemDesc}>
                                    {item.message}
                                </Text>
                            }
                        />
                    </List.Item>
                )}
                className={styles.notificationList}
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
        <Header className={styles.navbarHeader}>
            {/* Logo Section */}
            <div
                className={styles.navbarLogoSection}
                onClick={() => navigate('/')}
            >
                <img src="/logo/logo.svg" alt="Logo" className={styles.logoImg} />
            </div>

            {/* Navigation Menu */}
            <Menu
                mode="horizontal"
                selectedKeys={[location.pathname]}
                className={styles.navbarMenu}
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
                    <Badge count={unreadCount} offset={[-4, 4]}>
                        <Button
                            type="text"
                            icon={<BellOutlined />}
                            className={styles.bellBtn}
                        />
                    </Badge>
                </Popover>

                <div className={styles.verticalDivider} />

                <Dropdown menu={userMenu} placement="bottomRight" arrow={{ pointAtCenter: true }} trigger={['click']}>
                    <div className={styles.userDropdownTrigger}>
                        <div className={styles.userInfoText}>
                            <Text strong className={styles.userNameText}>{user?.full_name || user?.username}</Text>
                            <Text className={styles.userRoleText}>{isAdmin ? 'Quản trị viên' : 'nhân sự'}</Text>
                        </div>
                        <Avatar
                            src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || user?.username || 'U')}&background=4880FF&color=fff&size=200`}
                            size={44}
                            icon={<UserOutlined />}
                            className={styles.userNavbarAvatar}
                        />
                    </div>
                </Dropdown>
            </Space>
        </Header>
    );
}


