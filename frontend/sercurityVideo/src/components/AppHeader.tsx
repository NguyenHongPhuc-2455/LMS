import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Input, Avatar, Dropdown, Space, Typography } from 'antd';
import { SearchOutlined, UserOutlined, SettingOutlined, LogoutOutlined, ShoppingCartOutlined, BellOutlined, BookOutlined } from '@ant-design/icons';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader: React.FC = () => {
    const navigate = useNavigate();
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const userMenuItems = {
        items: [
            { key: 'profile', label: 'Hồ sơ cá nhân', icon: <UserOutlined />, onClick: () => navigate('/profile') },
            { key: 'my-courses', label: 'Khóa học của tôi', icon: <BookOutlined />, onClick: () => navigate('/my-courses') },
            { key: 'settings', label: 'Cài đặt', icon: <SettingOutlined /> },
            { type: 'divider' as const },
            { key: 'logout', label: 'Đăng xuất', icon: <LogoutOutlined />, danger: true, onClick: handleLogout },
        ]
    };

    const [searchTerm, setSearchTerm] = React.useState('');

    // Debounce search
    React.useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm !== '') {
                navigate(`/course?search=${encodeURIComponent(searchTerm)}`);
            } else if (window.location.pathname === '/course') {
                navigate('/course');
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm, navigate]);

    return (
        <Header style={{
            background: '#FFF',
            padding: '0 28px',
            height: '66px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
            position: 'sticky',
            top: 0,
            zIndex: 1001,
            width: '100%',
        }}>
            {/* Left: Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer' }} onClick={() => {
                setSearchTerm('');
                navigate('/course');
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
                    <div style={{
                        margin: 0,
                        color: '#C82020',
                        fontSize: '22px',
                        fontWeight: 900,
                        letterSpacing: '-1px',
                        textTransform: 'uppercase'
                    }}>
                        RITA VÕ<span style={{ fontSize: '10px', verticalAlign: 'top' }}>®</span>
                    </div>
                    <Text style={{ fontSize: '9px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Education Cloud
                    </Text>
                </div>
            </div>

            {/* Middle: Search */}
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', padding: '0 40px' }}>
                <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
                    <Input
                        placeholder="Tìm kiếm khóa học, bài viết, video, ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        prefix={<SearchOutlined style={{ color: '#757575', fontSize: '18px', marginRight: '8px' }} />}
                        style={{
                            borderRadius: '20px',
                            background: '#FFF',
                            border: '2px solid #e8e8e8',
                            padding: '6px 18px',
                            height: '40px',
                            fontSize: '14px',
                            transition: 'all 0.2s ease',
                            boxShadow: 'none'
                        }}
                        className="f8-search-input"
                    />
                </div>
            </div>

            {/* Right: User */}
            <Space size={24}>
                {/* <div
                    title="Giỏ hàng"
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    onClick={() => navigate('/cart')}
                >
                    <ShoppingCartOutlined style={{ fontSize: '22px', color: '#495057' }} />
                </div> */}

                <div title="Thông báo" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <BellOutlined style={{ fontSize: '22px', color: '#495057' }} />
                </div>

                <Dropdown menu={userMenuItems} trigger={['click']}>
                    <Avatar
                        src={user?.avatar}
                        icon={<UserOutlined />}
                        style={{ cursor: 'pointer', border: '1px solid #f8f9fa' }}
                        size={38}
                    />
                </Dropdown>
            </Space>

            <style>{`
                .f8-search-input:hover {
                    border-color: #bdbdbd !important;
                }
                .f8-search-input:focus, .f8-search-input-focused {
                    border-color: #444 !important;
                    box-shadow: none !important;
                }
                .f8-search-input input::placeholder {
                    color: #757575;
                    font-weight: 400;
                }
            `}</style>
        </Header>
    );
};

export default AppHeader;
