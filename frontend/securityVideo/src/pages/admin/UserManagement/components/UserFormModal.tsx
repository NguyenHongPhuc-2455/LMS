import React from 'react';
import { Modal, Form, Input, Select, Button, Row, Col, DatePicker, Space } from 'antd';
import dayjs from 'dayjs';

import type { Role as RoleData } from '../../../../types/user';

interface UserFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (values: any) => Promise<void>;
    roles: RoleData[];
    departments: any[];
    loading: boolean;
    initialValues?: any; // Dữ liệu cũ để sửa
}

export const UserFormModal = ({ open, onCancel, onSuccess, roles, departments, loading, initialValues }: UserFormModalProps) => {
    const [form] = Form.useForm();

    // Reset form khi dữ liệu initial thay đổi
    React.useEffect(() => {
        if (open) {
            if (initialValues) {
                // Trích xuất role_id từ mảng roles của user
                let roleId = initialValues.role_id;
                if (!roleId && initialValues.roles && initialValues.roles.length > 0) {
                    const firstRole = initialValues.roles[0];
                    roleId = typeof firstRole === 'object' ? firstRole.id : null;
                }

                // Xử lý một số trường đặc biệt như date
                const processedValues = {
                    ...initialValues,
                    role_id: roleId ? Number(roleId) : undefined,
                    join_date: initialValues.join_date ? dayjs(initialValues.join_date) : null,
                    dob: initialValues.dob ? dayjs(initialValues.dob) : null,
                };
                form.setFieldsValue(processedValues);
            } else {
                form.resetFields();
            }
        }
    }, [open, initialValues, form, roles]);

    const handleFinish = async (values: any) => {
        await onSuccess(values);
    };

    return (
        <Modal
            title={initialValues ? "Cập nhật thông tin nhân sự" : "Tạo thành viên mới"}
            open={open}
            onCancel={onCancel}
            footer={[
                <Space key="footer-actions">
                    <Button 
                        onClick={onCancel}
                        style={{ minWidth: 120, height: 40, borderRadius: '8px' }}
                    >
                        Hủy bỏ
                    </Button>
                    <Button
                        type="primary"
                        loading={loading}
                        onClick={() => form.submit()}
                        className="btn-primary"
                        style={{ minWidth: 120, height: 40, borderRadius: '8px' }}
                    >
                        {initialValues ? "Cập nhật" : "Tạo ngay"}
                    </Button>
                </Space>
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
                                options={roles.map(r => ({ value: Number(r.id), label: r.name.toUpperCase() }))}
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

                        <Form.Item name="phone" label="Số điện thoại">
                            <Input placeholder="Ví dụ: 0912345678" />
                        </Form.Item>

                        {!initialValues && (
                            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}>
                                <Input.Password placeholder="Tối thiểu 6 ký tự" />
                            </Form.Item>
                        )}
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item name="employee_id" label="Mã nhân sự">
                            <Input placeholder="MS-1234" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="join_date" label="Ngày vào làm">
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={12}>
                        <Form.Item name="department_id" label="Phòng ban">
                            <Select
                                placeholder="Chọn phòng ban"
                                options={departments.map(d => ({ value: d.id, label: d.name }))}
                                allowClear
                            />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="position" label="Vị trí">
                            <Input placeholder="Nhân viên" />
                        </Form.Item>
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
}
