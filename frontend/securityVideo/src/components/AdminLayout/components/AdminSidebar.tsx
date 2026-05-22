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
            const data = await statsService.getPendingRequestsCount();
            setPendingCount(data.pendingCount ?? 0);
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

    const userRoles = user?.roles || [];
    const roleNames = userRoles.map((r: any) => {
        const name = typeof r === 'string' ? r : r.name;
        return name?.toLowerCase();
    });
    const isManagerOnly = roleNames.includes('manager') && !roleNames.includes('admin');

    const menuItems = isManagerOnly ? [
        {
            key: ROUTES.ADMIN_DASHBOARD,
            icon: <PieChartOutlined />,
            label: 'Tổng quan phòng ban',
        },
        {
            key: ROUTES.ADMIN_PROGRESS,
            icon: <LineChartOutlined />,
            label: 'Quản lý tiến độ học tập',
        },
        {
            key: ROUTES.MANAGER_EMPLOYEES,
            icon: <UserOutlined />,
            label: 'Quản lý nhân sự',
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
            label: 'Báo cáo Onboarding',
        },
        {
            key: ROUTES.MANAGER_INACTIVE_REPORT,
            icon: <WarningOutlined style={{ color: '#fa8c16' }} />,
            label: 'Nhân sự không học tập',
        }
    ] : [
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
            // children: [
            //     // Chỉ Admin thấy "Tất cả nhân sự", Manager bị ẩn
            //     ...(!isManagerOnly ? [{ key: ROUTES.ADMIN_USERS, label: 'Tất cả nhân sự' }] : []),
            //     // Admin thấy tất cả phòng ban; Manager chỉ thấy đúng phòng ban của mình
            //     ...departments
            //         .filter(dept => isManagerOnly ? dept.id === user?.department_id : true)
            //         .map(dept => ({
            //             key: `${ROUTES.ADMIN_USERS}?departmentId=${dept.id}`,
            //             label: dept.name,
            //         }))
            // ]
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
