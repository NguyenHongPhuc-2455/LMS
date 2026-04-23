import { Modal, Form, Input, Select, Button, Row, Col } from 'antd';

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
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Hủy bỏ
                </Button>,
                <Button
                    key="submit"
                    type="primary"
                    loading={loading}
                    onClick={() => form.submit()}
                    size="large"
                    className="btn-primary"
                    style={{ minWidth: 120 }}
                >
                    Tạo ngay
                </Button>
            ]}
            width={800}
            style={{ top: 100 }}
            destroyOnClose
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{ role_id: 3 }}
                style={{ marginTop: 8 }}
            >
                <Row gutter={24}>
                    {/* Cột trái: Thông tin cá nhân */}
                    <Col span={12}>
                        <Form.Item name="full_name" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                            <Input placeholder="Ví dụ: Nguyễn Văn A" />
                        </Form.Item>

                        <Form.Item name="gender" label="Giới tính">
                            <Select
                                placeholder="Chọn giới tính"
                                showSearch={false}
                                options={[
                                    { value: 'Nam', label: 'Nam' },
                                    { value: 'Nữ', label: 'Nữ' },
                                    { value: 'Khác', label: 'Khác' }
                                ]}
                            />
                        </Form.Item>

                        <Form.Item name="role_id" label="Vai trò chính" rules={[{ required: true }]}>
                            <Select
                                placeholder="Chọn vai trò"
                                showSearch={false}
                                options={roles.map(r => ({ value: r.id, label: r.name.toUpperCase() }))}
                            />
                        </Form.Item>
                    </Col>

                    {/* Cột phải: Thông tin tài khoản */}
                    <Col span={12}>
                        <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}>
                            <Input placeholder="Ví dụ: nguyenvana" />
                        </Form.Item>

                        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                            <Input placeholder="Ví dụ: a@example.com" />
                        </Form.Item>

                        <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
                            <Input.Password placeholder="Tối thiểu 6 ký tự" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
}
