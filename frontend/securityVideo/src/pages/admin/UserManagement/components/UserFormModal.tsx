import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, Button, Row, Col, DatePicker, Space, Divider, Typography, Tag, Avatar, TreeSelect } from 'antd';
import { EditOutlined, SaveOutlined, CloseOutlined, UserOutlined, MailOutlined, PhoneOutlined, CalendarOutlined, TeamOutlined, IdcardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import type { Role as RoleData } from '../../../../types/user';

const { Text } = Typography;

interface UserFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (values: any) => Promise<void>;
    roles: RoleData[];
    departments: any[];
    positions: any[];
    loading: boolean;
    initialValues?: any;
}

export const UserFormModal = ({ open, onCancel, onSuccess, roles, departments, positions, loading, initialValues }: UserFormModalProps) => {
    const [form] = Form.useForm();
    const [isEditing, setIsEditing] = useState(false);

    // Reset form và chế độ khi mở modal
    useEffect(() => {
        if (open) {
            if (initialValues) {
                setIsEditing(false); // Mặc định là chế độ xem nếu có data cũ
                
                let roleId = initialValues.role_id;
                if (!roleId && initialValues.roles && initialValues.roles.length > 0) {
                    const firstRole = initialValues.roles[0];
                    roleId = typeof firstRole === 'object' ? firstRole.id : null;
                }

                const processedValues = {
                    ...initialValues,
                    role_id: roleId ? Number(roleId) : undefined,
                    department_id: (initialValues.department_id !== undefined && initialValues.department_id !== null) ? Number(initialValues.department_id) : undefined,
                    position_id: (initialValues.position_id !== undefined && initialValues.position_id !== null) ? Number(initialValues.position_id) : undefined,
                    join_date: initialValues.join_date ? dayjs(initialValues.join_date) : null,
                    dob: initialValues.dob ? dayjs(initialValues.dob) : null,
                };
                form.setFieldsValue(processedValues);
            } else {
                setIsEditing(true); // Mặc định là chế độ edit nếu tạo mới
                form.resetFields();
            }
        }
    }, [open, initialValues, form]);

    // Lấy tên vai trò để hiển thị ở chế độ xem
    const currentRole = initialValues?.roles?.[0];
    const currentRoleName = typeof currentRole === 'object' ? currentRole.name : (initialValues?.role_id ? roles.find(r => r.id === Number(initialValues.role_id))?.name : null);

    const handleFinish = async (values: any) => {
        await onSuccess(values);
    };

    const renderField = (label: string, name: string, icon: React.ReactNode, content: React.ReactNode, input: React.ReactNode) => {
        if (!isEditing) {
            return (
                <div style={{ marginBottom: 16 }}>
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: 2 }}>
                        {label}
                    </Text>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#2d3748' }}>
                        {content || <Text type="secondary" italic style={{ fontWeight: 400, fontSize: 13 }}>Chưa cập nhật</Text>}
                    </div>
                </div>
            );
        }
        return (
            <Form.Item name={name} label={<Space size={4}>{icon}{label}</Space>} rules={[{ required: ['full_name', 'username', 'email', 'role_id'].includes(name) }]}>
                {input}
            </Form.Item>
        );
    };

    return (
        <Modal
            title={
                <Space>
                    {initialValues ? <IdcardOutlined /> : <UserOutlined />}
                    <span>{initialValues ? (isEditing ? "Cập nhật thông tin nhân sự" : "Chi tiết nhân sự") : "Tạo thành viên mới"}</span>
                </Space>
            }
            open={open}
            onCancel={onCancel}
            destroyOnClose
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '10px 0' }}>
                    <Button onClick={onCancel} style={{ borderRadius: 8, height: 40, minWidth: 100 }}>
                        {isEditing ? "Hủy bỏ" : "Đóng"}
                    </Button>
                    
                    {initialValues && !isEditing ? (
                        <Button 
                            type="primary" 
                            icon={<EditOutlined />} 
                            onClick={() => setIsEditing(true)}
                            style={{ borderRadius: 8, height: 40, minWidth: 120, background: '#B8121A', borderColor: '#B8121A' }}
                        >
                            Chỉnh sửa
                        </Button>
                    ) : (
                        <Button
                            type="primary"
                            loading={loading}
                            icon={<SaveOutlined />}
                            onClick={() => form.submit()}
                            style={{ borderRadius: 8, height: 40, minWidth: 120, background: '#B8121A', borderColor: '#B8121A' }}
                        >
                            {initialValues ? "Lưu thay đổi" : "Tạo ngay"}
                        </Button>
                    )}
                </div>
            }
            width={1000}
            style={{ top: 60 }}
            styles={{
                header: {
                    borderBottom: '1px solid #f0f0f0',
                    paddingBottom: 16,
                    marginBottom: 24
                },
                body: {
                    paddingTop: 0
                }
            }}
            maskClosable={!isEditing}
        >
            {!isEditing && initialValues && (
                <div style={{ 
                    marginBottom: 20, 
                    paddingBottom: 16, 
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 16 
                }}>
                    <Avatar 
                        size={64} 
                        src={initialValues.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(initialValues.full_name || 'U')}&background=EBF4FF&color=4c3f91&size=100`}
                        style={{ border: '2px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                    />
                    <div style={{ flex: 1 }}>
                        <Typography.Title level={5} style={{ margin: 0, color: '#1a202c', fontSize: 18 }}>{initialValues.full_name}</Typography.Title>
                        <Text type="secondary" style={{ fontSize: 13 }}>@{initialValues.username} · {initialValues.employee_id || 'Chưa cập nhật mã NV'}</Text>
                    </div>
                    <Text strong style={{ fontSize: 12, color: '#1a202c', letterSpacing: '0.5px' }}>
                        {currentRoleName?.toUpperCase()}
                    </Text>
                </div>
            )}

            <Form
                form={form}
                key={initialValues?.id || 'new'}
                layout="vertical"
                onFinish={handleFinish}
                initialValues={{ role_id: 3 }}
                requiredMark={isEditing}
                style={{ marginTop: !isEditing ? 0 : 10 }}
            >
                <Row gutter={48}>
                    {/* Cột 1: THÔNG TIN CÁ NHÂN */}
                    <Col span={8} style={{ borderRight: !isEditing ? '1px solid #f0f0f0' : 'none' }}>
                        <Divider orientation={"left" as any} plain style={{ margin: '0 0 20px 0' }}>
                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, color: '#a0aec0' }}>THÔNG TIN CÁ NHÂN</Text>
                        </Divider>
                        
                        {renderField("Họ và tên", "full_name", <UserOutlined />, initialValues?.full_name, 
                            <Input placeholder="Nguyễn Văn A" />
                        )}

                        {renderField("Giới tính", "gender", <UserOutlined />, initialValues?.gender,
                            <Select
                                placeholder="Chọn giới tính"
                                options={[{ value: 'Nam', label: 'Nam' }, { value: 'Nữ', label: 'Nữ' }, { value: 'Khác', label: 'Khác' }]}
                            />
                        )}

                        {renderField("Vai trò", "role_id", <TeamOutlined />, currentRoleName ? <Text strong style={{ fontSize: 14, color: '#2d3748' }}>{currentRoleName.toUpperCase()}</Text> : null,
                            <Select
                                showSearch
                                optionFilterProp="label"
                                placeholder="Chọn vai trò"
                                options={roles?.map(r => ({ value: Number(r.id), label: r.name.toUpperCase() })) || []}
                            />
                        )}
                    </Col>

                    {/* Cột 2: TÀI KHOẢN & LIÊN HỆ */}
                    <Col span={8} style={{ borderRight: !isEditing ? '1px solid #f0f0f0' : 'none' }}>
                        <Divider orientation={"left" as any} plain style={{ margin: '0 0 20px 0' }}>
                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, color: '#a0aec0' }}>TÀI KHOẢN & LIÊN HỆ</Text>
                        </Divider>
                        
                        {renderField("Tên đăng nhập", "username", <UserOutlined />, <Text code style={{ fontSize: 13 }}>{initialValues?.username}</Text>,
                            <Input placeholder="nguyenvana" />
                        )}

                        {renderField("Email", "email", <MailOutlined />, initialValues?.email,
                            <Input placeholder="a@gmail.com" />
                        )}

                        {renderField("Số điện thoại", "phone", <PhoneOutlined />, initialValues?.phone,
                            <Input placeholder="0912..." />
                        )}

                        {isEditing && !initialValues && (
                            <Form.Item name="password" label={<Space size={4}><IdcardOutlined />Mật khẩu</Space>} rules={[{ required: true, min: 6 }]}>
                                <Input.Password placeholder="Tối thiểu 6 ký tự" />
                            </Form.Item>
                        )}
                    </Col>

                    {/* Cột 3: CÔNG TÁC */}
                    <Col span={8}>
                        <Divider orientation={"left" as any} plain style={{ margin: '0 0 20px 0' }}>
                            <Text type="secondary" style={{ fontSize: 11, fontWeight: 700, color: '#a0aec0' }}>CÔNG TÁC</Text>
                        </Divider>
                        
                        {renderField("Mã nhân sự", "employee_id", <IdcardOutlined />, initialValues?.employee_id,
                            <Input placeholder="NV001" />
                        )}
                        {renderField("Phòng ban", "department_id", <TeamOutlined />, initialValues?.department || (departments.find(d => d.id === initialValues?.department_id)?.name),
                            <TreeSelect
                                showSearch
                                style={{ width: '100%' }}
                                dropdownStyle={{ maxHeight: 400, overflow: 'auto' }}
                                placeholder="Chọn phòng ban"
                                allowClear
                                treeDefaultExpandAll
                                treeData={(() => {
                                    const map = new Map();
                                    departments.forEach(item => {
                                        map.set(item.id, { value: item.id, title: item.name, parent_id: item.parent_id, children: [] });
                                    });
                                    const tree: any[] = [];
                                    departments.forEach(item => {
                                        const node = map.get(item.id);
                                        if (item.parent_id) {
                                            const parent = map.get(item.parent_id);
                                            if (parent) {
                                                parent.children.push(node);
                                            } else {
                                                tree.push(node);
                                            }
                                        } else {
                                            tree.push(node);
                                        }
                                    });
                                    const cleanTree = (nodes: any[]) => {
                                        nodes.forEach(node => {
                                            if (node.children.length === 0) {
                                                delete node.children;
                                            } else {
                                                cleanTree(node.children);
                                            }
                                        });
                                    };
                                    cleanTree(tree);
                                    return tree;
                                })()}
                            />
                        )}                        {renderField("Vị trí", "position_id", <IdcardOutlined />, initialValues?.position || (positions.find(p => p.id === initialValues?.position_id)?.name),
                            <Select
                                showSearch
                                optionFilterProp="label"
                                placeholder="Chọn vị trí"
                                options={positions?.map(p => ({ value: p.id, label: p.name })) || []}
                            />
                        )}

                        {renderField("Ngày vào làm", "join_date", <CalendarOutlined />, initialValues?.join_date ? dayjs(initialValues.join_date).format('DD/MM/YYYY') : null,
                            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder="Chọn ngày" />
                        )}
                    </Col>
                </Row>
            </Form>
        </Modal>
    );
}
