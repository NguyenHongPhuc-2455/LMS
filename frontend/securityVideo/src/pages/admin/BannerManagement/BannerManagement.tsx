import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Switch, message, Typography, Upload } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { heroBannerService, type HeroBanner } from '../../../services/heroBanner.service';

const { Title } = Typography;

export default function BannerManagement() {
    const [banners, setBanners] = useState<HeroBanner[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<HeroBanner | null>(null);
    const [uploading, setUploading] = useState(false);
    const [form] = Form.useForm();
    const imageUrl = Form.useWatch('image_url', form);

    const fetchBanners = async () => {
        setLoading(true);
        try {
            const data = await heroBannerService.getAllAdmin();
            setBanners(data);
        } catch (error) {
            message.error('Không thể tải danh sách banner');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const handleAdd = () => {
        setEditingBanner(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleUpload = async (info: any) => {
        if (info.file.status === 'uploading') {
            setUploading(true);
            return;
        }
        if (info.file.status === 'done') {
            const url = info.file.response.url;
            form.setFieldsValue({ image_url: url });
            setUploading(false);
            message.success('Tải ảnh lên thành công');
        } else if (info.file.status === 'error') {
            setUploading(false);
            message.error('Tải ảnh lên thất bại');
        }
    };

    const handleEdit = (record: HeroBanner) => {
        setEditingBanner(record);
        form.setFieldsValue(record);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: 'Bạn có chắc chắn muốn xóa banner này không?',
            onOk: async () => {
                try {
                    await heroBannerService.delete(id);
                    message.success('Xóa banner thành công');
                    fetchBanners();
                } catch (error) {
                    message.error('Xóa banner thất bại');
                }
            }
        });
    };

    const handleToggleStatus = async (id: number, currentStatus: boolean) => {
        try {
            await heroBannerService.update(id, { is_active: !currentStatus });
            message.success('Cập nhật trạng thái thành công');
            fetchBanners();
        } catch (error) {
            message.error('Cập nhật trạng thái thất bại');
        }
    };

    const handleOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingBanner) {
                await heroBannerService.update(editingBanner.id, values);
                message.success('Cập nhật banner thành công');
            } else {
                await heroBannerService.create(values);
                message.success('Tạo banner mới thành công');
            }
            setIsModalOpen(false);
            fetchBanners();
        } catch (error) {
            console.error('Validation failed:', error);
        }
    };

    const columns = [
        {
            title: 'Thứ tự',
            dataIndex: 'order',
            key: 'order',
            width: 80,
        },
        {
            title: 'Tiêu đề',
            dataIndex: 'title',
            key: 'title',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Màu nền',
            dataIndex: 'color_code',
            key: 'color_code',
            render: (color: string) => (
                <Space>
                    <div style={{ width: 20, height: 20, backgroundColor: color || '#C8102E', border: '1px solid #ddd' }}></div>
                    {color || '#C8102E'}
                </Space>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active: boolean, record: HeroBanner) => (
                <Switch checked={active} onChange={() => handleToggleStatus(record.id, active)} />
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: HeroBanner) => (
                <Space size="middle">
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                <Title level={3} style={{ margin: 0 }}>Quản lý Banner Home</Title>
                <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} style={{ backgroundColor: '#C72127' }}>
                    Thêm Banner
                </Button>
            </div>

            <Table 
                columns={columns} 
                dataSource={banners} 
                rowKey="id" 
                loading={loading}
                pagination={false}
            />

            <Modal
                title={editingBanner ? "Chỉnh sửa Banner" : "Thêm Banner mới"}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
                width={700}
                okText="Lưu"
                cancelText="Hủy"
                okButtonProps={{ style: { backgroundColor: '#C72127' } }}
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ is_active: true, color_code: '#C8102E' }}
                >
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
                            <Input placeholder="VD: Khóa học đa dạng" />
                        </Form.Item>
                        <Form.Item name="stat_value" label="Số liệu (Stat)">
                            <Input placeholder="VD: 24+ khóa học" />
                        </Form.Item>
                    </div>

                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} placeholder="Mô tả ngắn gọn về banner..." />
                    </Form.Item>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'end' }}>
                        <Form.Item name="image_url" label="Hình ảnh Banner">
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Upload
                                    name="image"
                                    listType="picture-card"
                                    className="avatar-uploader"
                                    showUploadList={false}
                                    action={`${import.meta.env.VITE_API_URL}/upload/image`}
                                    headers={{ Authorization: `Bearer ${localStorage.getItem('accessToken')}` }}
                                    onChange={handleUpload}
                                >
                                    {imageUrl ? (
                                        <img src={imageUrl} alt="banner" style={{ width: '100%' }} />
                                    ) : (
                                        <div>
                                            {uploading ? <LoadingOutlined /> : <PlusOutlined />}
                                            <div style={{ marginTop: 8 }}>Tải ảnh lên</div>
                                        </div>
                                    )}
                                </Upload>
                                <Input 
                                    placeholder="Dán URL ảnh vào đây" 
                                    onChange={(e) => form.setFieldsValue({ image_url: e.target.value })}
                                    value={imageUrl}
                                />
                            </Space>
                        </Form.Item>
                        <Form.Item name="color_code" label="Mã màu nền">
                            <Input placeholder="#C8102E" />
                        </Form.Item>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <Form.Item name="order" label="Thứ tự">
                            <InputNumber min={0} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="is_active" label="Kích hoạt" valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </div>
                </Form>
            </Modal>
        </div>
    );
}
