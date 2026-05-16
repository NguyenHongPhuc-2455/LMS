import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Card, Typography, Tag } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import styles from '../UserManagement/UserManagement.module.scss'; // Reusing styles for consistency

const { Title, Text } = Typography;

interface Department {
    id: number;
    name: string;
    description: string | null;
    _count?: {
        users: number;
    };
}

const DepartmentManagement: React.FC = () => {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [search, setSearch] = useState('');
    const [form] = Form.useForm();

    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await api.get('/departments');
            setDepartments(response.data);
        } catch (error: any) {
            message.error('Không thể tải danh sách phòng ban');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, []);

    const filteredDepartments = useMemo(() => {
        return departments.filter(d =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
        );
    }, [departments, search]);

    const handleAdd = () => {
        setEditingDept(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (record: Department) => {
        setEditingDept(record);
        form.setFieldsValue(record);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa phòng ban?',
            content: 'Bạn chỉ có thể xóa phòng ban khi không còn nhân viên nào thuộc phòng này.',
            okText: 'Xóa ngay',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await api.delete(`/departments/${id}`);
                    message.success('Xóa phòng ban thành công');
                    fetchDepartments();
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Lỗi khi xóa phòng ban');
                }
            },
        });
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingDept) {
                await api.put(`/departments/${editingDept.id}`, values);
                message.success('Cập nhật phòng ban thành công');
            } else {
                await api.post('/departments', values);
                message.success('Thêm phòng ban mới thành công');
            }
            setIsModalOpen(false);
            fetchDepartments();
        } catch (error: any) {
            if (error.name !== 'ValidationError') {
                message.error('Lỗi lưu dữ liệu');
            }
        }
    };

    const columns = [
        {
            title: 'Mã phòng',
            dataIndex: 'id',
            key: 'id',
            render: (id: number) => <Text strong style={{ color: '#000', whiteSpace: 'nowrap' }}>DEPT-{id}</Text>
        },
        {
            title: 'Tên phòng ban',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => (
                <span style={{ fontWeight: 600, fontSize: '15px', color: '#000', whiteSpace: 'nowrap' }}>{text}</span>
            ),
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text || <Text type="secondary">Chưa có mô tả</Text>}</span>
        },
        {
            title: 'Nhân sự',
            key: 'userCount',
            render: (record: Department) => (
                <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {record._count?.users || 0} nhân viên
                </span>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            render: (_: any, record: Department) => (
                <Space size="middle" style={{ whiteSpace: 'nowrap' }}>
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        className={styles.actionBtn}
                        style={{ color: '#1890ff' }}
                    />
                    <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDelete(record.id)}
                        className={styles.actionBtn}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div className={styles.userManagementContainer}>
            <div className={styles.userManagementHeader}>
                <div className={styles.headerInfo}>
                    <Title level={4} className={styles.headerTitle}>Quản lý phòng ban</Title>
                    <Text type="secondary">Quản lý sơ đồ tổ chức, cơ cấu phòng ban và phân bổ nhân sự</Text>
                </div>
            </div>

            <Card className="glass-card">
                <div className={styles.searchBarWrapper}>
                    <div className={styles.headerLeft}>
                        <Input
                            placeholder="Tìm kiếm tên phòng ban hoặc mô tả..."
                            prefix={<SearchOutlined className={styles.searchIcon} />}
                            onChange={(e) => setSearch(e.target.value)}
                            value={search}
                            className={styles.searchBar}
                            style={{ width: 350 }}
                            allowClear
                        />
                        <span style={{ marginLeft: 12, color: '#666', fontSize: '14px' }}>
                            Tổng cộng {departments.length} phòng ban
                        </span>
                    </div>

                    <Space className={styles.searchBarContainer}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            className={styles.adminAddButton}
                        >
                            Thêm phòng ban
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredDepartments}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        itemRender: (current: number, type: string, originalElement: any) => {
                            if (type === 'page') {
                                return <a>{current < 10 ? `0${current}` : current}</a>;
                            }
                            return originalElement;
                        }
                    }}
                    rowClassName={() => 'premium-row'}
                    bordered
                />
            </Card>

            <Modal
                title={editingDept ? 'Cập nhật phòng ban' : 'Tạo phòng ban mới'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={[
                    <div key="footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <Button
                            key="cancel"
                            onClick={() => setIsModalOpen(false)}
                            style={{ minWidth: 100, height: 40, borderRadius: '8px' }}
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            key="submit"
                            type="primary"
                            onClick={handleModalOk}
                            style={{ minWidth: 100, height: 40, borderRadius: '8px', background: '#B8121A', borderColor: '#B8121A' }}
                        >
                            {editingDept ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                ]}
                destroyOnClose
                width={500}
                style={{ top: 60 }}
            >
                <Form form={form} layout="vertical" style={{ marginTop: '20px' }}>
                    <Form.Item
                        name="name"
                        label="Tên phòng ban"
                        rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}
                    >
                        <Input placeholder="Ví dụ: Phòng Marketing, IT, Nhân sự..." size="large" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả chi tiết"
                    >
                        <Input.TextArea rows={4} placeholder="Nhập chức năng, nhiệm vụ của phòng ban..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default DepartmentManagement;
