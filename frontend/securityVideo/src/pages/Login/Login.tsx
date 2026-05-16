import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { ROUTES } from '../../constants/routes';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { App, Form, Input, Button, Typography, Checkbox } from 'antd';
import styles from '../Auth.module.scss';

const { Title, Text } = Typography;

export default function Login() {
    const { message } = App.useApp();
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const data = await authService.login(values);
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('user', JSON.stringify(data.user));

            const userRoles = data.user.roles || [];
            const isAdminOrManager = userRoles.some((r: any) => {
                const roleName = typeof r === 'string' ? r : r.name;
                return ['admin', 'manager'].includes(roleName?.toLowerCase());
            });

            const redirectTo = isAdminOrManager ? ROUTES.ADMIN_DASHBOARD : ROUTES.HOME;

            // Đặt cờ vừa đăng nhập để trang chủ hiển thị modal thông báo (nếu có khóa học bắt buộc)
            sessionStorage.setItem('show_mandatory_modal', 'true');

            message.success('Chào mừng bạn đến với eLearning!');
            navigate(redirectTo);
        } catch (error: any) {
            message.error(error.response?.data?.message || error.response?.data?.error || 'username hoặc mật khẩu không đúng');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <div className={styles.blob1}></div>
            <div className={styles.blob2}></div>

            <div className={styles.authWrapper}>
                {/* Left Side: Form */}
                <div className={styles.authSideForm}>
                    <div className={styles.authLogoWrapper}>
                        <img src="/logo/logo.svg" alt="RitaVo Logo" className={styles.authLogo} />
                    </div>
                    <Title level={2} className={styles.sideTitle}>Đăng nhập</Title>
                    <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
                        <Form.Item name="username" rules={[{ required: true, message: 'Vui lòng nhập tài khoản!' }]}>
                            <Input prefix={<UserOutlined className={styles.authInputPrefix} />} placeholder="Tên đăng nhập" />
                        </Form.Item>

                        <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}>
                            <Input.Password prefix={<LockOutlined className={styles.authInputPrefix} />} placeholder="Mật khẩu" />
                        </Form.Item>

                        <div className={styles.formExtras}>
                            <Checkbox>Ghi nhớ đăng nhập</Checkbox>
                            <Link to="#" className={styles.forgotLink}>Quên mật khẩu?</Link>
                        </div>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" className={styles.btnTheme} block loading={loading}>
                                Đăng nhập ngay
                            </Button>
                        </Form.Item>
                    </Form>
                </div>

                {/* Right Side: Info Area */}
                <div className={styles.authSideInfo}>
                    <Title level={1} className={styles.infoTitle}>Chào mừng!</Title>
                    <Text className={styles.infoDesc}>Hệ thống học tập trực tuyến dành cho nhân viên RitaVõ.<br />Bạn chưa có tài khoản?</Text>
                    <Link to="/register">
                        <Button className={styles.btnOutline}>Đăng ký ngay</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
