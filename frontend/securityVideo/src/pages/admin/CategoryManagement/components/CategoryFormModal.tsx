import React, { useEffect } from 'react';
import { Modal, Form, Input, message } from 'antd';
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
            if (error.response?.data?.error) {
                message.error(error.response.data.error);
            }
        }
    };

    return (
        <Modal
            title={category ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}
            open={visible}
            onCancel={onCancel}
            onOk={handleSubmit}
            okText={category ? 'Cập nhật' : 'Thêm mới'}
            cancelText="Hủy"
            destroyOnClose
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
