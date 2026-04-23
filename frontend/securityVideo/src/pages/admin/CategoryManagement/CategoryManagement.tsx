import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, Modal, message, Input } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { categoryService, type Category } from '@/services/category.service';
import CategoryFormModal from './components/CategoryFormModal';

const { Title } = Typography;

const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [searchText, setSearchText] = useState('');

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await categoryService.getAllCategories();
            setCategories(data);
        } catch (error) {
            message.error('Không thể tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleDelete = (category: Category) => {
        Modal.confirm({
            title: 'Xác nhận xóa',
            content: `Bạn có chắc chắn muốn xóa danh mục "${category.name}"?`,
            okText: 'Xóa',
            okType: 'danger',
            cancelText: 'Hủy',
            onOk: async () => {
                try {
                    await categoryService.deleteCategory(category.id);
                    message.success('Đã xóa danh mục');
                    fetchCategories();
                } catch (error: any) {
                    message.error(error.response?.data?.error || 'Lỗi khi xóa danh mục');
                }
            },
        });
    };

    const handleEdit = (category: Category) => {
        setEditingCategory(category);
        setIsModalVisible(true);
    };

    const handleAdd = () => {
        setEditingCategory(null);
        setIsModalVisible(true);
    };

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
        },
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <strong>{text}</strong>,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
        },
        {
            title: 'Số khóa học',
            key: 'courseCount',
            width: 150,
            align: 'center' as const,
            render: (_: any, record: Category) => record._count?.courses || 0,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 150,
            align: 'right' as const,
            render: (_: any, record: Category) => (
                <Space size="small">
                    <Button
                        type="text"
                        icon={<EditOutlined />}
                        onClick={() => handleEdit(record)}
                        style={{ color: '#4880FF' }}
                    />
                    <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        danger
                        onClick={() => handleDelete(record)}
                    />
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '10px' }}>
            <div style={{ marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0, marginBottom: 0 }}>Quản lý danh mục</Title>
                <Typography.Text type="secondary">Phân loại khóa học trên hệ thống</Typography.Text>
            </div>

            <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Input
                        placeholder="Tìm danh mục..."
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 250, borderRadius: '8px' }}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAdd}
                        style={{
                            borderRadius: '8px',
                            background: '#C72127',
                            borderColor: '#C72127',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        Thêm danh mục
                    </Button>
                </div>

                <Table
                    columns={columns}
                    dataSource={filteredCategories}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        showTotal: (total) => `Tổng số ${total} danh mục`,
                    }}
                    style={{ borderRadius: '8px', overflow: 'hidden' }}
                />
            </Card>

            <CategoryFormModal
                visible={isModalVisible}
                category={editingCategory}
                onCancel={() => setIsModalVisible(false)}
                onSuccess={() => {
                    setIsModalVisible(false);
                    fetchCategories();
                }}
            />
        </div>
    );
};

export default CategoryManagement;
