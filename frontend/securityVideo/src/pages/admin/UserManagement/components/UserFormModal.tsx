import { Modal, Form, Input, Select, Button } from 'antd';

interface RoleData {
    id: number;
    name: string;
}

interface UserFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (values: any) => Promise<void>;
    roles: RoleData[];
    loading: boolean;
}

export default function UserFormModal({ open, onCancel, onSuccess, roles, loading }: UserFormModalProps) {
    const [form] = Form.useForm();

    const handleFinish = async (values: any) => {
        await onSuccess(values);
        form.resetFields();
    };

    return (
        <Modal
            title="Tạo thành viên mới"
            open={open}
            onCancel={onCancel}
            footer={null}
            className="premium-modal"
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{ role_id: 3 }}
            >
                <Form.Item name="full_name" label="Họ và tên">
                    <Input />
                </Form.Item>
                <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
                    <Input.Password />
                </Form.Item>
                <Form.Item name="gender" label="Giới tính">
                    <Select
                        options={[
                            { value: 'Nam', label: 'Nam' },
                            { value: 'Nữ', label: 'Nữ' },
                            { value: 'Khác', label: 'Khác' }
                        ]}
                    />
                </Form.Item>
                <Form.Item name="role_id" label="Vai trò chính" rules={[{ required: true }]}>
                    <Select
                        options={roles.map(r => ({ value: r.id, label: r.name.toUpperCase() }))}
                    />
                </Form.Item>
                <Button
                    type="primary"
                    htmlType="submit"
                    block
                    className="btn-primary"
                    loading={loading}
                >
                    Tạo ngay
                </Button>
            </Form>
        </Modal>
    );
}
