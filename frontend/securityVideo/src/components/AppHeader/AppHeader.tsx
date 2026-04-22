import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Input, Avatar, Dropdown, Space, Typography, Badge, Popover, List, Button, Empty } from 'antd';
import { SearchOutlined, UserOutlined, SettingOutlined, LogoutOutlined, BellOutlined, BookOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import { useNotifications, type Notification } from '../../hooks/useNotifications';
import { notification as antdNotification } from 'antd';
import { socketService } from '../../services/socket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './AppHeader.module.scss';


dayjs.extend(relativeTime);

const { Header } = Layout;
const { Text } = Typography;

const AppHeader: React.FC = () => {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications
    } = useNotifications(user?.id);

    // Lắng nghe Toast thông báo (riêng cho AppHeader)
    useEffect(() => {
        const socket = socketService.getSocket();
        if (socket) {
            const handleNewNotif = (newNotif: Notification) => {
                antdNotification.info({
                    message: newNotif.title,
                    description: newNotif.message,
                    placement: 'bottomRight',
                    onClick: () => {
                        if (newNotif.link) {
                            navigate(newNotif.link);
                            antdNotification.destroy();
                        }
                    },
                    className: newNotif.link ? styles.cursorPointer : '',
                    icon: newNotif.type === 'COURSE_APPROVAL' ?
                        <CheckCircleOutlined className={styles.iconSuccess} /> :
                        newNotif.type === 'COMMENT_REPLY' ?
                            <MessageOutlined className={styles.iconPrimary} /> :
                            <CloseCircleOutlined className={styles.iconError} />,
                });
            };
            socket.on('newNotification', handleNewNotif);
            return () => {
                socket.off('newNotification', handleNewNotif);
            };
        }
    }, [user?.id]);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const userMenuItems = {
        items: [
            { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined />, onClick: () => navigate('/profile') },
            { key: 'my-courses', label: 'Khóa học của tôi', icon: <BookOutlined />, onClick: () => navigate('/my-courses') },
            { key: 'settings', label: 'Cài đặt', icon: <SettingOutlined /> },
            { type: 'divider' as const },
            { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
        ]
    };

    const [searchTerm, setSearchTerm] = React.useState('');

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== '') {
                navigate(`/course?search=${encodeURIComponent(searchTerm)}`);
            } else if (window.location.pathname === '/course') {
                navigate('/course');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, navigate]);

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
                        onClick={() => {
                            if (!item.is_read) markAsRead(item.id);
                            if (item.link) {
                                navigate(item.link);
                            }
                        }}
                        actions={[
                            <Button
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

    return (
        <Header className={styles.appHeaderContainer}>
            {/* Left: Logo */}
            <div className={styles.appHeaderLogo} onClick={() => {
                setSearchTerm('');
                navigate('/course');
            }}>
                <img src="/logo/logo.png" alt="Logo" className={styles.logoImg} />
            </div>

            {/* Middle: Search */}
            <div className={styles.headerSearchMiddle}>
                <div className={styles.searchInputWrapper}>
                    <Input
                        placeholder="Tìm kiếm khóa học, bài viết, video, ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        prefix={<SearchOutlined />}
                        className={styles.appSearchInput}
                    />
                </div>
            </div>

            {/* Right: User */}
            <Space size={24}>
                <Popover
                    content={notificationContent}
                    trigger="click"
                    placement="bottomRight"
                    overlayClassName="notification-popover"
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                >
                    <div title="Thông báo" className={styles.headerNotifTrigger}>
                        <Badge count={unreadCount} offset={[2, 0]}>
                            <BellOutlined />
                        </Badge>
                    </div>
                </Popover>

                <Dropdown menu={userMenuItems} trigger={['click']}>
                    <Avatar
                        src={user?.avatar}
                        icon={<UserOutlined />}
                        className={styles.headerUserAvatar}
                        size={38}
                    />
                </Dropdown>
            </Space>
        </Header>
    );
};

export default AppHeader;


