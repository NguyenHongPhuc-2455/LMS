import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, message, Button } from 'antd';
import { categoryService, type Category } from '@/services/category.service';

interface CategoryFormModalProps {
    visible: boolean;
    onCancel: () => void;
    onSuccess: () => void;
    category?: Category | null;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
    visible,
    onCancel,
    onSuccess,
    category
}) => {
    const [form] = Form.useForm();

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (visible) {
            if (category) {
                form.setFieldsValue({
                    name: category.name,
                    description: category.description
                });
            } else {
                form.resetFields();
            }
        }
    }, [visible, category, form]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);
            if (category) {
                await categoryService.updateCategory(category.id, values);
                message.success('Cập nhật danh mục thành công');
            } else {
                await categoryService.createCategory(values);
                message.success('Thêm danh mục mới thành công');
            }
            onSuccess();
        } catch (error: any) {
            console.error('Submit failed:', error);
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Lỗi khi lưu dữ liệu';
            message.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            open={visible}
            onCancel={onCancel}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <Button onClick={onCancel} style={{ minWidth: 100, height: 40, borderRadius: '8px' }}>
                        Hủy
                    </Button>
                    <Button type="primary" onClick={handleSubmit} loading={loading} style={{ minWidth: 100, height: 40, borderRadius: '8px', background: '#B8121A', borderColor: '#B8121A' }}>
                        {category ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                </div>
            }
            destroyOnClose
            style={{ top: 60 }}
        >
            <Form
                form={form}
                layout="vertical"
                style={{ marginTop: 20 }}
            >
                <Form.Item
                    name="name"
                    label="Tên danh mục"
                    rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}
                >
                    <Input placeholder="Ví dụ: Lập trình Web, Design, Marketing..." />
                </Form.Item>
                <Form.Item
                    name="description"
                    label="Mô tả"
                >
                    <Input.TextArea
                        rows={4}
                        placeholder="Mô tả ngắn gọn về danh mục này..."
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default CategoryFormModal;
