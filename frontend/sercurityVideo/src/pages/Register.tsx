import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';
import { UserAddOutlined, MailOutlined, LockOutlined, RocketOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { App, Form, Input, Button, Typography, Card } from 'antd';

const { Title, Text } = Typography;

export default function Register() {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await api.post('/auth/register', values);
            message.success('Ghi danh thành công! Mời bạn đăng nhập');
            navigate('/login');
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi đăng ký tài khoản');
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
                        boxShadow: '0 8px 16px rgba(168, 85, 247, 0.3)',
                        animation: 'float 3s ease-in-out infinite'
                    }}>
                        <UserAddOutlined style={{ fontSize: 32, color: 'white' }} />
                    </div>
                    <Title level={2} className="premium-title" style={{ margin: 0, fontSize: 32 }}>Ghi danh mới</Title>
                    <Text type="secondary" style={{ fontSize: 16 }}>Bắt đầu hành trình chinh phục kiến thức ngay hôm nay</Text>
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
                        rules={[
                            { required: true, message: 'Vui lòng nhập tên tài khoản!' },
                            { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: 'Username từ 3-20 ký tự, không chứa ký tự đặc biệt!' }
                        ]}
                    >
                        <Input
                            prefix={<UserAddOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="Chọn tên đăng nhập"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Địa chỉ Email"
                        name="email"
                        rules={[
                            { required: true, message: 'Vui lòng nhập Email!' },
                            { type: 'email', message: 'Email không đúng định dạng!' }
                        ]}
                    >
                        <Input
                            prefix={<MailOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="example@gmail.com"
                        />
                    </Form.Item>

                    <Form.Item
                        label="Mật khẩu"
                        name="password"
                        rules={[
                            { required: true, message: 'Bắt buộc nhập!' },
                            { min: 6, message: 'Tối thiểu 6 ký tự' }
                        ]}
                    >
                        <Input.Password
                            prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                            placeholder="Tối thiểu 6 ký tự"
                        />
                    </Form.Item>

                    <Form.Item style={{ marginTop: 12 }}>
                        <Button
                            type="primary"
                            htmlType="submit"
                            className="btn-primary"
                            loading={loading}
                            icon={<RocketOutlined />}
                        >
                            Kích hoạt tài khoản
                        </Button>
                    </Form.Item>

                    <div style={{ textAlign: 'center', marginTop: 24 }}>
                        <Link to="/login" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'var(--text-muted)' }}>
                            <ArrowLeftOutlined style={{ fontSize: 12 }} />
                            <span>Đã có tài khoản? Quay về Đăng nhập</span>
                        </Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
