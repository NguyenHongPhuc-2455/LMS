import React, { memo } from 'react';
import { Layout, Menu, Badge, Space } from 'antd';
import {
    PieChartOutlined,
    BookOutlined,
    UserOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    PlaySquareOutlined,
    ApartmentOutlined,
    CheckOutlined,
    LineChartOutlined,
    TagsOutlined,
    PictureOutlined,
    ClusterOutlined,
    WarningOutlined,
    IdcardOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { statsService } from '../../../services/stats.service';
import { departmentService } from '../../../services/department.service';
import { socketService } from '../../../services/socket';
import { ROUTES } from '../../../constants/routes';
import styles from '../AdminLayout.module.scss';

const { Sider } = Layout;

interface AdminSidebarProps {
    isMobile?: boolean;
    collapsed?: boolean;
    onClose?: () => void;
}

const AdminSidebar = memo(({ isMobile, collapsed, onClose }: AdminSidebarProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [pendingCount, setPendingCount] = React.useState<number>(0);
    const [departments, setDepartments] = React.useState<any[]>([]);

    const fetchCounts = React.useCallback(async () => {
        try {
            const data = await statsService.getDashboardStats();
            setPendingCount(data.overview.pendingRequests || 0);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        }
    }, []);

    const fetchDepartments = React.useCallback(async () => {
        try {
            const data = await departmentService.getAll();
            setDepartments(data);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    }, []);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userId = user?.id;

    React.useEffect(() => {
        fetchCounts();
        fetchDepartments();

        if (userId) {
            const socket = socketService.connect(userId);
            socket.on('updatePendingRequestCount', (data: { count: number }) => {
                setPendingCount(data.count);
            });
            return () => {
                socket.off('updatePendingRequestCount');
            };
        }
    }, [userId, fetchCounts, fetchDepartments]);

    // ✅ Xử lý Menu Items động
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
            key: 'user-management-parent',
            icon: <UserOutlined />,
            label: 'Quản lý nhân sự',
            children: [
                {
                    key: ROUTES.ADMIN_USERS,
                    label: 'Tất cả nhân sự',
                },
                ...departments.map(dept => ({
                    key: `${ROUTES.ADMIN_USERS}?departmentId=${dept.id}`,
                    label: dept.name,
                }))
            ]
        },
        {
            key: ROUTES.ADMIN_DEPARTMENTS,
            icon: <ClusterOutlined />,
            label: 'Quản lý phòng ban',
        },
        {
            key: ROUTES.ADMIN_POSITIONS,
            icon: <ApartmentOutlined />,
            label: 'Quản lý vị trí',
        },
        {
            key: ROUTES.ADMIN_ROLES,
            icon: <IdcardOutlined />,
            label: 'Quản lý vai trò',
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
            label: 'Báo cáo',
        }
    ];

    // ✅ Logic highlight chính xác
    const currentPath = location.pathname;
    const currentDeptId = searchParams.get('departmentId');

    let selectedKey = currentPath;
    if (currentPath === ROUTES.ADMIN_USERS && currentDeptId) {
        selectedKey = `${ROUTES.ADMIN_USERS}?departmentId=${currentDeptId}`;
    }

    // Luôn mở rộng menu "Quản lý nhân sự" nếu đang ở trang nhân sự
    const openKeys = currentPath.startsWith(ROUTES.ADMIN_USERS) ? ['user-management-parent'] : [];

    return (
        <Sider
            theme="light"
            width={250}
            collapsedWidth={80}
            collapsed={collapsed}
            className={styles.adminSidebar}
            trigger={null}
        >
            <Menu
                mode="inline"
                selectedKeys={[selectedKey]}
                defaultOpenKeys={openKeys}
                className={styles.adminMenu}
                onClick={({ key }) => {
                    navigate(key);
                    if (isMobile && onClose) onClose();
                }}
                items={menuItems}
            />
        </Sider>
    );
});

AdminSidebar.displayName = 'AdminSidebar';

export default AdminSidebar;
