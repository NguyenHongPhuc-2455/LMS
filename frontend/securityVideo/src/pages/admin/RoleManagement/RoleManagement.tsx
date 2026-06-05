import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, App, Space, Card, Typography, Tag, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, IdcardOutlined, SearchOutlined, LockOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import styles from '../../../styles/admin-shared.module.scss';

const { Title, Text } = Typography;

interface Role {
    id: number;
    name: string;
    description: string | null;
    _count?: {
        users: number;
    };
}

const RoleManagement: React.FC = () => {
    const { message, modal } = App.useApp();
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [search, setSearch] = useState('');
    const [form] = Form.useForm();

    // Kiểm tra quyền Admin
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const isSuperAdmin = user?.roles?.some((r: any) => {
        const name = typeof r === 'string' ? r : r.name;
        return name?.toLowerCase() === 'admin';
    });

    const fetchRoles = async () => {
        setLoading(true);
        try {
            const response = await api.get('roles');
            setRoles(response.data);
        } catch (error: any) {
            console.error('Lỗi API Roles:', error.response?.data || error.message);
            message.error('Không thể tải danh sách vai trò');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, []);

    const filteredRoles = useMemo(() => {
        return roles.filter(r =>
            r.name.toLowerCase().includes(search.toLowerCase()) ||
            (r.description && r.description.toLowerCase().includes(search.toLowerCase()))
        );
    }, [roles, search]);

    const handleAdd = () => {
        if (!isSuperAdmin) return;
        setEditingRole(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (record: Role) => {
        if (!isSuperAdmin) return;
        setEditingRole(record);
        form.setFieldsValue(record);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        if (!isSuperAdmin) return;
        modal.confirm({
            title: 'Xác nhận xóa vai trò?',
            content: 'Việc xóa vai trò có thể ảnh hưởng đến quyền truy cập của những người dùng đang giữ vai trò này.',
            okText: 'Xóa ngay',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await api.delete(`/roles/${id}`);
                    message.success('Xóa vai trò thành công');
                    fetchRoles();
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Lỗi khi xóa vai trò');
                }
            },
        });
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingRole) {
                await api.put(`/roles/${editingRole.id}`, values);
                message.success('Cập nhật vai trò thành công');
            } else {
                await api.post('/roles', values);
                message.success('Thêm vai trò mới thành công');
            }
            setIsModalOpen(false);
            fetchRoles();
        } catch (error: any) {
            if (error.name !== 'ValidationError') {
                message.error('Lỗi lưu dữ liệu');
            }
        }
    };

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            render: (id: number) => <Text type="secondary" style={{ whiteSpace: 'nowrap' }}>#{id}</Text>
        },
        {
            title: 'Tên vai trò',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <span style={{ fontWeight: 600, color: '#111827', whiteSpace: 'nowrap' }}>{text.toUpperCase()}</span>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text || <Text type="secondary" italic>Chưa có mô tả</Text>}</span>
        },
        {
            title: 'Số nhân sự',
            key: 'userCount',
            render: (record: Role) => (
                <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {record._count?.users || 0} 
                </span>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            render: (_: any, record: Role) => (
                <Space size="middle" style={{ whiteSpace: 'nowrap' }}>
                    {isSuperAdmin ? (
                        <>
                            <Tooltip title="Chỉnh sửa">
                                <Button
                                    type="text"
                                    icon={<EditOutlined />}
                                    onClick={() => handleEdit(record)}
                                    style={{ color: '#1890ff' }}
                                />
                            </Tooltip>
                            <Tooltip title="Xóa">
                                <Button
                                    type="text"
                                    icon={<DeleteOutlined />}
                                    danger
                                    onClick={() => handleDelete(record.id)}
                                />
                            </Tooltip>
                        </>
                    ) : (
                        <Tooltip title="Chỉ Admin mới có quyền thao tác">
                            <LockOutlined style={{ color: '#bfbfbf' }} />
                        </Tooltip>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.userManagementContainer}>
            {/* <div className={styles.userManagementHeader}>
                <div className={styles.headerInfo}>
                    <Title level={4} className={styles.headerTitle}>Quản lý vai trò (Roles)</Title>
                    <Text type="secondary">Định nghĩa các nhóm quyền và vai trò trong hệ thống eLearning</Text>
                </div>
            </div> */}

            <Card className="glass-card">
                <div className={styles.searchBarWrapper}>
                    <div className={styles.headerLeft}>
                        <Input
                            placeholder="Tìm kiếm tên vai trò..."
                            prefix={<SearchOutlined className={styles.searchIcon} />}
                            onChange={(e) => setSearch(e.target.value)}
                            value={search}
                            className={styles.searchBar}
                            style={{ width: 350 }}
                            allowClear
                        />
                    </div>

                    {isSuperAdmin && (
                        <Space>
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleAdd}
                                className={styles.adminAddButton}

                            >
                                Thêm
                            </Button>
                        </Space>
                    )}
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredRoles}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    rowClassName={() => 'premium-row'}
                    bordered
                />
            </Card>

            <Modal
                title={editingRole ? 'Cập nhật vai trò' : 'Tạo vai trò mới'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={[
                    <Button
                        key="cancel"
                        onClick={() => setIsModalOpen(false)}
                        className="modal-action-btn"
                    >
                        Hủy bỏ
                    </Button>,
                    <Button
                        key="submit"
                        type="primary"
                        onClick={handleModalOk}
                        style={{ minWidth: 100, height: 32, borderRadius: 5, background: '#B8121A' }}
                    >
                        {editingRole ? 'Cập nhật' : 'Thêm mới'}
                    </Button>
                ]}
                destroyOnClose
            >
                <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
                    <Form.Item
                        name="name"
                        label="Tên vai trò"
                        rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}
                    >
                        <Input placeholder="VÍ DỤ: ADMIN, MANAGER, LECTURER..." />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả"
                    >
                        <Input.TextArea rows={4} placeholder="Mô tả quyền hạn của vai trò này..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default RoleManagement;
