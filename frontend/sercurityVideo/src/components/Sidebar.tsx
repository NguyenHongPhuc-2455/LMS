import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeOutlined, BookOutlined, FileTextOutlined, PlusCircleOutlined } from '@ant-design/icons';

const Sidebar: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { key: '/course', icon: <HomeOutlined />, label: 'Trang chủ' },
        { key: '/roadmap', icon: <BookOutlined />, label: 'Lộ trình' },
        { key: '/posts', icon: <FileTextOutlined />, label: 'Bài viết' },
    ];

    return (
        <div style={{
            width: '96px',
            height: 'calc(100vh - 66px)',
            background: '#FFF',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '12px',
            gap: '8px',
            position: 'sticky',
            top: '66px',
            zIndex: 10,
            borderRight: '1px solid #e8e8e8',
            flexShrink: 0
        }}>
            {menuItems.map(item => {
                const isActive = location.pathname === item.key;
                return (
                    <div
                        key={item.key}
                        onClick={() => navigate(item.key)}
                        style={{
                            width: '72px',
                            height: '72px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center',
                            cursor: 'pointer',
                            borderRadius: '16px',
                            background: isActive ? '#e8edf3' : 'transparent',
                            transition: 'all 0.3s ease',
                            color: isActive ? '#1a1a1a' : '#505d6b',
                        }}
                        className="sidebar-item"
                    >
                        <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
                        <span style={{ fontSize: '11px', fontWeight: 600 }}>{item.label}</span>
                    </div>
                );
            })}

            <div style={{ marginTop: 'auto', marginBottom: '20px' }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#e8edf3',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    cursor: 'pointer',
                    color: '#505d6b'
                }}>
                    <PlusCircleOutlined style={{ fontSize: '24px' }} />
                </div>
            </div>

            <style>{`
                .sidebar-item:hover {
                    background: #f5f5f5;
                }
            `}</style>
        </div>
    );
};

export default Sidebar;
