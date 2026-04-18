import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, BookOutlined, FileTextOutlined, PlusCircleOutlined, MessageOutlined, ApartmentOutlined } from '@ant-design/icons';

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { key: '/course', icon: <HomeOutlined />, label: 'Trang chủ' },
        { key: '/programs', icon: <ApartmentOutlined />, label: 'Lộ trình' },
        { key: '/contact', icon: <MessageOutlined />, label: 'Liên hệ' },
    ];

    return (
        <div className="sidebar-container">
            {menuItems.map(item => {
                const isActive = location.pathname === item.key;
                return (
                    <div
                        key={item.key}
                        onClick={() => navigate(item.key)}
                        className={`sidebar-item ${isActive ? 'active' : ''}`}
                    >
                        <div className="sidebar-icon">{item.icon}</div>
                        <span className="sidebar-label">{item.label}</span>
                    </div>
                );
            })}

            <div className="sidebar-footer">
                <div className="sidebar-plus-btn">
                    <PlusCircleOutlined className="sidebar-plus-icon" />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
