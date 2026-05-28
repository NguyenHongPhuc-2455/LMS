import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { userService } from '../../services/user.service';
import { Layout, Input, Avatar, Dropdown, Space, Typography, Badge, Popover, List, Button, Empty } from 'antd';
import { SearchOutlined, UserOutlined, SettingOutlined, LogoutOutlined, BellOutlined, BookOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, MessageOutlined, DownOutlined } from '@ant-design/icons';
import { useNotifications, type Notification } from '../../hooks/useNotifications';
import { notification as antdNotification } from 'antd';
import { socketService } from '../../services/socket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from './AppHeader.module.scss';


dayjs.extend(relativeTime);

const { Header } = Layout;
const { Text, Paragraph } = Typography;

const AppHeader: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const {
        notifications,
        unreadCount,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications
    } = useNotifications(user?.id);

    const [profile, setProfile] = React.useState<any>(user);

    React.useEffect(() => {
        const fetchProfile = async () => {
            if (user) {
                try {
                    const data = await userService.getProfile();
                    setProfile(data);
                    // Cập nhật lại localStorage để các lần sau không bị lag
                    localStorage.setItem('user', JSON.stringify(data));
                } catch (e) {
                    console.error("Failed to fetch profile in header", e);
                }
            }
        };
        fetchProfile();
    }, []);

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
                    icon: null,
                    duration: 5,
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
        socketService.disconnect();
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
                <div className={styles.notifHeaderLeft}>
                    <Text strong className={styles.notifTitle}>Thông báo</Text>
                    {unreadCount > 0 && (
                        <div className={styles.notifNewCount}>
                            {unreadCount} thông báo mới
                        </div>
                    )}
                </div>
                <Space size={12}>
                    <Button type="link" size="small" onClick={markAllAsRead} className={styles.actionBtnRead}>
                        Đọc hết
                    </Button>
                    <Button type="link" size="small" onClick={deleteAllNotifications} className={styles.actionBtnClear}>
                        Xóa hết
                    </Button>
                </Space>
            </div>

            <List
                loading={loading}
                itemLayout="horizontal"
                dataSource={notifications}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có thông báo nào" /> }}
                renderItem={(item) => {
                    let icon = <BellOutlined />;
                    let iconClass = styles.iconGeneral;

                    if (item.type === 'COURSE_APPROVAL' || item.type === 'COURSE_ENROLLED' || item.type === 'NEW_MANDATORY_COURSE' || item.type === 'PROGRAM_ENROLLED' || item.type === 'NEW_MANDATORY_PROGRAM') {
                        icon = (item.type === 'COURSE_ENROLLED' || item.type === 'NEW_MANDATORY_COURSE' || item.type === 'PROGRAM_ENROLLED' || item.type === 'NEW_MANDATORY_PROGRAM') ? <BookOutlined /> : <CheckCircleOutlined />;
                        iconClass = styles.iconSuccess;
                    } else if (item.type === 'COURSE_REJECTION' || item.type === 'COURSE_OVERDUE' || item.type === 'PROGRAM_OVERDUE' || item.type === 'COURSE_OVERDUE_REPORT' || item.type === 'PROGRAM_OVERDUE_REPORT') {
                        icon = <CloseCircleOutlined />;
                        iconClass = styles.iconError;
                    } else if (item.type === 'COURSE_EXPIRING' || item.type === 'PROGRAM_EXPIRING') {
                        icon = <BellOutlined />;
                        iconClass = styles.iconGeneral;
                    }

                    return (
                        <List.Item
                            className={`${styles.notificationItem} ${item.is_read ? styles.read : styles.unread}`}
                            onClick={() => {
                                if (!item.is_read) markAsRead(item.id);
                                if (item.link) navigate(item.link);
                            }}
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
                            <div className={styles.notifItemIconWrap}>
                                <div className={`${styles.notifTypeIcon} ${iconClass}`}>
                                    {icon}
                                </div>
                            </div>
                            <List.Item.Meta
                                title={
                                    <div className={styles.notifItemTitleWrapper}>
                                        <Text strong className={styles.notifItemTitle}>{item.title}</Text>
                                        <Text className={styles.notifTime}>{dayjs(item.created_at).fromNow()}</Text>
                                    </div>
                                }
                                description={
                                    <Paragraph ellipsis={{ rows: 2 }} className={styles.notifItemDesc}>
                                        {item.message}
                                    </Paragraph>
                                }
                            />
                        </List.Item>
                    );
                }}
                className={styles.notificationList}
                loadMore={
                    hasMore && notifications.length > 0 && (
                        <div className={styles.loadMoreWrapper}>
                            <Button
                                type="link"
                                size="small"
                                onClick={loadMore}
                                loading={loadingMore}
                                className={styles.loadMoreBtn}
                            >
                                Tải thêm
                            </Button>
                        </div>
                    )
                }
            />

        </div>
    );

    return (
        <Header className={styles.appHeaderContainer}>
            {/* Left: Logo */}
            <div
                className={styles.appHeaderLogo}
                onClick={() => navigate('/home')}
                style={{ cursor: 'pointer' }}
            >
                <img src="/logo/logo.svg" alt="Logo" className={styles.logoImg} />
            </div>

            <div></div>

            {/* Right: User */}
            <Space size={24}>
                {!isAdminRoute && (
                    <div className={styles.searchInputWrapper}>
                        <Input
                            placeholder="Tìm kiếm khóa học, bài viết, video, ..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            prefix={<SearchOutlined />}
                            className={styles.appSearchInput}
                        />
                    </div>
                )}
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
                    <div className={styles.userProfileTrigger}>
                        <Avatar
                            src={profile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || profile?.username || 'U')}&background=4880FF&color=fff&size=200`}
                            icon={<UserOutlined />}
                            className={styles.headerUserAvatar}
                            size={38}
                        />
                        <Text strong className={styles.headerUserName}>
                            {profile?.full_name || profile?.username || 'User'}
                        </Text>
                        <DownOutlined className={styles.chevronIcon} />
                    </div>
                </Dropdown>
            </Space>
        </Header>
    );
};

export default AppHeader;


