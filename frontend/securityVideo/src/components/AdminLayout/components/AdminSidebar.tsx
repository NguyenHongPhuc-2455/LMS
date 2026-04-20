import { Layout, Menu } from 'antd';
import {
    PieChartOutlined,
    BookOutlined,
    UserOutlined,
    MenuOutlined,
    MenuFoldOutlined,
    PlaySquareOutlined,
    ApartmentOutlined,
    CheckOutlined
} from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from '../AdminLayout.module.scss';

const { Sider } = Layout;

interface AdminSidebarProps {
    collapsed: boolean;
    setCollapsed: (collapsed: boolean) => void;
}

export default function AdminSidebar({ collapsed, setCollapsed }: AdminSidebarProps) {
    const location = useLocation();
    const navigate = useNavigate();

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
            key: '/admin/users',
            icon: <UserOutlined />,
            label: 'Học viên',
        },
        {
            key: '/admin/requests',
            icon: <CheckOutlined />,
            label: 'Duyệt yêu cầu',
        },
        {
            key: '/admin/programs',
            icon: <ApartmentOutlined />,
            label: 'Chương trình học',
        }
    ];

    return (
        <Sider
            trigger={null}
            collapsible
            collapsed={collapsed}
            theme="light"
            width={250}
            className={styles.adminSidebar}
        >
            <div className={`${styles.adminLogoSection} ${collapsed ? styles.collapsed : styles.expanded}`}>
                <MenuOutlined
                    className={styles.sidebarToggleIcon}
                    onClick={() => setCollapsed(!collapsed)}
                />
                {!collapsed && (
                    <img src="/logo/logo.png" alt="Logo" className={styles.adminLogoImg} />
                )}
            </div>

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
