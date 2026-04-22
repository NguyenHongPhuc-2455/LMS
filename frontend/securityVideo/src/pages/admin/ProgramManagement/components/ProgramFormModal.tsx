import { Modal, Form, Row, Col, Input, Select, Space, Upload, Button } from 'antd';
import { UploadCloud } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from '../ProgramManagement.module.scss';

const { Option } = Select;

interface ProgramFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (values: any, thumbFile: File | null) => Promise<void>;
    editingId?: number | null;
    initialValues?: any;
}

export default function ProgramFormModal({ open, onCancel, onSuccess, editingId, initialValues }: ProgramFormModalProps) {
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
            title={editingId ? 'Chỉnh sửa Chương trình học' : 'Tạo Chương trình học mới'}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={640}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Row gutter={16}>
                    <Col span={14}>
                        <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={10}>
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

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="status" label="Trạng thái" initialValue="DRAFT">
                            <Select showSearch={false}>
                                <Option value="DRAFT">Nháp</Option>
                                <Option value="PUBLISHED">Phát hành</Option>
                                <Option value="ARCHIVED">Lưu trữ</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="is_private" label="Chế độ truy cập" initialValue={false}>
                            <Select showSearch={false}>
                                <Option value={false}>Công khai</Option>
                                <Option value={true}>Riêng tư</Option>
                            </Select>
                        </Form.Item>
                    </Col>
                </Row>

                <Form.Item label="Ảnh bìa">
                    <Space direction="vertical" style={{ width: '100%' }}>
                        <Input
                            placeholder="Dán URL hoặc upload file"
                            value={thumbUrl}
                            onChange={e => setThumbUrl(e.target.value)}
                            suffix={
                                <Upload beforeUpload={file => {
                                    setThumbFile(file);
                                    const reader = new FileReader();
                                    reader.onload = e => setThumbUrl(e.target?.result as string);
                                    reader.readAsDataURL(file);
                                    return false;
                                }} showUploadList={false}>
                                    <UploadCloud size={18} style={{ cursor: 'pointer', color: '#6366f1' }} />
                                </Upload>
                            }
                        />
                        {thumbUrl && <img src={thumbUrl} className={styles.modalThumbPreview} alt="preview" />}
                    </Space>
                </Form.Item>

                <Button type="primary" htmlType="submit" block size="large">Hoàn tất</Button>
            </Form>
        </Modal>
    );
}
