import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, PlusCircleOutlined, MessageOutlined } from '@ant-design/icons';
import './Sidebar.scss';
const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { key: '/course', icon: <HomeOutlined />, label: 'Trang chủ' },
        { key: '/contact', icon: <MessageOutlined />, label: 'Liên hệ' },
        // { key: '/roadmap', icon: <BookOutlined />, label: 'Lộ trình' },
        // { key: '/posts', icon: <FileTextOutlined />, label: 'Bài viết' },
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
