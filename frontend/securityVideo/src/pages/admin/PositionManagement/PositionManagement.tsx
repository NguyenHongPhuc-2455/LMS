import React, { useState, useEffect, useMemo } from 'react';
import { Table, Button, Modal, Form, Input, message, Space, Card, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { positionService } from '../../../services/position.service';
import styles from '../UserManagement/UserManagement.module.scss'; // Reusing styles for consistency

const { Title, Text } = Typography;

interface Position {
    id: number;
    name: string;
    description: string | null;
    _count?: {
        users: number;
    };
}

const PositionManagement: React.FC = () => {
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPos, setEditingPos] = useState<Position | null>(null);
    const [search, setSearch] = useState('');
    const [form] = Form.useForm();

    const fetchPositions = async () => {
        setLoading(true);
        try {
            const data = await positionService.getAll();
            setPositions(data);
        } catch (error: any) {
            message.error('Không thể tải danh sách vị trí');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPositions();
    }, []);

    const filteredPositions = useMemo(() => {
        return positions.filter(p =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
        );
    }, [positions, search]);

    const handleAdd = () => {
        setEditingPos(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (record: Position) => {
        setEditingPos(record);
        form.setFieldsValue(record);
        setIsModalOpen(true);
    };

    const handleDelete = (id: number) => {
        Modal.confirm({
            title: 'Xác nhận xóa vị trí?',
            content: 'Bạn chỉ có thể xóa vị trí khi không còn nhân viên nào thuộc vị trí này.',
            okText: 'Xóa ngay',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await positionService.delete(id);
                    message.success('Xóa vị trí thành công');
                    fetchPositions();
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Lỗi khi xóa vị trí');
                }
            },
        });
    };

    const handleModalOk = async () => {
        try {
            const values = await form.validateFields();
            if (editingPos) {
                await positionService.update(editingPos.id, values);
                message.success('Cập nhật vị trí thành công');
            } else {
                await positionService.create(values);
                message.success('Thêm vị trí mới thành công');
            }
            setIsModalOpen(false);
            fetchPositions();
        } catch (error: any) {
            if (error.name !== 'ValidationError') {
                message.error('Lỗi lưu dữ liệu');
            }
        }
    };

    const columns = [
        {
            title: 'Mã vị trí',
            dataIndex: 'id',
            key: 'id',
            render: (id: number) => <Text strong style={{ color: '#000', whiteSpace: 'nowrap' }}>POS-{id}</Text>
        },
        {
            title: 'Tên vị trí',
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
            render: (record: Position) => (
                <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {record._count?.users || 0} nhân viên
                </span>
            ),
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            render: (_: any, record: Position) => (
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
                    <Title level={4} className={styles.headerTitle}>Quản lý vị trí chức vụ</Title>
                    <Text type="secondary">Quản lý danh mục các vị trí công việc và chức vụ trong hệ thống</Text>
                </div>
            </div> */}

            <Card className="glass-card">
                <div className={styles.searchBarWrapper}>
                    <div className={styles.headerLeft}>
                        <Input
                            placeholder="Tìm kiếm tên vị trí hoặc mô tả..."
                            prefix={<SearchOutlined className={styles.searchIcon} />}
                            onChange={(e) => setSearch(e.target.value)}
                            value={search}
                            className={styles.searchBar}
                            style={{ width: 350 }}
                            allowClear
                        />
                        <span style={{ marginLeft: 12, color: '#666', fontSize: '14px' }}>
                            Tổng cộng {positions.length} vị trí
                        </span>
                    </div>

                    <Space className={styles.searchBarContainer}>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={handleAdd}
                            className={styles.adminAddButton}
                        >
                            Thêm vị trí
                        </Button>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredPositions}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
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
                title={editingPos ? 'Cập nhật vị trí' : 'Tạo vị trí mới'}
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
                            {editingPos ? 'Cập nhật' : 'Thêm mới'}
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
                        label="Tên vị trí/chức vụ"
                        rules={[{ required: true, message: 'Vui lòng nhập tên vị trí' }]}
                    >
                        <Input placeholder="Ví dụ: Giám đốc Marketing, Chuyên viên IT..." size="large" />
                    </Form.Item>
                    <Form.Item
                        name="description"
                        label="Mô tả chi tiết"
                    >
                        <Input.TextArea rows={4} placeholder="Nhập mô tả về trách nhiệm của vị trí này..." />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default PositionManagement;
