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
            message.error(error.response?.data?.error || 'Lỗi đăng ký tài khoản');
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
                    <Title level={2} className={styles.sideTitle}>Create Account</Title>
                    <Form layout="vertical" onFinish={onFinish} requiredMark={false} size="large">
                        <Form.Item name="username" rules={[{ required: true, message: 'Nhập tài khoản!' }]}>
                            <Input prefix={<UserOutlined className={styles.authInputPrefix} />} placeholder="Username" />
                        </Form.Item>

                        <Form.Item name="email" rules={[{ required: true, type: 'email', message: 'Nhập Email!' }]}>
                            <Input prefix={<MailOutlined className={styles.authInputPrefix} />} placeholder="E-mail" />
                        </Form.Item>

                        <Form.Item name="password" rules={[{ required: true, min: 6, message: 'Tối thiểu 6 ký tự' }]}>
                            <Input.Password prefix={<LockOutlined className={styles.authInputPrefix} />} placeholder="Password" />
                        </Form.Item>

                        <div className={styles.formExtras}>
                            <Checkbox>I accept the terms of the agreement</Checkbox>
                        </div>

                        <Form.Item>
                            <Button type="primary" htmlType="submit" className={styles.btnTheme} block loading={loading}>
                                Sign Up
                            </Button>
                        </Form.Item>

                    </Form>
                </div>

                {/* Side: Info Area */}
                <div className={styles.authSideInfo}>
                    <Title level={1} className={styles.infoTitle}>Get Started</Title>
                    <Text className={styles.infoDesc}>Already have an account?</Text>
                    <Link to="/login">
                        <Button className={styles.btnOutline}>Log in</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

