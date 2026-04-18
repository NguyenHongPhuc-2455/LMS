import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { UserOutlined, LockOutlined, LoginOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { App, Form, Input, Button, Typography, Space, Card } from 'antd';
import './Auth.scss';

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
                <div className="auth-header">
                    <div className="auth-icon-wrapper">
                        <LoginOutlined className="auth-header-icon" />
                    </div>
                    <Title level={2} className="premium-title auth-header-title">Chào mừng</Title>
                    <Text type="secondary" className="auth-header-desc">Đăng nhập để tiếp tục hành trình học tập</Text>
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
                            prefix={<UserOutlined className="auth-input-prefix" />}
                            placeholder="Nhập tài khoản của bạn"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
                    >
                        <Input.Password
                            prefix={<LockOutlined className="auth-input-prefix" />}
                            placeholder="Nhập mật khẩu"
                        />
                    </Form.Item>

                    <Form.Item className="auth-form-item-btn">
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

                    <div className="auth-footer">
                        <Space direction="vertical" size={4}>
                            <Text type="secondary">Chưa có tài khoản?</Text>
                            <Link to="/register" className="auth-footer-link">
                                Kích hoạt ghi danh học viên mới
                            </Link>
                        </Space>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
