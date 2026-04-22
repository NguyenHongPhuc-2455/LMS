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
                        <Form.Item
                            name="full_name"
                            rules={[
                                { required: true, message: 'Vui lòng nhập họ tên!' },
                                { pattern: /^[a-vxyỳọáầảấờễàảõâụæêốưử平步青云ąạảấầẩẫậắằẳẵặẹẻẽềềểếệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ\sA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểếễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỵỷỹ]+$/i, message: 'Họ tên chỉ chứa chữ cái và khoảng trắng!' }
                            ]}
                        >
                            <Input prefix={<UserOutlined className={styles.authInputPrefix} />} placeholder="Họ và tên" />
                        </Form.Item>

                        <Form.Item
                            name="username"
                            rules={[
                                { required: true, message: 'Nhập tài khoản!' },
                                { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: 'Username từ 3-20 ký tự, không có ký tự đặc biệt!' }
                            ]}
                        >
                            <Input prefix={<UserOutlined className={styles.authInputPrefix} />} placeholder="Username" />
                        </Form.Item>

                        <Form.Item
                            name="email"
                            rules={[
                                { required: true, message: 'Nhập Email!' },
                                { type: 'email', message: 'Email không đúng định dạng!' }
                            ]}
                        >
                            <Input prefix={<MailOutlined className={styles.authInputPrefix} />} placeholder="E-mail" />
                        </Form.Item>

                        <Form.Item
                            name="password"
                            rules={[
                                { required: true, message: 'Nhập mật khẩu!' },
                                { min: 6, message: 'Tối thiểu 6 ký tự!' },
                                { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, message: 'Cần ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt!' }
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined className={styles.authInputPrefix} />} placeholder="Password" />
                        </Form.Item>

                        <Form.Item
                            name="confirm_password"
                            dependencies={['password']}
                            rules={[
                                { required: true, message: 'Xác nhận mật khẩu!' },
                                ({ getFieldValue }) => ({
                                    validator(_, value) {
                                        if (!value || getFieldValue('password') === value) {
                                            return Promise.resolve();
                                        }
                                        return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                                    },
                                }),
                            ]}
                        >
                            <Input.Password prefix={<LockOutlined className={styles.authInputPrefix} />} placeholder="Confirm Password" />
                        </Form.Item>

                        <div className={styles.formExtras}>
                            <Checkbox>Tôi đồng ý với các điều khoản sử dụng</Checkbox>
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

