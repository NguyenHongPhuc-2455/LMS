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
import api from '../../../api';
import dayjs from 'dayjs';
import './Profile.scss';

const { Title, Text } = Typography;

const Profile: React.FC = () => {
    const { message } = App.useApp();
    const [user, setUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const fetchUser = async () => {
        try {
            const res = await api.get('/users/profile');
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
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
            const res = await api.put('/users/profile', payload);
            localStorage.setItem('user', JSON.stringify(res.data.user));
            setUser(res.data.user);
            message.success('Cập nhật hồ sơ thành công!');
            setIsModalOpen(false);
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi khi cập nhật hồ sơ');
        } finally {
            setLoading(false);
        }
    };

    const infoItem = (label: string, value: string | null, icon?: React.ReactNode) => (
        <div className="profile-info-item">
            <div className="info-label">
                {icon} {label}
            </div>
            <div className={`info-value ${value ? 'has-value' : 'no-value'}`}>
                {value || <span className="add-link" onClick={() => setIsModalOpen(true)}>+ Add</span>}
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="profile-container">
            <Row gutter={24}>
                {/* Left Card: Basic Info */}
                <Col xs={24} md={8}>
                    <Card bordered={false} styles={{ body: { padding: 0 } }} className="profile-left-card">
                        <div className="profile-avatar-section">
                            <div className="profile-avatar-wrapper">
                                <Avatar
                                    size={120}
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=4880FF&color=fff&size=200`}
                                    className="profile-avatar"
                                />
                                <Button
                                    shape="circle"
                                    size="small"
                                    icon={<CameraOutlined />}
                                    className="profile-avatar-button"
                                />
                            </div>
                            <Title level={3} className="profile-name">{user.full_name || user.username}</Title>
                            <Text
                                className="profile-edit-btn"
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

                        <Divider className="profile-divider" />

                        <div className="profile-info-list">
                            {infoItem('Username', user.username, <UserOutlined className="icon-small" />)}
                            {infoItem('Full name', user.full_name, <UserOutlined className="icon-small" />)}
                            {infoItem('Mobile number', user.phone, <PhoneOutlined className="icon-small" />)}
                            {infoItem('Email address', user.email, <MailOutlined className="icon-small" />)}
                            {infoItem('Date of birth', user.dob ? dayjs(user.dob).format('DD/MM/YYYY') : null, <CalendarOutlined className="icon-small" />)}
                            {infoItem('Gender', user.gender, <ManOutlined className="icon-small" />)}
                        </div>

                        <Divider className="profile-divider" />

                        <div className="profile-logout-section">
                            <Button type="text" danger onClick={handleLogout} className="logout-btn">Log out</Button>
                        </div>
                    </Card>
                </Col>

                {/* Right Cards */}
                <Col xs={24} md={16}>
                    <Space direction="vertical" size={24} className="profile-right-space">

                        {/* Addresses */}
                        <Card bordered={false} title="My addresses" className="profile-section-card">
                            <Button type="text" icon={<PlusCircleOutlined />} className="btn-add-address">
                                Add new address
                            </Button>
                        </Card>

                        {/* Payment Methods */}
                        <Card
                            bordered={false}
                            title="My payment methods"
                            extra={<Button type="text" className="profile-edit-btn">Change</Button>}
                            className="profile-section-card"
                        >
                            <Text type="secondary" className="payment-desc">Securely save your card details for hassle-free payments.</Text>
                            <div className="payment-method-item">
                                <Space size={16}>
                                    <div className="payment-card-icon">
                                        <CreditCardOutlined />
                                    </div>
                                    <Text strong>MasterCard •••• 4320</Text>
                                </Space>
                                <Space size={16}>
                                    <Text type="secondary">Exp: 4/2028</Text>
                                    <MoreOutlined className="icon-gray" />
                                </Space>
                            </div>
                        </Card>

                        {/* Social Logins */}
                        <Card bordered={false} title="My social logins" className="profile-section-card">
                            <Text type="secondary" className="social-desc">Link social profiles for easier access to your Fresha account.</Text>
                            <List
                                dataSource={[
                                    { name: 'Facebook', icon: <FacebookFilled className="social-icon-fb" /> },
                                    { name: 'Google', icon: <GoogleOutlined className="social-icon-google" /> }
                                ]}
                                renderItem={(item) => (
                                    <List.Item extra={<Button type="text" className="profile-edit-btn">Connect</Button>}>
                                        <Space size={16}>
                                            <div className="social-item-icon-wrapper">
                                                {item.icon}
                                            </div>
                                            <Text strong>{item.name}</Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </Card>

                        {/* Notifications */}
                        <Card bordered={false} title="My notifications" className="profile-section-card">
                            <Text type="secondary" className="notification-desc">We'll send you updates about your appointments, news and marketing offers.</Text>
                            <div className="notification-item">
                                <div>
                                    <Text strong className="notification-title">Text message appointment notifications</Text>
                                    <Text type="secondary" className="notification-sub-text">Receive texts based on your sender's settings</Text>
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
                className="profile-modal"
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                    className="profile-modal-form"
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
                                <DatePicker className="full-width" format="DD/MM/YYYY" />
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
                    <div className="profile-modal-footer">
                        <Space>
                            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={loading} className="btn-save">
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

