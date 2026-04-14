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
import api from '../../api';
import dayjs from 'dayjs';

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
        <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                {icon} {label}
            </div>
            <div style={{ fontSize: '14px', color: value ? '#475569' : '#94A3B8' }}>
                {value || <span style={{ color: '#4880FF', cursor: 'pointer' }} onClick={() => setIsModalOpen(true)}>+ Add</span>}
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', background: '#F8F9FD', padding: '20px', borderRadius: '12px' }}>
            <Row gutter={24}>
                {/* Left Card: Basic Info */}
                <Col xs={24} md={8}>
                    <Card bordered={false} styles={{ body: { padding: 0 } }} style={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                        <div style={{ textAlign: 'center', padding: '32px 24px' }}>
                            <div style={{ position: 'relative', display: 'inline-block', marginBottom: '16px' }}>
                                <Avatar
                                    size={120}
                                    src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=4880FF&color=fff&size=200`}
                                    style={{ border: '1px solid #E2E8F0' }}
                                />
                                <Button
                                    shape="circle"
                                    size="small"
                                    icon={<CameraOutlined style={{ fontSize: '12px' }} />}
                                    style={{ position: 'absolute', bottom: '5px', right: '5px', background: '#4880FF', color: '#fff', border: 'none' }}
                                />
                            </div>
                            <Title level={3} style={{ margin: 0, fontSize: '22px', fontWeight: 700 }}>{user.full_name || user.username}</Title>
                            <Text
                                style={{ color: '#4880FF', fontWeight: 600, cursor: 'pointer', fontSize: '14px' }}
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

                        <Divider style={{ margin: 0 }} />

                        <div style={{ padding: '24px' }}>
                            {infoItem('Username', user.username, <UserOutlined style={{ fontSize: 10 }} />)}
                            {infoItem('Full name', user.full_name, <UserOutlined style={{ fontSize: 10 }} />)}
                            {infoItem('Mobile number', user.phone, <PhoneOutlined style={{ fontSize: 10 }} />)}
                            {infoItem('Email address', user.email, <MailOutlined style={{ fontSize: 10 }} />)}
                            {infoItem('Date of birth', user.dob ? dayjs(user.dob).format('DD/MM/YYYY') : null, <CalendarOutlined style={{ fontSize: 10 }} />)}
                            {infoItem('Gender', user.gender, <ManOutlined style={{ fontSize: 10 }} />)}
                        </div>

                        <Divider style={{ margin: 0 }} />

                        <div style={{ padding: '16px', textAlign: 'center' }}>
                            <Button type="text" danger onClick={handleLogout} style={{ fontWeight: 600 }}>Log out</Button>
                        </div>
                    </Card>
                </Col>

                {/* Right Cards */}
                <Col xs={24} md={16}>
                    <Space direction="vertical" size={24} style={{ width: '100%' }}>

                        {/* Addresses */}
                        <Card bordered={false} title={<span style={{ fontSize: '16px', fontWeight: 700 }}>My addresses</span>} style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <Button type="text" icon={<PlusCircleOutlined style={{ color: '#4880FF' }} />} style={{ color: '#4880FF', fontWeight: 600, padding: 0 }}>
                                Add new address
                            </Button>
                        </Card>

                        {/* Payment Methods */}
                        <Card
                            bordered={false}
                            title={<span style={{ fontSize: '16px', fontWeight: 700 }}>My payment methods</span>}
                            extra={<Button type="text" style={{ color: '#4880FF', fontWeight: 600 }}>Change</Button>}
                            style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
                        >
                            <Text type="secondary" style={{ display: 'block', marginBottom: '20px' }}>Securely save your card details for hassle-free payments.</Text>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', border: '1px solid #F1F5F9', borderRadius: '8px' }}>
                                <Space size={16}>
                                    <div style={{ width: '40px', height: '26px', background: '#F8FAFC', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E2E8F0' }}>
                                        <CreditCardOutlined style={{ color: '#EF4444' }} />
                                    </div>
                                    <Text strong>MasterCard •••• 4320</Text>
                                </Space>
                                <Space size={16}>
                                    <Text type="secondary">Exp: 4/2028</Text>
                                    <MoreOutlined style={{ color: '#94A3B8' }} />
                                </Space>
                            </div>
                        </Card>

                        {/* Social Logins */}
                        <Card bordered={false} title={<span style={{ fontSize: '16px', fontWeight: 700 }}>My social logins</span>} style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: '20px' }}>Link social profiles for easier access to your Fresha account.</Text>
                            <List
                                dataSource={[
                                    { name: 'Facebook', icon: <FacebookFilled style={{ color: '#1877F2', fontSize: '20px' }} /> },
                                    { name: 'Google', icon: <GoogleOutlined style={{ color: '#DB4437', fontSize: '20px' }} /> }
                                ]}
                                renderItem={(item) => (
                                    <List.Item extra={<Button type="text" style={{ color: '#4880FF', fontWeight: 600 }}>Connect</Button>}>
                                        <Space size={16}>
                                            <div style={{ width: '40px', height: '40px', background: '#F8FAFC', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {item.icon}
                                            </div>
                                            <Text strong>{item.name}</Text>
                                        </Space>
                                    </List.Item>
                                )}
                            />
                        </Card>

                        {/* Notifications */}
                        <Card bordered={false} title={<span style={{ fontSize: '16px', fontWeight: 700 }}>My notifications</span>} style={{ borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                            <Text type="secondary" style={{ display: 'block', marginBottom: '24px' }}>We'll send you updates about your appointments, news and marketing offers.</Text>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <Text strong style={{ display: 'block' }}>Text message appointment notifications</Text>
                                    <Text type="secondary" style={{ fontSize: '13px' }}>Receive texts based on your sender's settings</Text>
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
                style={{ borderRadius: '16px' }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                    requiredMark={false}
                    style={{ marginTop: '20px' }}
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
                                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
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
                    <div style={{ textAlign: 'right', marginTop: '24px' }}>
                        <Space>
                            <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                            <Button type="primary" htmlType="submit" loading={loading} style={{ background: '#4880FF' }}>
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
