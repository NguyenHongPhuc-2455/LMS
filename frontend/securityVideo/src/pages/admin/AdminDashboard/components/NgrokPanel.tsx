import React, { useEffect, useState } from 'react';
import { Card, Form, Input, Switch, Button, message, Space, Typography, Badge, Tooltip } from 'antd';
import { ShareAltOutlined, SaveOutlined, CopyOutlined, GlobalOutlined, InfoCircleOutlined } from '@ant-design/icons';
import api from '../../../../services/api';

const { Title, Text, Paragraph } = Typography;

export default function NgrokPanel() {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await api.get('system/settings');
            if (res.data && res.data.status === 'success') {
                form.setFieldsValue(res.data.data);
                // Save to localStorage so dynamic URLs update instantly on local client
                localStorage.setItem('system_settings', JSON.stringify(res.data.data));
            }
        } catch (error: any) {
            console.error('Lỗi lấy cấu hình hệ thống:', error);
            message.error('Không thể tải cấu hình Ngrok');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const onFinish = async (values: any) => {
        setSaving(true);
        try {
            const res = await api.post('system/settings', values);
            if (res.data && res.data.status === 'success') {
                message.success('Đã lưu cấu hình hệ thống thành công!');
                // Cập nhật lại localStorage
                localStorage.setItem('system_settings', JSON.stringify(res.data.data));

                // Cập nhật lại baseURL và socketURL của api động
                const isNgrok = window.location.hostname.includes('ngrok');
                if (isNgrok && values.ngrok_be_url) {
                    api.defaults.baseURL = values.ngrok_be_url.replace(/\/$/, '') + '/api/';
                }
            }
        } catch (error: any) {
            console.error('Lỗi lưu cấu hình:', error);
            message.error(error.response?.data?.message || 'Có lỗi xảy ra khi lưu cấu hình');
        } finally {
            setSaving(false);
        }
    };

    const copyToClipboard = (textKey: string) => {
        const val = form.getFieldValue(textKey);
        if (!val) {
            message.warning('Không có nội dung để sao chép');
            return;
        }
        navigator.clipboard.writeText(val);
        message.success('Đã sao chép link thành công!');
    };

    const isCurrentNgrok = window.location.hostname.includes('ngrok');

    return (
        <Card
            title={
                <Space>
                    <ShareAltOutlined style={{ color: '#1890ff', fontSize: 18 }} />
                    <span style={{ fontWeight: 600 }}>Cấu hình kết nối chia sẻ (Ngrok)</span>
                </Space>
            }
            extra={
                <Badge
                    status={isCurrentNgrok ? 'success' : 'default'}
                    text={isCurrentNgrok ? 'Đang chạy qua Ngrok' : 'Chế độ Local'}
                />
            }
            style={{
                marginBottom: 24,
                borderRadius: 5,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
                border: '1px solid #f0f0f0',
                minHeight: 395
            }}
            loading={loading}
        >
            <Paragraph type="secondary" style={{ marginBottom: 20 }}>
                Thiết lập URL Ngrok để cho phép các thiết bị khác (điện thoại, mạng ngoài) truy cập và học tập song song.
                Bạn có thể bật hoặc ẩn liên kết chia sẻ đối với học viên.
            </Paragraph>

            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                initialValues={{
                    ngrok_fe_url: 'https://unperceptive-sau-divaricately.ngrok-free.dev',
                    ngrok_be_url: 'https://frostbite-payphone-rerun.ngrok-free.dev/',
                    show_sharing_link: true
                }}
            >
                <Form.Item
                    label={
                        <Space>
                            <GlobalOutlined />
                            <strong>Link Ngrok Frontend (FE)</strong>
                            <Tooltip title="Link ngrok của client (Frontend). Ví dụ: https://unperceptive-sau-divaricately.ngrok-free.dev">
                                <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                            </Tooltip>
                        </Space>
                    }
                    name="ngrok_fe_url"
                    rules={[{ required: true, message: 'Vui lòng nhập link FE Ngrok' }]}
                >
                    <Input
                        placeholder="https://unperceptive-sau-divaricately.ngrok-free.dev"
                        addonAfter={
                            <Tooltip title="Sao chép link">
                                <CopyOutlined
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => copyToClipboard('ngrok_fe_url')}
                                />
                            </Tooltip>
                        }
                    />
                </Form.Item>

                <Form.Item
                    label={
                        <Space>
                            <GlobalOutlined />
                            <strong>Link Ngrok Backend (BE)</strong>
                            <Tooltip title="Link ngrok của máy chủ (Backend). Ví dụ: https://frostbite-payphone-rerun.ngrok-free.dev/">
                                <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
                            </Tooltip>
                        </Space>
                    }
                    name="ngrok_be_url"
                    rules={[{ required: true, message: 'Vui lòng nhập link BE Ngrok' }]}
                >
                    <Input
                        placeholder="https://frostbite-payphone-rerun.ngrok-free.dev"
                        addonAfter={
                            <Tooltip title="Sao chép link">
                                <CopyOutlined
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => copyToClipboard('ngrok_be_url')}
                                />
                            </Tooltip>
                        }
                    />
                </Form.Item>

                <Form.Item
                    label={<strong>Liên kết chia sẻ</strong>}
                    name="show_sharing_link"
                    valuePropName="checked"
                >
                    <Space size="middle">
                        <Switch />
                        <Text>Hiện link chia sẻ ngrok FE cho mọi học viên thấy trên Trang chủ</Text>
                    </Space>
                </Form.Item>

                <Form.Item style={{ marginBottom: 0 }}>
                    <Button
                        type="primary"
                        htmlType="submit"
                        icon={<SaveOutlined />}
                        loading={saving}
                        style={{ height: 32, borderRadius: 5 }}
                    >
                        Lưu cấu hình
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
}
