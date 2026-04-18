import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { UserAddOutlined, MailOutlined, LockOutlined, RocketOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { App, Form, Input, Button, Typography, Card } from 'antd';
import '../Auth.scss';


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
                <div className="auth-header">
                    <div className="auth-icon-wrapper register">
                        <UserAddOutlined className="auth-header-icon" />
                    </div>
                    <Title level={2} className="premium-title auth-header-title">Ghi danh mới</Title>
                    <Text type="secondary" className="auth-header-desc">Bắt đầu hành trình chinh phục kiến thức ngay hôm nay</Text>
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
                            prefix={<UserAddOutlined className="auth-input-prefix" />}
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
                            prefix={<MailOutlined className="auth-input-prefix" />}
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
                            prefix={<LockOutlined className="auth-input-prefix" />}
                            placeholder="Tối thiểu 6 ký tự"
                        />
                    </Form.Item>

                    <Form.Item className="auth-form-item-btn">
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

                    <div className="auth-footer">
                        <Link to="/login" className="auth-back-link">
                            <ArrowLeftOutlined />
                            <span>Đã có tài khoản? Quay về Đăng nhập</span>
                        </Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
