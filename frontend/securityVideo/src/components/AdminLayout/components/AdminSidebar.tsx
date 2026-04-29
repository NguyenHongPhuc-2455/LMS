import React from 'react';
import { Layout, Menu, Badge, Space } from 'antd';
import {
    PieChartOutlined,
    BookOutlined,
    UserOutlined,
    MenuFoldOutlined,
    PlaySquareOutlined,
    ApartmentOutlined,
    CheckOutlined,
    LineChartOutlined,
    TagsOutlined,
    PictureOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { statsService } from '../../../services/stats.service';
import { socketService } from '../../../services/socket';
import styles from '../AdminLayout.module.scss';

const { Sider } = Layout;

interface AdminSidebarProps {
    isMobile?: boolean;
    onClose?: () => void;
}

export default function AdminSidebar({ isMobile, onClose }: AdminSidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();

    const [pendingCount, setPendingCount] = React.useState<number>(0);

    const fetchCounts = React.useCallback(async () => {
        try {
            const data = await statsService.getDashboardStats();
            setPendingCount(data.overview.pendingRequests || 0);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id;

    React.useEffect(() => {
        fetchCounts();

        if (userId) {
            // Đảm bảo kết nối Socket và đăng ký và lắng nghe
            const socket = socketService.connect(userId);

            socket.on('updatePendingRequestCount', (data: { count: number }) => {
                setPendingCount(data.count);
            });

            return () => {
                socket.off('updatePendingRequestCount');
            };
        }
    }, [userId, fetchCounts]);

    const menuItems = [
        {
            key: '/admin',
            icon: <PieChartOutlined />,
            label: 'Tổng quan',
        },
        {
            key: '/admin/courses',
            icon: <BookOutlined />,
            label: 'Quản lý khóa học',
        },
        {
            key: '/admin/sections',
            icon: <MenuFoldOutlined />,
            label: 'Quản lý chương học',
        },
        {
            key: '/admin/lessons',
            icon: <PlaySquareOutlined />,
            label: 'Quản lý bài giảng',
        },
        {
            key: '/admin/programs',
            icon: <ApartmentOutlined />,
            label: 'Quản lý lộ trình học',
        },
        {
            key: '/admin/categories',
            icon: <TagsOutlined />,
            label: 'Quản lý danh mục',
        },
        {
            key: '/admin/progress',

            icon: <LineChartOutlined />,
            label: 'Quản lý tiến độ học tập',
        },
        {
            key: '/admin/users',
            icon: <UserOutlined />,
            label: 'Quản lý học viên',
        },
        {
            key: '/admin/banners',
            icon: <PictureOutlined />,
            label: 'Quản lý Banner Home',
        },
        {
            key: '/admin/requests',
            icon: <CheckOutlined />,
            label: (
                <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                    <span>Duyệt yêu cầu</span>
                    {pendingCount > 0 && (
                        <Badge
                            count={pendingCount}
                            style={{ backgroundColor: '#C72127' }}
                            size="small"
                        />
                    )}
                </Space>
            ),
        }
    ];

    return (
        <Sider
            theme="light"
            width={250}
            className={styles.adminSidebar}
        >
            <Menu
                mode="inline"
                selectedKeys={[location.pathname]}
                className={styles.adminMenu}
                onClick={({ key }) => {
                    navigate(key);
                    if (isMobile && onClose) onClose();
                }}
                items={menuItems}
            />
        </Sider>
    );
}
