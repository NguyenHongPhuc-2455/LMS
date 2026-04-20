import React, { useState, useEffect } from 'react';
import { Card, Button, Avatar, Typography, Row, Col, Divider, Space, App, Switch, List, Modal, Form, Input, DatePicker, Select } from 'antd';
import {
    UserOutlined,
    CameraOutlined,
    PlusCircleOutlined,
    FacebookFilled,
    GoogleOutlined,
    MoreOutlined,
    CreditCardOutlined,
    MailOutlined,
    PhoneOutlined,
    CalendarOutlined,
    ManOutlined
} from '@ant-design/icons';
import { userService } from '../../../services/user.service';
import dayjs from 'dayjs';
import styles from './Profile.module.scss';


const { Title, Text } = Typography;

const Profile: React.FC = () => {
    const { message } = App.useApp();
    const [user, setUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const fetchUser = async () => {
        try {
            const data = await userService.getProfile();
            setUser(data);
            localStorage.setItem('user', JSON.stringify(data));

        } catch (error) {
            // Fallback to localStorage if API fails
            const userStr = localStorage.getItem('user');
            if (userStr) setUser(JSON.parse(userStr));
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const payload = {
                ...values,
                dob: values.dob ? values.dob.toISOString() : null
            };
            const data = await userService.updateProfile(payload);
            localStorage.setItem('user', JSON.stringify(data.user));

            setUser(data.user);
            message.success('Cập nhật hồ sơ thành công!');
            setIsModalOpen(false);
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi khi cập nhật hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const infoItem = (label: string, value: string | null, icon?: React.ReactNode) => (
        <div className={styles.profileInfoItem}>
            <div className={styles.infoLabel}>
                {icon} {label}
            </div>
            <div className={`${styles.infoValue} ${value ? styles.hasValue : styles.noValue}`}>
                {value || <span className={styles.addLink} onClick={() => setIsModalOpen(true)}>+ Add</span>}
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div className={styles.profileContainer}>
            <Row gutter={24}>
                {/* Left Card: Basic Info */}
                <Col xs={24} md={8}>
                    <Card bordered={false} styles={{ body: { padding: 0 } }} className={styles.profileLeftCard}>
                        <div className={styles.profileAvatarSection}>
                            <div className={styles.profileAvatarWrapper}>
                                <Avatar
                                    size={120}
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=4880FF&color=fff&size=200`}
                                    className={styles.profileAvatar}
                                />
                                <Button
                                    shape="circle"
                                    size="small"
                                    icon={<CameraOutlined />}
                                    className={styles.profileAvatarButton}
                                />
                            </div>
                            <Title level={3} className={styles.profileName}>{user.full_name || user.username}</Title>
                            <Text
                                className={styles.profileEditBtn}
                                onClick={() => {
                                    form.setFieldsValue({
                                        full_name: user.full_name,
                                        email: user.email,
                                        phone: user.phone,
                                        gender: user.gender,
                                        dob: user.dob ? dayjs(user.dob) : null,
                                        avatar: user.avatar
                                    });
                                    setIsModalOpen(true);
                                }}
                            >
                                Edit
                            </Text>
                        </div>

                        <Divider className={styles.profileDivider} />

                        <div className={styles.profileInfoList}>
                            {infoItem('Username', user.username, <UserOutlined className={styles.iconSmall} />)}
                            {infoItem('Full name', user.full_name, <UserOutlined className={styles.iconSmall} />)}
                            {infoItem('Mobile number', user.phone, <PhoneOutlined className={styles.iconSmall} />)}
                            {infoItem('Email address', user.email, <MailOutlined className={styles.iconSmall} />)}
                            {infoItem('Date of birth', user.dob ? dayjs(user.dob).format('DD/MM/YYYY') : null, <CalendarOutlined className={styles.iconSmall} />)}
                            {infoItem('Gender', user.gender, <ManOutlined className={styles.iconSmall} />)}
                        </div>

                        <Divider className={styles.profileDivider} />

                        <div className={styles.profileLogoutSection}>
                            <Button type="text" danger onClick={handleLogout} className={styles.logoutBtn}>Log out</Button>
                        </div>
                    </Card>
                </Col>

                {/* Right Cards */}
                <Col xs={24} md={16}>
                    <Space direction="vertical" size={24} className={styles.profileRightSpace}>

                        {/* Addresses */}
                        <Card bordered={false} title="My addresses" className={styles.profileSectionCard}>
                            <Button type="text" icon={<PlusCircleOutlined />} className={styles.btnAddAddress}>
                                Add new address
                            </Button>
                        </Card>

                        {/* Payment Methods */}
                        <Card
                            bordered={false}
                            title="My payment methods"
                            extra={<Button type="text" className={styles.profileEditBtn}>Change</Button>}
                            className={styles.profileSectionCard}
                        >
                            <Text type="secondary" className={styles.paymentDesc}>Securely save your card details for hassle-free payments.</Text>
                            <div className={styles.paymentMethodItem}>
                                <Space size={16}>
                                    <div className={styles.paymentCardIcon}>
                                        <CreditCardOutlined />
                                    </div>
                                    <Text strong>MasterCard •••• 4320</Text>
                                </Space>
                                <Space size={16}>
                                    <Text type="secondary">Exp: 4/2028</Text>
                                    <MoreOutlined className={styles.iconGray} />
                                </Space>
                            </div>
                        </Card>

                        {/* Social Logins */}
                        <Card bordered={false} title="My social logins" className={styles.profileSectionCard}>
                            <Text type="secondary" className={styles.socialDesc}>Link social profiles for easier access to your Fresha account.</Text>
                            <List
                                dataSource={[
                                    { name: 'Facebook', icon: <FacebookFilled className={styles.socialIconFb} /> },
                                    { name: 'Google', icon: <GoogleOutlined className={styles.socialIconGoogle} /> }
                                ]}
                                renderItem={(item) => (
                                    <List.Item extra={<Button type="text" className={styles.profileEditBtn}>Connect</Button>}>
                                        <Space size={16}>
                                            <div className={styles.socialItemIconWrapper}>
                                                {item.icon}
                                            </div>
                                            <Text strong>{item.name}</Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </Card>

                        {/* Notifications */}
                        <Card bordered={false} title="My notifications" className={styles.profileSectionCard}>
                            <Text type="secondary" className={styles.notificationDesc}>We'll send you updates about your appointments, news and marketing offers.</Text>
                            <div className={styles.notificationItem}>
                                <div>
                                    <Text strong className={styles.notificationTitle}>Text message appointment notifications</Text>
                                    <Text type="secondary" className={styles.notificationSubText}>Receive texts based on your sender's settings</Text>
                                </div>
                                <Switch defaultChecked />
                            </div>
                        </Card>

                    </Space>
                </Col>
            </Row>

            {/* Modal Edit Basic Info */}
            <Modal
                title="Sửa thông tin cơ bản"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                centered
                className={styles.profileModal}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                    className={styles.profileModalForm}
                >
                    <Form.Item label="Họ và tên" name="full_name">
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item label="Email" name="email" rules={[{ type: 'email' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Số điện thoại" name="phone">
                        <Input />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item label="Ngày sinh" name="dob">
                                <DatePicker className={styles.fullWidth} format="DD/MM/YYYY" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item label="Giới tính" name="gender">
                                <Select placeholder="Chọn giới tính">
                                    <Select.Option value="Nam">Nam</Select.Option>
                                    <Select.Option value="Nữ">Nữ</Select.Option>
                                    <Select.Option value="Khác">Khác</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Link Avatar" name="avatar">
                        <Input placeholder="https://..." />
                    </Form.Item>
                    <div className={styles.profileModalFooter}>
                        <Space>
                            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={loading} className={styles.btnSave}>
                                Lưu thay đổi
                            </Button>
                        </Space>
                    </div>
                </Form>
            </Modal>
        </div>
    );
};

export default Profile;

