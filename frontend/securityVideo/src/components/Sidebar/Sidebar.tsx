import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    HomeOutlined, PlusCircleOutlined, MessageOutlined,
    ApartmentOutlined, AppstoreOutlined, SettingOutlined
} from '@ant-design/icons';
import styles from './Sidebar.module.scss';


const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userRoles = user?.roles || [];
    const isManager = userRoles.some((r: any) => {
        const name = typeof r === 'string' ? r : r.name;
        return name?.toLowerCase() === 'manager';
    });

    const menuItems = [
        { key: '/home', icon: <HomeOutlined />, label: 'Trang chủ' },
        { key: '/course', icon: <AppstoreOutlined />, label: 'Khóa học' },
        { key: '/programs', icon: <ApartmentOutlined />, label: 'Lộ trình' },
        { key: '/contact', icon: <MessageOutlined />, label: 'Liên hệ' },
    ];

    if (isManager) {
        menuItems.push({ key: '/admin', icon: <SettingOutlined />, label: 'Quản lý' });
    }

    return (
        <div className={styles.sidebarContainer}>
            {menuItems.map(item => {
                const isActive = location.pathname === item.key;
                return (
                    <div
                        key={item.key}
                        onClick={() => navigate(item.key)}
                        className={`${styles.sidebarItem} ${isActive ? styles.active : ''}`}
                    >
                        <div className={styles.sidebarIcon}>{item.icon}</div>
                        <span className={styles.sidebarLabel}>{item.label}</span>
                    </div>
                );
            })}

            {/* <div className={styles.sidebarFooter}>
                <div className={styles.sidebarPlusBtn}>
                    <PlusCircleOutlined className={styles.sidebarPlusIcon} />
                </div>
            </div> */}
        </div>
    );
};


export default Sidebar;


