import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Card, Typography, Modal, message, Input, Tooltip, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import { categoryService, type Category } from '@/services/category.service';
import CategoryFormModal from './components/CategoryFormModal';

const { Title } = Typography;

const CategoryManagement: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [searchText, setSearchText] = useState('');
    const [filterType, setFilterType] = useState<'ALL' | 'HAS_COURSES' | 'EMPTY'>('ALL');

    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const data = await categoryService.getAllCategories(page, pageSize, searchText, filterType);
            if (data && data.data) {
                setCategories(data.data);
                setTotal(data.total);
            } else {
                setCategories(data as any);
                setTotal((data as any)?.length || 0);
            }
        } catch (error) {
            message.error('Không thể tải danh sách danh mục');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, [page, pageSize, filterType]);

    // Use a separate effect for search text with debounce, or just let user press enter/button.
    // We already have a Reload button. Let's trigger fetch when filterType changes, 
    // but for search text we can rely on the reload button or add an onSearch.
    // For simplicity, we trigger fetch when search text changes (maybe debounced if needed, but it's okay for now)
    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchCategories();
        }, 500);
        return () => clearTimeout(timer);
    }, [searchText]);

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

    // Remove local filteredCategories since backend handles it
    const filteredCategories = categories;

    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 80,
            render: (text: any) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
        },
        {
            title: 'Tên danh mục',
            dataIndex: 'name',
            key: 'name',
            render: (text: string) => <strong style={{ whiteSpace: 'nowrap' }}>{text}</strong>,
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text || '-'}</span>
        },
        {
            title: 'Số khóa học',
            key: 'courseCount',
            align: 'center' as const,
            render: (_: any, record: Category) => <span style={{ whiteSpace: 'nowrap' }}>{record._count?.courses || 0}</span>,
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 120,
            align: 'right' as const,
            render: (_: any, record: Category) => (
                <Space size="small" style={{ whiteSpace: 'nowrap' }}>
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
        <div>
            {/* <div style={{ marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0, marginBottom: 0 }}>Quản lý danh mục</Title>
                <Typography.Text type="secondary">Phân loại khóa học trên hệ thống</Typography.Text>
            </div> */}

            <Card bordered={false} style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Space size={8}>
                        <Input
                            placeholder="Tìm danh mục..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            style={{ width: 220, borderRadius: '8px' }}
                        />
                        <Select
                            value={filterType}
                            onChange={setFilterType}
                            style={{ width: 180 }}
                        >
                            <Select.Option value="ALL">Tất cả danh mục</Select.Option>
                            <Select.Option value="HAS_COURSES">Đã có khóa học</Select.Option>
                            <Select.Option value="EMPTY">Chưa có khóa học</Select.Option>
                        </Select>
                        <Tooltip title="Làm mới dữ liệu">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchCategories}
                                loading={loading}
                            />
                        </Tooltip>
                    </Space>
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
                        current: page,
                        pageSize: pageSize,
                        total: total,
                        onChange: (p, ps) => { setPage(p); setPageSize(ps); },
                        showTotal: (total) => `Tổng số ${total} danh mục`,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100']
                    }}
                    style={{ borderRadius: '8px', overflow: 'hidden' }}
                />
            </Card>

            {isModalVisible && (
                <CategoryFormModal
                    visible={isModalVisible}
                    category={editingCategory}
                    onCancel={() => setIsModalVisible(false)}
                    onSuccess={() => {
                        setIsModalVisible(false);
                        fetchCategories();
                    }}
                />
            )}
        </div>
    );
};

export default CategoryManagement;
