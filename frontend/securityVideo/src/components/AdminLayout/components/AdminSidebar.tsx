import React from 'react';
import { Layout, Menu, Badge, Space } from 'antd';
import {
    PieChartOutlined,
    BookOutlined,
    UserOutlined,
    MenuFoldOutlined,
    PlaySquareOutlined,
    ApartmentOutlined,
    CheckOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import { statsService } from '../../../services/stats.service';
import { socketService } from '../../../services/socket';
import styles from '../AdminLayout.module.scss';

const { Sider } = Layout;

export default function AdminSidebar() {
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
            label: 'Dashboard',
        },
        {
            key: '/admin/courses',
            icon: <BookOutlined />,
            label: 'Khóa học',
        },
        {
            key: '/admin/sections',
            icon: <MenuFoldOutlined />,
            label: 'Chương học',
        },
        {
            key: '/admin/lessons',
            icon: <PlaySquareOutlined />,
            label: 'Bài giảng',
        },
        {
            key: '/admin/programs',
            icon: <ApartmentOutlined />,
            label: 'Chương trình học',
        },
        {
            key: '/admin/users',
            icon: <UserOutlined />,
            label: 'Học viên',
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
                            style={{ backgroundColor: '#ff4d4f' }}
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
                onClick={({ key }) => navigate(key)}
                items={menuItems}
            />
        </Sider>
    );
}
