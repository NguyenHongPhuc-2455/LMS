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
    PictureOutlined,
    ClusterOutlined,
    WarningOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { statsService } from '../../../services/stats.service';
import { socketService } from '../../../services/socket';
import { ROUTES } from '../../../constants/routes';
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
            key: ROUTES.ADMIN_DASHBOARD,
            icon: <PieChartOutlined />,
            label: 'Tổng quan',
        },
        {
            key: ROUTES.ADMIN_COURSES,
            icon: <BookOutlined />,
            label: 'Quản lý nội dung',
        },
        {
            key: ROUTES.ADMIN_PROGRAMS,
            icon: <ApartmentOutlined />,
            label: 'Quản lý lộ trình học',
        },
        {
            key: ROUTES.ADMIN_CATEGORIES,
            icon: <TagsOutlined />,
            label: 'Quản lý danh mục',
        },
        {
            key: ROUTES.ADMIN_PROGRESS,

            icon: <LineChartOutlined />,
            label: 'Quản lý tiến độ học tập',
        },
        {
            key: ROUTES.ADMIN_USERS,
            icon: <UserOutlined />,
            label: 'Quản lý nhân sự',
        },
        {
            key: ROUTES.ADMIN_DEPARTMENTS,
            icon: <ClusterOutlined />,
            label: 'Quản lý phòng ban',
        },
        {
            key: ROUTES.ADMIN_BANNERS,
            icon: <PictureOutlined />,
            label: 'Quản lý Banner Home',
        },
        {
            key: ROUTES.ADMIN_REQUESTS,
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
        },
        {
            key: ROUTES.ADMIN_ONBOARDING_REPORT,
            icon: <WarningOutlined style={{ color: '#fa8c16' }} />,
            label: 'Báo cáo Hội nhập',
        }
    ];

    // ✅ Tìm menu key phù hợp nhất (prefix dài nhất) để highlight đúng khi URL là nested
    const menuKeys = menuItems.map(item => item.key);
    const selectedKey = menuKeys
        .filter(key => location.pathname === key || location.pathname.startsWith(key + '/'))
        .sort((a, b) => b.length - a.length)[0] || location.pathname;

    return (
        <Sider
            theme="light"
            width={250}
            className={styles.adminSidebar}
        >
            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
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
