import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons';
import { App, Form, Input, Button, Typography, Checkbox } from 'antd';
import styles from '../Auth.module.scss';

const { Title, Text } = Typography;

export default function Register() {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            await authService.register(values);
            message.success('Ghi danh thành công! Mời bạn đăng nhập');
            navigate('/login');
        } catch (error: any) {
            message.error(error.response?.data?.message || error.response?.data?.error || 'Lỗi đăng ký tài khoản');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.blob1}></div>
            <div className={styles.blob2}></div>

            <div className={`${styles.authWrapper} ${styles.registerLayout}`}>
                {/* Side: Form */}
                <div className={styles.authSideForm}>
                    <div className={styles.authLogoWrapper}>
                        <img src="/logo/logo.svg" alt="RitaVo Logo" className={styles.authLogo} />
                    </div>
                    <Title level={2} className={styles.sideTitle}>Đăng ký tài khoản</Title>
                    <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
                        <Form.Item name="full_name" rules={[{ required: true, message: 'Vui lòng nhập họ tên!' }]}>
                            <Input prefix={<UserOutlined className={styles.authInputPrefix} />} placeholder="Họ và tên" />
                        </Form.Item>

                        <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tài khoản!' }]}>
                            <Input prefix={<UserOutlined className={styles.authInputPrefix} />} placeholder="Tên đăng nhập" />
                        </Form.Item>

                        <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập Email!' }, { type: 'email', message: 'Email không đúng định dạng!' }]}>
                            <Input prefix={<MailOutlined className={styles.authInputPrefix} />} placeholder="Địa chỉ Email" />
                        </Form.Item>

                        <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }, { min: 6, message: 'Tối thiểu 6 ký tự!' }]}>
                            <Input.Password prefix={<LockOutlined className={styles.authInputPrefix} />} placeholder="Mật khẩu" />
                        </Form.Item>

                        <Form.Item name="confirm_password" dependencies={['password']} rules={[{ required: true, message: 'Vui lòng xác nhận mật khẩu!' }, ({ getFieldValue }) => ({ validator(_, value) { if (!value || getFieldValue('password') === value) return Promise.resolve(); return Promise.reject(new Error('Mật khẩu xác nhận không khớp!')); }, }),]}>
                            <Input.Password prefix={<LockOutlined className={styles.authInputPrefix} />} placeholder="Xác nhận mật khẩu" />
                        </Form.Item>

                        <div className={styles.formExtras}>
                            <Checkbox>Tôi đồng ý với các điều khoản sử dụng</Checkbox>
                        </div>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" className={styles.btnTheme} block loading={loading}>
                                Đăng ký ngay
                            </Button>
                        </Form.Item>
                    </Form>
                </div>

                {/* Side: Info Area */}
                <div className={styles.authSideInfo}>
                    <Title level={1} className={styles.infoTitle}>Khởi đầu!</Title>
                    <Text className={styles.infoDesc}>Bạn đã có tài khoản?</Text>
                    <Link to="/login">
                        <Button className={styles.btnOutline}>Đăng nhập</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

