import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Card, Typography, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../../services/api';
import styles from '../../../styles/admin-shared.module.scss';

const { Title, Text } = Typography;

interface Department {
    id: number;
    name: string;
    description: string | null;
    parent_id?: number | null;
    _count?: {
        users: number;
        children?: number;
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

    // Xây dựng cấu trúc cây phòng ban
    const departmentTree = useMemo(() => {
        const map = new Map<number, any>();
        departments.forEach(d => {
            map.set(d.id, { ...d, children: [] });
        });
        const tree: any[] = [];
        departments.forEach(d => {
            const node = map.get(d.id);
            if (d.parent_id) {
                const parent = map.get(d.parent_id);
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
    }, [departments]);

    // Dữ liệu hiển thị trong Table (Cây nếu không tìm kiếm, phẳng nếu có tìm kiếm)
    const displayedDepartments = useMemo(() => {
        if (!search) return departmentTree;
        return departments.filter(d =>
            d.name.toLowerCase().includes(search.toLowerCase()) ||
            (d.description && d.description.toLowerCase().includes(search.toLowerCase()))
        );
    }, [departments, departmentTree, search]);

    // Danh sách phòng ban cha hợp lệ cho ô chọn Parent
    const parentOptions = useMemo(() => {
        const level1Ids = new Set(departments.filter(d => !d.parent_id).map(d => d.id));

        const excludedIds = new Set<number>();
        if (editingDept) {
            excludedIds.add(editingDept.id);
            // Loại trừ con cháu để chống vòng lặp
            const children = departments.filter(d => d.parent_id === editingDept.id);
            children.forEach(c => {
                excludedIds.add(c.id);
                departments.filter(d => d.parent_id === c.id).forEach(gc => excludedIds.add(gc.id));
            });
        }

        return departments
            .filter(d => !excludedIds.has(d.id) && (!d.parent_id || level1Ids.has(d.parent_id)))
            .map(d => {
                const level = !d.parent_id ? 'Cấp 1' : 'Cấp 2';
                return {
                    value: d.id,
                    label: `${d.name} (${level})`
                };
            });
    }, [departments, editingDept]);

    const handleAdd = () => {
        setEditingDept(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (record: Department) => {
        setEditingDept(record);
        form.setFieldsValue({
            name: record.name,
            description: record.description,
            parent_id: record.parent_id || undefined
        });
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa phòng ban?',
            content: 'Bạn chỉ có thể xóa phòng ban khi không còn bất kỳ phòng ban con nào và không còn nhân viên trực thuộc.',
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
            const payload = {
                ...values,
                parent_id: values.parent_id || null
            };

            if (editingDept) {
                await api.put(`/departments/${editingDept.id}`, payload);
                message.success('Cập nhật phòng ban thành công');
            } else {
                await api.post('/departments', payload);
                message.success('Thêm phòng ban mới thành công');
            }
            setIsModalOpen(false);
            fetchDepartments();
        } catch (error: any) {
            if (error.name !== 'ValidationError') {
                message.error(error.response?.data?.message || 'Lỗi lưu dữ liệu');
            }
        }
    };

    const columns = [
        {
            title: 'Mã phòng',
            dataIndex: 'id',
            key: 'id',
            width: 150,
            render: (id: number) => <Text strong style={{ color: '#000', whiteSpace: 'nowrap' }}>DEPT-{id}</Text>
        },
        {
            title: 'Tên phòng ban / Tổ nhóm',
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
            width: 180,
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
            {/* <div className={styles.userManagementHeader}>
                <div className={styles.headerInfo}>
                    <Title level={4} className={styles.headerTitle}>Quản lý phòng ban</Title>
                    <Text type="secondary">Quản lý sơ đồ tổ chức 3 cấp (Khối - Phòng ban - Tổ nhóm) và phân bổ nhân sự</Text>
                </div>
            </div> */}

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
                            Tổng cộng {departments.length} phòng ban/tổ nhóm
                        </span>
                    </div>

                    <Space className={styles.searchBarContainer}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            className={styles.adminAddButton}
                        >
                            Thêm
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={displayedDepartments}
                    rowKey="id"
                    loading={loading}
                    defaultExpandAllRows={true}
                    pagination={{
                        pageSize: 15,
                        itemRender: (current: number, type: string, originalElement: any) => {
                            if (type === 'page') {
                                return React.cloneElement(originalElement, {
                                    children: current < 10 ? `0${current}` : current
                                });
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
                            className="modal-action-btn"
                        >
                            Hủy bỏ
                        </Button>
                        <Button
                            key="submit"
                            type="primary"
                            onClick={handleModalOk}
                            className="btn-brand-primary modal-action-btn"
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
                        label="Tên phòng ban / Tổ nhóm"
                        rules={[{ required: true, message: 'Vui lòng nhập tên phòng ban' }]}
                    >
                        <Input placeholder="Ví dụ: Khối R&D, IT, Nhóm ERP..." size="large" />
                    </Form.Item>

                    <Form.Item
                        name="parent_id"
                        label="Thuộc phòng ban cấp trên"
                    >
                        <Select
                            placeholder="Chọn phòng ban cha (để trống nếu là Khối Cấp 1)"
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            options={parentOptions}
                            size="large"
                        />
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
