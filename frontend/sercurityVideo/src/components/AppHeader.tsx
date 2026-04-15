import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Input, Avatar, Dropdown, Space, Typography, Badge, Popover, List, Button, Empty } from 'antd';
import { SearchOutlined, UserOutlined, SettingOutlined, LogoutOutlined, BellOutlined, BookOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined, MessageOutlined } from '@ant-design/icons';
import { useNotifications, type Notification } from '../hooks/useNotifications';
import { notification as antdNotification } from 'antd';
import { socketService } from '../services/socket';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

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
                    icon: newNotif.type === 'COURSE_APPROVAL' ?
                        <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                        newNotif.type === 'COMMENT_REPLY' ?
                            <MessageOutlined style={{ color: '#6366f1' }} /> :
                            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />,
                });
            };
            socket.on('newNotification', handleNewNotif);
            return () => {
                socket.off('newNotification', handleNewNotif);
            };
        }
    }, [user?.id]);

    const handleLogout = () => {
        localStorage.removeItem('token');
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
                            avatar={
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    background: item.type === 'COURSE_APPROVAL' ? '#f6ffed' : '#fff1f0',
                                    color: item.type === 'COURSE_APPROVAL' ? '#52c41a' : '#ff4d4f',
                                    fontSize: '14px'
                                }}>
                                    {item.type === 'COURSE_APPROVAL' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                                </div>
                            }
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

    return (
        <Header style={{
            background: '#FFF',
            padding: '0 28px',
            height: '66px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 1001,
            width: '100%',
        }}>
            {/* Left: Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => {
                setSearchTerm('');
                navigate('/course');
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <div style={{
                        margin: 0,
                        color: '#C82020',
                        fontSize: '22px',
                        fontWeight: 900,
                        letterSpacing: '-1px',
                        textTransform: 'uppercase'
                    }}>
                        RITA VÕ<span style={{ fontSize: '10px', verticalAlign: 'top' }}>®</span>
                    </div>
                    <Text style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Education Cloud
                    </Text>
                </div>
            </div>

            {/* Middle: Search */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 40px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
                    <Input
                        placeholder="Tìm kiếm khóa học, bài viết, video, ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                        className="f8-search-input"
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
                    <div title="Thông báo" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Badge dot={unreadCount > 0} offset={[2, 0]}>
                            <BellOutlined style={{ fontSize: '22px', color: '#495057' }} />
                        </Badge>
                    </div>
                </Popover>

                <Dropdown menu={userMenuItems} trigger={['click']}>
                    <Avatar
                        src={user?.avatar}
                        icon={<UserOutlined />}
                        style={{ cursor: 'pointer', border: '1px solid #f8f9fa' }}
                        size={38}
                    />
                </Dropdown>
            </Space>

            <style>{`
                .f8-search-input:hover {
                    border-color: #bdbdbd !important;
                }
                .f8-search-input:focus, .f8-search-input-focused {
                    border-color: #444 !important;
                    box-shadow: none !important;
                }
                .f8-search-input input::placeholder {
                    color: #757575;
                    font-weight: 400;
                }
                .notification-popover .ant-popover-inner {
                    padding: 12px 16px;
                    border-radius: 12px;
                }
                .notification-popover .ant-list-item:hover {
                    background: #f5f5f5 !important;
                }
            `}</style>
        </Header>
    );
};

export default AppHeader;
