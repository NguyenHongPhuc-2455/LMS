import { Modal, Form, Row, Col, Input, Select, Space, Upload, Button, Switch, InputNumber } from 'antd';
import { UploadCloud } from 'lucide-react';
import { useState, useEffect } from 'react';
import { WarningOutlined } from '@ant-design/icons';
import styles from '../CourseManagement.module.scss';

const { Option } = Select;

interface CourseFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (values: any, thumbFile: File | null) => Promise<void>;
    editingId?: number | null;
    initialValues?: any;
    categories: any[];
}

export default function CourseFormModal({ open, onCancel, onSuccess, editingId, initialValues, categories }: CourseFormModalProps) {
    const [form] = Form.useForm();
    const [thumbFile, setThumbFile] = useState<File | null>(null);
    const [thumbUrl, setThumbUrl] = useState<string>('');
    const [isMandatory, setIsMandatory] = useState(false);

    useEffect(() => {
        if (open) {
            if (editingId && initialValues) {
                form.setFieldsValue(initialValues);
                setThumbUrl(initialValues.thumbnail || '');
                setIsMandatory(!!initialValues.is_mandatory);
            } else {
                form.resetFields();
                setThumbUrl('');
                setIsMandatory(false);
            }
            setThumbFile(null);
        }
    }, [open, editingId, initialValues, form]);

    const handleFinish = async (values: any) => {
        await onSuccess(values, thumbFile);
    };

    return (
        <Modal
            title={editingId ? "Chỉnh sửa Khóa học" : "Khởi tạo Khóa học"}
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel} size="large">Hủy</Button>,
                <Button key="submit" type="primary" onClick={() => form.submit()} size="large" style={{ minWidth: 150 }}>
                    {editingId ? "Cập nhật" : "Tạo khóa học"}
                </Button>
            ]}
            width={900}
            style={{ top: 100 }}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Row gutter={24}>
                    {/* Cột trái */}
                    <Col span={12}>
                        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
                            <Input placeholder="Nhập tiêu đề khóa học" />
                        </Form.Item>

                        <Form.Item name="level" label="Trình độ" initialValue="Cơ bản">
                            <Select showSearch={false}>
                                <Option value="Cơ bản">Cơ bản</Option>
                                <Option value="Trung cấp">Trung cấp</Option>
                                <Option value="Nâng cao">Nâng cao</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item name="category_id" label="Danh mục">
                            <Select placeholder="Chọn danh mục" allowClear>
                                {categories.map(cat => (
                                    <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="description" label="Mô tả">
                            <Input.TextArea rows={4} placeholder="Mô tả tóm tắt về khóa học" />
                        </Form.Item>

                        <Form.Item name="is_private" label="Chế độ truy cập" initialValue={false}>
                            <Select showSearch={false}>
                                <Option value={false}>Công khai (Tự động cấp quyền)</Option>
                                <Option value={true}>Riêng tư (Cần phê duyệt)</Option>
                            </Select>
                        </Form.Item>

                        <Form.Item
                            name="is_mandatory"
                            label="Khóa học bắt buộc"
                            valuePropName="checked"
                            initialValue={false}
                        >
                            <Switch
                                checkedChildren="BẮt buộc"
                                unCheckedChildren="Không bắt buộc"
                                onChange={(val) => setIsMandatory(val)}
                            />
                        </Form.Item>

                        {isMandatory && (
                            <Form.Item
                                name="mandatory_deadline_days"
                                label={
                                    <span>
                                        <WarningOutlined style={{ color: '#faad14', marginRight: 6 }} />
                                        Hạn chót (số ngày kể từ ngày nhận việc)
                                    </span>
                                }
                                initialValue={60}
                                rules={[{ required: true, message: 'Vui lòng nhập số ngày' }]}
                            >
                                <InputNumber min={1} max={365} addonAfter="ngày" style={{ width: '100%' }} />
                            </Form.Item>
                        )}
                    </Col>

                    {/* Cột phải */}
                    <Col span={12}>
                        <Form.Item name="thumbnail" label="Hình ảnh khóa học (Thumbnail)">
                            <Space direction="vertical" className={styles.fullWidth} style={{ width: '100%' }}>
                                <Input
                                    placeholder="Dán URL ảnh hoặc chọn file"
                                    value={thumbUrl}
                                    onChange={(e) => {
                                        setThumbUrl(e.target.value);
                                        form.setFieldsValue({ thumbnail: e.target.value });
                                    }}
                                    suffix={
                                        <Upload
                                            beforeUpload={(file) => {
                                                setThumbFile(file);
                                                const reader = new FileReader();
                                                reader.onload = e => setThumbUrl(e.target?.result as string);
                                                reader.readAsDataURL(file);
                                                return false;
                                            }}
                                            showUploadList={false}
                                        >
                                            <UploadCloud size={18} className={styles.uploadIcon} style={{ cursor: 'pointer' }} />
                                        </Upload>
                                    }
                                />
                                {thumbUrl && (
                                    <div style={{ textAlign: 'center' }}>
                                        <img src={thumbUrl} className={styles.thumbPreview} alt="Preview" style={{ maxHeight: '100px', width: 'auto' }} />
                                    </div>
                                )}
                            </Space>
                        </Form.Item>

                        <Form.Item name="learning_outcomes" label="Bạn sẽ học được gì? (Mỗi dòng một ý)">
                            <Input.TextArea rows={3} placeholder="Mục tiêu đầu ra của khóa học..." />
                        </Form.Item>

                        <Form.Item name="requirements" label="Yêu cầu (Mỗi dòng một ý)">
                            <Input.TextArea rows={3} placeholder="Các kiến thức cần chuẩn bị..." />
                        </Form.Item>
                    </Col>
                </Row>

            </Form>
        </Modal>
    );
}
