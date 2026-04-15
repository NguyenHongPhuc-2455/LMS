import { useEffect, useState, useRef } from 'react';
import dayjs from 'dayjs';
import {
    Table, Button, Space, Input, Tag,
    message, Typography, Card, Badge, Modal, Form,
    Select, Row, Col, Statistic, Avatar, Popover, List, Skeleton, DatePicker
} from 'antd';
import {
    SearchOutlined, DeleteOutlined, UserOutlined,
    BookOutlined, SaveOutlined, CloseOutlined,
    PlusOutlined, TeamOutlined,
    CrownOutlined, UsergroupAddOutlined, IdcardOutlined
} from '@ant-design/icons';
import type { InputRef, TableColumnsType, TableColumnType } from 'antd';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import api from '../../api';

const { Title, Text } = Typography;
const { Option } = Select;

interface RoleData {
    id: number;
    name: string;
    description: string;
}

interface UserData {
    id: number;
    username: string;
    email: string;
    full_name: string;
    avatar?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    bio?: string;
    roles: RoleData[];
    created_at: string;
    updated_at: string;
    enrollments_count: number;
    enrolled_courses: string[];
}

type DataIndex = keyof UserData;

export default function UserManagement() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [loading, setLoading] = useState(false);

    // Batch & Edit State
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [editingKey, setEditingKey] = useState<number | null>(null);
    const [editingField, setEditingField] = useState<string | null>(null);
    const [editData, setEditData] = useState<any>({});
    const [isDeleteMode, setIsDeleteMode] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm] = Form.useForm();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef<InputRef>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                api.get('/users'),
                api.get('/users/roles')
            ]);
            setUsers(usersRes.data);
            setRoles(rolesRes.data);
        } catch (error: any) {
            message.error('Lỗi khi tải dữ liệu hệ thống');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBatchSave = async () => {
        setLoading(true);
        try {
            // 1. Handle Deletions if any
            if (selectedRowKeys.length > 0) {
                // Confirm before batch delete
                Modal.confirm({
                    title: `Xác nhận xóa ${selectedRowKeys.length} thành viên?`,
                    content: 'Hành động này không thể hoàn tác.',
                    onOk: async () => {
                        try {
                            for (const id of selectedRowKeys) {
                                await api.delete(`/users/${id}`);
                            }
                            message.success(`Đã xóa thành công`);
                            setSelectedRowKeys([]);
                            setIsDeleteMode(false);
                            await fetchData();
                        } catch (e: any) {
                            message.error('Lỗi khi xóa một số thành viên');
                        }
                    }
                });
            }

            // 2. Handle Inline Edits if any
            if (editingKey && Object.keys(editData).length > 0) {
                await api.put(`/users/${editingKey}`, editData);
                message.success('Đã cập nhật thay đổi thành công');
                setEditingKey(null);
                setEditData({});
                await fetchData();
            }

            if (selectedRowKeys.length === 0) {
                // Only stop loading here if no deletion modal was shown
                setLoading(false);
            }
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi lưu thay đổi');
            setLoading(false);
        }
    };

    const handleCreateFinish = async (values: any) => {
        try {
            await api.post('/users', values);
            message.success('Tạo người dùng mới thành công');
            setIsCreateModalOpen(false);
            createForm.resetFields();
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi lưu dữ liệu');
        }
    };

    const handleSearch = (selectedKeys: string[], confirm: (param?: FilterConfirmProps) => void, dataIndex: DataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<UserData> => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    ref={searchInput}
                    placeholder={`Tìm ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button type="primary" onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)} icon={<SearchOutlined />} size="small" style={{ width: 90 }}>Tìm</Button>
                    <Button onClick={() => { if (clearFilters) clearFilters(); setSelectedKeys?.([]); confirm(); }} size="small" style={{ width: 90 }}>Xóa</Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value, record) => record[dataIndex] ? record[dataIndex]!.toString().toLowerCase().includes((value as string).toLowerCase()) : false,
        render: (text) => searchedColumn === dataIndex ? (
            <Highlighter highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }} searchWords={[searchText]} autoEscape textToHighlight={text ? text.toString() : ''} />
        ) : (text),
    });

    const startEditing = (record: UserData, field: string) => {
        if (isDeleteMode) return;
        setEditingKey(record.id);
        setEditingField(field);
        const { roles, ...rest } = record;
        setEditData({ ...rest, role_id: roles[0]?.id });
    };

    const renderEditableCell = (record: UserData, field: keyof UserData, currentText: any) => {
        const isEditing = editingKey === record.id;

        if (isEditing) {
            if (field === 'roles') {
                return (
                    <Select
                        defaultValue={record.roles[0]?.id}
                        style={{ width: '100%' }}
                        size="small"
                        onChange={(val) => setEditData({ ...editData, role_id: val })}
                    >
                        {roles.map(r => <Option key={r.id} value={r.id}>{r.name.toUpperCase()}</Option>)}
                    </Select>
                );
            }
            if (field === 'gender') {
                return (
                    <Select
                        defaultValue={currentText}
                        style={{ width: '100%' }}
                        size="small"
                        onChange={(val) => setEditData({ ...editData, gender: val })}
                    >
                        <Option value="Nam">Nam</Option>
                        <Option value="Nữ">Nữ</Option>
                        <Option value="Khác">Khác</Option>
                    </Select>
                );
            }
            if (field === 'dob') {
                return (
                    <DatePicker
                        defaultValue={currentText ? dayjs(currentText) : undefined}
                        style={{ width: '100%' }}
                        size="small"
                        format="DD/MM/YYYY"
                        onChange={(date) => setEditData({ ...editData, dob: date ? date.toISOString() : null })}
                        autoFocus
                    />
                );
            }
            return (
                <Input
                    defaultValue={currentText}
                    size="small"
                    onChange={(e) => setEditData({ ...editData, [field]: e.target.value })}
                    autoFocus={editingField === field}
                />
            );
        }

        return (
            <div
                onClick={() => startEditing(record, field as string)}
                style={{ cursor: 'pointer', minHeight: '32px', width: '100%', display: 'flex', alignItems: 'center' }}
                className="editable-cell-value"
            >
                {field === 'roles' ? (
                    <Space wrap>
                        {record.roles.map(role => (
                            <Tag key={role.id} color={role.name === 'admin' ? 'gold' : (role.name === 'instructor' ? 'purple' : 'blue')} icon={role.name === 'admin' ? <CrownOutlined /> : <IdcardOutlined />}>
                                {role.name.toUpperCase()}
                            </Tag>
                        ))}
                    </Space>
                ) : field === 'dob' ? (
                    currentText ? new Date(currentText).toLocaleDateString() : <Text type="secondary">-</Text>
                ) : field === 'updated_at' || field === 'created_at' ? (
                    new Date(currentText).toLocaleString()
                ) : (
                    currentText || <Text type="secondary">-</Text>
                )}
            </div>
        );
    };

    const columns: TableColumnsType<UserData> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 70,
            sorter: (a, b) => a.id - b.id,
            fixed: 'left',
        },
        {
            title: 'Người dùng',
            key: 'user_info',
            width: 250,
            fixed: 'left',
            ...getColumnSearchProps('username'),
            render: (_, record) => (
                <Space onClick={() => startEditing(record, 'full_name')}>
                    <Avatar
                        src={record.avatar}
                        icon={!record.avatar && <UserOutlined />}
                        style={{ background: 'var(--primary-hover)' }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer', minWidth: '150px' }}>
                        {editingKey === record.id ? (
                            <Input
                                defaultValue={record.full_name}
                                size="small"
                                onChange={e => setEditData({ ...editData, full_name: e.target.value })}
                                autoFocus={editingField === 'full_name'}
                            />
                        ) : (
                            <Text strong style={{ color: 'var(--text-main)' }}>{record.full_name || record.username}</Text>
                        )}
                        <Text type="secondary" style={{ fontSize: '12px' }}>@{record.username}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Vai trò',
            key: 'roles',
            width: 150,
            render: (_, record) => renderEditableCell(record, 'roles', record.roles)
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 200,
            ...getColumnSearchProps('email'),
            render: (text, record) => renderEditableCell(record, 'email', text)
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            width: 150,
            render: (text, record) => renderEditableCell(record, 'phone', text)
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'dob',
            key: 'dob',
            width: 150,
            render: (text, record) => renderEditableCell(record, 'dob', text)
        },
        {
            title: 'Giới tính',
            dataIndex: 'gender',
            key: 'gender',
            width: 120,
            render: (text, record) => renderEditableCell(record, 'gender', text)
        },
        {
            title: 'Tiểu sử',
            dataIndex: 'bio',
            key: 'bio',
            width: 250,
            ellipsis: true,
            render: (text, record) => renderEditableCell(record, 'bio', text)
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 180,
            sorter: (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
            render: (text) => new Date(text).toLocaleString()
        },
        {
            title: 'Sở hữu',
            dataIndex: 'enrollments_count',
            key: 'enrollments',
            width: 100,
            sorter: (a, b) => a.enrollments_count - b.enrollments_count,
            render: (count, record) => (
                <Popover
                    title="Danh sách khóa học"
                    content={
                        record.enrolled_courses.length > 0 ? (
                            <List
                                size="small"
                                dataSource={record.enrolled_courses}
                                renderItem={(item) => <List.Item><Text style={{ fontSize: '12px' }}>- {item}</Text></List.Item>}
                                style={{ maxWidth: 250 }}
                            />
                        ) : "Chưa mua khóa học nào"
                    }
                    trigger="hover"
                >
                    <Badge count={count} showZero color={count > 0 ? '#52c41a' : '#d9d9d9'} style={{ cursor: 'pointer' }} />
                </Popover>
            )
        },
        {
            title: 'Cập nhật cuối',
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 180,
            render: (text) => new Date(text).toLocaleString()
        }
    ];

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = isDeleteMode ? {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: 50,
    } : undefined;

    return (
        <div style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Quản lý người dùng</Title>
                    <Text type="secondary">Quản lý người dùng, giảng viên và phân quyền toàn hệ thống</Text>
                </div>
                <Space>
                    {/* Top actions moved to card header */}
                </Space>
            </div>

            <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
                {[1, 2, 3, 4].map(i => (
                    <Col key={i} xs={24} sm={12} md={6}>
                        <Card className="glass-card" style={{ padding: '12px' }}>
                            {loading && users.length === 0 ? (
                                <Skeleton active avatar title={false} paragraph={{ rows: 1 }} />
                            ) : (
                                i === 1 ? <Statistic title={<Text type="secondary" style={{ fontSize: '12px' }}>Học viên</Text>} value={users.length} valueStyle={{ fontSize: '20px' }} prefix={<TeamOutlined style={{ color: '#3b82f6', fontSize: '16px' }} />} /> :
                                    i === 2 ? <Statistic title={<Text type="secondary" style={{ fontSize: '12px' }}>Giảng viên</Text>} value={users.filter(u => u.roles.some(r => r.name === 'instructor')).length} valueStyle={{ fontSize: '20px' }} prefix={<IdcardOutlined style={{ color: '#a855f7', fontSize: '16px' }} />} /> :
                                        i === 3 ? <Statistic title={<Text type="secondary" style={{ fontSize: '12px' }}>Quản trị viên</Text>} value={users.filter(u => u.roles.some(r => r.name === 'admin')).length} valueStyle={{ fontSize: '20px' }} prefix={<CrownOutlined style={{ color: '#f59e0b', fontSize: '16px' }} />} /> :
                                            <Statistic title={<Text type="secondary" style={{ fontSize: '12px' }}>Khóa học bán</Text>} value={users.reduce((a, b) => a + b.enrollments_count, 0)} valueStyle={{ fontSize: '20px' }} prefix={<BookOutlined style={{ color: '#10b981', fontSize: '16px' }} />} />
                            )}
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card className="glass-card" style={{ padding: 0 }}>
                <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Title level={4} style={{ margin: 0, color: 'var(--text-main)' }}>
                            <UsergroupAddOutlined /> Danh sách thành viên
                        </Title>
                        {isDeleteMode && (
                            <Tag color="error" style={{ borderRadius: '12px', padding: '0 12px' }}>
                                Đang chọn {selectedRowKeys.length} người dùng
                            </Tag>
                        )}
                    </div>

                    <Space>
                        {(editingKey || selectedRowKeys.length > 0) ? (
                            <Space>
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={handleBatchSave}
                                    loading={loading}
                                    style={{ background: '#10b981', borderColor: '#10b981' }}
                                >
                                    Lưu thay đổi
                                </Button>
                                <Button
                                    icon={<CloseOutlined />}
                                    onClick={() => {
                                        setEditingKey(null);
                                        setEditingField(null);
                                        setEditData({});
                                        setSelectedRowKeys([]);
                                        setIsDeleteMode(false);
                                    }}
                                >
                                    Hủy
                                </Button>
                            </Space>
                        ) : (
                            <Space>
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => setIsDeleteMode(!isDeleteMode)}
                                    type={isDeleteMode ? "primary" : "default"}
                                    size="middle"
                                >
                                    {isDeleteMode ? "Hủy chọn" : "Xóa (Chọn)"}
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setIsCreateModalOpen(true)}
                                    size="middle"
                                >
                                    Thêm thành viên
                                </Button>
                            </Space>
                        )}
                    </Space>
                </div>
                <div style={{ padding: '0 12px 12px 12px' }}>
                    {loading && users.length === 0 ? (
                        <div style={{ padding: '24px' }}>
                            <Skeleton active paragraph={{ rows: 8 }} />
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            dataSource={users}
                            rowKey="id"
                            loading={loading}
                            rowSelection={rowSelection}
                            pagination={{ pageSize: 10 }}
                            rowClassName={(record) => record.id === editingKey ? 'editable-row active' : 'premium-row'}
                            scroll={{ x: 1800 }}
                        />
                    )}
                </div>
            </Card>

            <Modal title="Tạo thành viên mới" open={isCreateModalOpen} onCancel={() => setIsCreateModalOpen(false)} footer={null} className="premium-modal">
                <Form form={createForm} layout="vertical" onFinish={handleCreateFinish} initialValues={{ role_id: 3 }}>
                    <Form.Item name="full_name" label="Họ và tên"><Input /></Form.Item>
                    <Form.Item name="username" label="Tên đăng nhập" rules={[{ required: true }]}><Input /></Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}><Input /></Form.Item>
                    <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, min: 6 }]}><Input.Password /></Form.Item>
                    <Form.Item name="role_id" label="Vai trò chính" rules={[{ required: true }]}>
                        <Select>{roles.map(r => (<Option key={r.id} value={r.id}>{r.name.toUpperCase()}</Option>))}</Select>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block className="btn-primary">Tạo ngay</Button>
                </Form>
            </Modal>

            <style>{`
                .editable-cell-value:hover {
                    background: rgba(24, 144, 255, 0.08);
                    border-radius: 4px;
                    transition: all 0.2s;
                }
                .editable-row.active {
                    background: rgba(99, 102, 241, 0.08) !important;
                }
                .ant-table-selection-column { width: 50px !important; }
                .ant-table { 
                    background: #ffffff !important; 
                    color: var(--text-main) !important; 
                }
                .ant-table-thead > tr > th { 
                    background: #fafafa !important; 
                    color: var(--text-muted) !important; 
                    border-bottom: 1px solid var(--border-color) !important; 
                }
                .ant-table-tbody > tr > td { 
                    background: #ffffff !important;
                    border-bottom: 1px solid var(--border-color) !important; 
                }
                .ant-table-tbody > tr:hover > td { background: #fafafa !important; }
                .ant-input { background: #fff !important; border-color: #d9d9d9 !important; color: rgba(0, 0, 0, 0.88) !important; }
                .ant-select-selector { background: #fff !important; border-color: #d9d9d9 !important; color: rgba(0, 0, 0, 0.88) !important; }
                
                /* Đảm bảo cột được ghim (fixed) hoàn toàn đặc và màu đồng nhất khi edit */
                .ant-table-cell-fix-left, 
                .ant-table-cell-fix-right,
                .editable-row.active td.ant-table-cell-fix-left,
                .editable-row.active td.ant-table-cell-fix-right {
                    background: #ffffff !important; 
                    z-index: 100 !important;
                }
                
                .ant-table-thead > tr > th.ant-table-cell-fix-left,
                .ant-table-thead > tr > th.ant-table-cell-fix-right {
                    background: #fafafa !important; /* Đồng bộ màu với header khác */
                }

                /* Khi hover hàng hoặc hàng đang active edit, cột cố định cũng phải đổi màu mờ để đồng bộ */
                .ant-table-tbody > tr.ant-table-row:hover > td.ant-table-cell-fix-left,
                .ant-table-tbody > tr.ant-table-row:hover > td.ant-table-cell-fix-right,
                .editable-row.active > td.ant-table-cell-fix-left,
                .editable-row.active > td.ant-table-cell-fix-right {
                    background: #f5f5f5 !important;
                }

                /* Thêm đường kẻ dọc tinh tế để phân tách cột cố định */
                .ant-table-cell-fix-left-last::after {
                    box-shadow: inset 10px 0 8px -8px rgba(0, 0, 0, 0.05) !important;
                    border-right: 1px solid var(--border-color) !important;
                }
            `}</style>
        </div>
    );
}
