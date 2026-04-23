import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, PlusCircleOutlined, MessageOutlined, ApartmentOutlined, AppstoreOutlined } from '@ant-design/icons';
import styles from './Sidebar.module.scss';


const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { key: '/course', icon: <HomeOutlined />, label: 'Trang chủ' },
        { key: '/categories', icon: <AppstoreOutlined />, label: 'Danh mục' },
        { key: '/programs', icon: <ApartmentOutlined />, label: 'Lộ trình' },
        { key: '/contact', icon: <MessageOutlined />, label: 'Liên hệ' },
    ];

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

            <div className={styles.sidebarFooter}>
                <div className={styles.sidebarPlusBtn}>
                    <PlusCircleOutlined className={styles.sidebarPlusIcon} />
                </div>
            </div>
        </div>
    );
};


export default Sidebar;


