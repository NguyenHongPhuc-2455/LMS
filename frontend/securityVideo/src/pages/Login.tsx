import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { UserOutlined, LockOutlined, LoginOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { App, Form, Input, Button, Typography, Space, Card } from 'antd';

const { Title, Text } = Typography;

export default function Login() {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const res = await api.post('/auth/login', values);
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));

            message.success('Chào mừng bạn quay trở lại!');

            if (res.data.user.roles?.includes('admin')) {
                navigate('/admin');
            } else {
                navigate('/course');
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Sai tài khoản hoặc mật khẩu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <Card className="auth-card" variant="borderless">
                <div style={{ textAlign: 'center', marginBottom: 40 }}>
                    <div style={{
                        width: 64,
                        height: 64,
                        borderRadius: '20px',
                        background: 'var(--primary-gradient)',
                        display: 'inline-flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginBottom: 20,
                        boxShadow: '0 8px 16px rgba(99, 102, 241, 0.3)',
                        animation: 'float 3s ease-in-out infinite'
                    }}>
                        <LoginOutlined style={{ fontSize: 32, color: 'white' }} />
                    </div>
                    <Title level={2} className="premium-title" style={{ margin: 0, fontSize: 32 }}>Chào mừng</Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>Đăng nhập để tiếp tục hành trình học tập</Text>
                </div>

                <Form
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                    size="large"
                >
                    <Form.Item
                        label="Tên đăng nhập"
                        name="username"
                        rules={[{ required: true, message: 'Vui lòng nhập tài khoản!' }]}
                    >
                        <Input
                            prefix={<UserOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="Nhập tài khoản của bạn"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="Nhập mật khẩu"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 12 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="btn-primary"
                            loading={loading}
                            icon={<ArrowRightOutlined />}
                        >
                            Đăng nhập ngay
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <Space direction="vertical" size={4}>
                            <Text type="secondary">Chưa có tài khoản?</Text>
                            <Link to="/register" style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                                Kích hoạt ghi danh học viên mới
                            </Link>
                        </Space>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
