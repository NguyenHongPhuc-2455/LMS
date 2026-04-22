import { Modal, Form, Row, Col, Input, Select, Space, Upload, Button } from 'antd';
import { UploadCloud } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from '../CourseManagement.module.scss';

const { Option } = Select;

interface CourseFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (values: any, thumbFile: File | null) => Promise<void>;
    editingId?: number | null;
    initialValues?: any;
}

export default function CourseFormModal({ open, onCancel, onSuccess, editingId, initialValues }: CourseFormModalProps) {
    const [form] = Form.useForm();
    const [thumbFile, setThumbFile] = useState<File | null>(null);
    const [thumbUrl, setThumbUrl] = useState<string>('');

    useEffect(() => {
        if (open) {
            if (editingId && initialValues) {
                form.setFieldsValue(initialValues);
                setThumbUrl(initialValues.thumbnail || '');
            } else {
                form.resetFields();
                setThumbUrl('');
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
            footer={null}
            width={700}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="level" label="Trình độ" initialValue="Cơ bản">
                            <Select showSearch={false}>
                                <Option value="Cơ bản">Cơ bản</Option>
                                <Option value="Trung cấp">Trung cấp</Option>
                                <Option value="Nâng cao">Nâng cao</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item name="description" label="Mô tả">
                    <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item name="is_private" label="Chế độ truy cập" initialValue={false}>
                    <Select showSearch={false}>
                        <Option value={false}>Công khai (Tự động cấp quyền)</Option>
                        <Option value={true}>Riêng tư (Cần phê duyệt)</Option>
                    </Select>
                </Form.Item>

                <Form.Item label="Hình ảnh khóa học (Thumbnail)">
                    <Space direction="vertical" className={styles.fullWidth} style={{ width: '100%' }}>
                        <Input
                            placeholder="Dán URL ảnh hoặc chọn file"
                            value={thumbUrl}
                            onChange={(e) => setThumbUrl(e.target.value)}
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
                        {thumbUrl && <img src={thumbUrl} className={styles.thumbPreview} alt="Preview" />}
                    </Space>
                </Form.Item>

                <Form.Item name="learning_outcomes" label="Bạn sẽ học được gì? (Mỗi dòng một ý)">
                    <Input.TextArea rows={3} />
                </Form.Item>

                <Form.Item name="requirements" label="Yêu cầu (Mỗi dòng một ý)">
                    <Input.TextArea rows={3} />
                </Form.Item>

                <Button type="primary" htmlType="submit" block size="large">Hoàn tất</Button>
            </Form>
        </Modal>
    );
}
