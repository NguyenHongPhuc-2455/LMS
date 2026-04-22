import { Layout, Input, Badge, Space, Dropdown, Avatar, Popover, List, Typography, Button, Empty } from 'antd';
import {
    SearchOutlined,
    BellOutlined,
    GlobalOutlined,
    DownOutlined,
    UserOutlined,
    LogoutOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../../hooks/useNotifications';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import styles from '../AdminLayout.module.scss';

dayjs.extend(relativeTime);

const { Header } = Layout;
const { Text } = Typography;

interface AdminHeaderProps {
    user: any;
    userRoles: any[];
}

export default function AdminHeader({ user, userRoles }: AdminHeaderProps) {
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        deleteAllNotifications
    } = useNotifications(user?.id);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const userMenuItems = [
        { key: '1', label: 'Tài khoản', icon: <UserOutlined />, onClick: () => navigate('/admin/profile') },
        { key: '2', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
    ];

    const notificationContent = (
        <div className={styles.notificationContainer}>
            <div className={styles.notificationHeader}>
                <Text strong>Thông báo</Text>
                <Space size={8}>
                    {unreadCount > 0 && (
                        <Button type="link" size="small" onClick={markAllAsRead}>
                            Đọc hết
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button type="link" danger size="small" onClick={deleteAllNotifications}>
                            Xóa hết
                        </Button>
                    )}
                </Space>
            </div>
            <List
                loading={loading}
                itemLayout="horizontal"
                dataSource={notifications}
                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Không có thông báo mới" /> }}
                renderItem={(item) => (
                    <List.Item
                        className={`${styles.notificationItem} ${item.is_read ? styles.read : styles.unread}`}
                        onClick={() => {
                            if (!item.is_read) markAsRead(item.id);
                            if (item.link) navigate(item.link);
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
                            />
                        ]}
                    >
                        <List.Item.Meta
                            title={<Text strong={!item.is_read}>{item.title}</Text>}
                            description={
                                <div className={styles.notifMeta}>
                                    <Text type="secondary" style={{ fontSize: '12px' }}>{item.message}</Text>
                                    <br />
                                    <Text type="secondary" className={styles.notifTime}>{dayjs(item.created_at).fromNow()}</Text>
                                </div>
                            }
                        />
                    </List.Item>
                )}
                className={styles.notificationList}
            />
        </div>
    );

    return (
        <Header className={styles.adminHeader}>
            <div className={styles.headerSearchWrapper}>
                <Input
                    placeholder="Tìm kiếm khóa học, bài viết, video, ..."
                    prefix={<SearchOutlined />}
                    className={styles.adminSearchInput}
                />
            </div>

            <Space size={24} className={styles.headerActions}>
                <Popover
                    content={notificationContent}
                    trigger="click"
                    placement="bottomRight"
                    overlayClassName="notification-popover"
                >
                    <div style={{ cursor: 'pointer' }}>
                        <Badge count={unreadCount} size="small" offset={[-2, 5]}>
                            <BellOutlined className={styles.notificationIcon} />
                        </Badge>
                    </div>
                </Popover>

                <div className={styles.languageSelector}>
                    <GlobalOutlined className={styles.langIcon} />
                    <span className={styles.langText}>English</span>
                    <DownOutlined className={styles.langArrow} />
                </div>

                <Dropdown menu={{ items: userMenuItems }} trigger={['click']}>
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
    );
}
