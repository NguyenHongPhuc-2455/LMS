import { Modal, Form, Input, Button } from 'antd';
import { useEffect } from 'react';

interface SectionFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (values: any) => Promise<void>;
    editingId: number | null;
    initialValues?: any;
}

export default function SectionFormModal({
    open,
    onCancel,
    onSuccess,
    editingId,
    initialValues
}: SectionFormModalProps) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            if (editingId && initialValues) {
                form.setFieldsValue(initialValues);
            } else {
                form.resetFields();
            }
        }
    }, [open, editingId, initialValues, form]);

    const handleFinish = async (values: any) => {
        await onSuccess(values);
        form.resetFields();
    };

    return (
        <Modal
            title={editingId ? "Chỉnh sửa Chương" : "Thêm Chương Mới"}
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="cancel" onClick={onCancel} size="large">Hủy</Button>,
                <Button key="submit" type="primary" onClick={() => form.submit()} size="large">
                    {editingId ? "Cập nhật" : "Tạo mới"}
                </Button>
            ]}
            style={{ top: 100 }}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish}>
                <Form.Item
                    name="title"
                    label="Tiêu đề chương"
                    rules={[{ required: true, message: 'Vui lòng nhập tiêu đề chương' }]}
                >
                    <Input placeholder="Ví dụ: Chương 1: Giới thiệu" />
                </Form.Item>
                <Form.Item
                    name="order"
                    label="Thứ tự hiển thị"
                    initialValue={0}
                >
                    <Input type="number" />
                </Form.Item>
            </Form>
        </Modal>
    );
}
