import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authService } from '../../services/auth.service';
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
            message.success('Chào mừng bạn quay trở lại!');
            if (data.user.roles?.includes('admin')) {
                navigate('/admin');
            } else {
                navigate('/course');
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'username hoặc mật khẩu không đúng');
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
                    <Title level={2} className={styles.sideTitle}>Log in</Title>
                    <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
                        <Form.Item name="username" rules={[{ required: true, message: 'Nhập tài khoản!' }]}>
                            <Input prefix={<UserOutlined className={styles.authInputPrefix} />} placeholder="Username" />
                        </Form.Item>

                        <Form.Item name="password" rules={[{ required: true, message: 'Nhập mật khẩu!' }]}>
                            <Input.Password prefix={<LockOutlined className={styles.authInputPrefix} />} placeholder="Password" />
                        </Form.Item>

                        <div className={styles.formExtras}>
                            <Checkbox>Remember me</Checkbox>
                            <Link to="#" className={styles.forgotLink}>forgot password?</Link>
                        </div>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" className={styles.btnTheme} block loading={loading}>
                                Log in
                            </Button>
                        </Form.Item>

                    </Form>
                </div>

                {/* Right Side: Info Area */}
                <div className={styles.authSideInfo}>
                    <Title level={1} className={styles.infoTitle}>Welcome Back!</Title>
                    <Text className={styles.infoDesc}>Please enter your details<br />Don't have an account?</Text>
                    <Link to="/register">
                        <Button className={styles.btnOutline}>Sign Up</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

