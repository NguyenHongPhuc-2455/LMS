import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Modal, Form, Input, InputNumber, Switch, message, Upload, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, LoadingOutlined } from '@ant-design/icons';
import { heroBannerService, type HeroBanner } from '../../../services/heroBanner.service';
import { getBackendUrl } from '../../../services/api';
import styles from './BannerManagement.module.scss';

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
            // Đảm bảo các trường bắt buộc ở backend luôn có giá trị mặc định
            const submissionData = {
                ...values,
                title: values.title || 'Home Banner',
                description: values.description || '',
                stat_value: values.stat_value || '',
                color_code: values.color_code || '#C8102E'
            };

            if (editingBanner) {
                await heroBannerService.update(editingBanner.id, submissionData);
                message.success('Cập nhật banner thành công');
            } else {
                await heroBannerService.create(submissionData);
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
            title: 'Ảnh',
            dataIndex: 'image_url',
            key: 'image_url',
            width: 150,
            render: (url: string) => <img src={url} alt="Banner" className={styles.bannerPreview} />
        },
        {
            title: 'Thứ tự',
            dataIndex: 'order',
            key: 'order',
            width: 80,
            sorter: (a: HeroBanner, b: HeroBanner) => a.order - b.order,
            render: (text: any) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_active',
            key: 'is_active',
            render: (active: boolean, record: HeroBanner) => (
                <div style={{ whiteSpace: 'nowrap' }}>
                    <Switch checked={active} onChange={() => handleToggleStatus(record.id, active)} />
                </div>
            )
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            render: (_: any, record: HeroBanner) => (
                <Space size="middle" style={{ whiteSpace: 'nowrap' }}>
                    <Button icon={<EditOutlined />} onClick={() => handleEdit(record)} />
                    <Button icon={<DeleteOutlined />} danger onClick={() => handleDelete(record.id)} />
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.bannerManagementContainer}>
            {/* <div className={styles.bannerManagementHeader}>
                <div className={styles.headerInfo}>
                    <Title level={4} className={styles.headerTitle}>Quản lý Banner Home</Title>
                    <Text type="secondary">Quản lý nội dung, hình ảnh và thứ tự hiển thị của Banner trên trang chủ</Text>
                </div>
            </div> */}

            <Card className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                    <Button 
                        type="primary" 
                        icon={<PlusOutlined />} 
                        onClick={handleAdd} 
                        className={styles.addButton}
                    >
                        Thêm
                    </Button>
                </div>

                <div className={styles.tableWrapper}>
                    <Table 
                        columns={columns} 
                        dataSource={banners} 
                        rowKey="id" 
                        loading={loading}
                        pagination={false}
                    />
                </div>
            </Card>

            <Modal
                title={editingBanner ? "Chỉnh sửa Banner" : "Thêm Banner mới"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                width={700}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <Button onClick={() => setIsModalOpen(false)} className="modal-action-btn">
                            Hủy
                        </Button>
                        <Button type="primary" onClick={handleOk} className="btn-brand-primary modal-action-btn">
                            {editingBanner ? 'Lưu' : 'Thêm mới'}
                        </Button>
                    </div>
                }
            >
                <Form
                    form={form}
                    layout="vertical"
                    initialValues={{ is_active: true }}
                >
                    <Form.Item name="image_url" label="Hình ảnh Banner" rules={[{ required: true, message: 'Vui lòng chọn hoặc nhập URL ảnh' }]}>
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Upload
                                name="image"
                                listType="picture-card"
                                className="avatar-uploader"
                                showUploadList={false}
                                action={`${getBackendUrl()}/api/upload/image?type=banners`}
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

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
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
