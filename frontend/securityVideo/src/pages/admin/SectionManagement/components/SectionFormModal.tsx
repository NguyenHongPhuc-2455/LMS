import { Modal, Form, Input, Button } from 'antd';
import { useEffect } from 'react';

interface SectionFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (values: any) => Promise<void>;
    editingId: number | null;
    initialValues?: any;
    loading?: boolean;
}

export default function SectionFormModal({
    open,
    onCancel,
    onSuccess,
    editingId,
    initialValues,
    loading
}: SectionFormModalProps) {
    const [form] = Form.useForm();

    useEffect(() => {
        if (open) {
            form.resetFields();
            if (initialValues) {
                form.setFieldsValue(initialValues);
            }
        }
    }, [open, initialValues, form]);

    const handleFinish = async (values: any) => {
        await onSuccess(values);
        form.resetFields();
    };

    return (
        <Modal
            title={editingId ? "Chỉnh sửa Chương" : "Thêm Chương Mới"}
            open={open}
            onCancel={onCancel}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <Button onClick={onCancel} className="modal-action-btn">
                        Hủy
                    </Button>
                    <Button type="primary" onClick={() => form.submit()} loading={loading} className="btn-brand-primary modal-action-btn">
                        {editingId ? "Cập nhật" : "Thêm mới"}
                    </Button>
                </div>
            }
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
