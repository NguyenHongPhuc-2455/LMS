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
import './UserManagement.scss';

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
            <div className="filter-dropdown-container" onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    ref={searchInput}
                    placeholder={`Tìm ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
                    className="filter-input"
                />
                <Space>
                    <Button type="primary" onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)} icon={<SearchOutlined />} size="small" className="filter-btns">Tìm</Button>
                    <Button onClick={() => { if (clearFilters) clearFilters(); setSelectedKeys?.([]); confirm(); }} size="small" className="filter-btns">Xóa</Button>
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
                        className="full-width"
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
                        className="full-width"
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
                        className="full-width"
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
                className="editable-cell-display editable-cell-value"
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
                <Space onClick={() => startEditing(record, 'full_name')} className="user-info-wrapper">
                    <Avatar
                        src={record.avatar}
                        icon={!record.avatar && <UserOutlined />}
                        className="user-avatar"
                    />
                    <div className="user-text-stack">
                        {editingKey === record.id ? (
                            <Input
                                defaultValue={record.full_name}
                                size="small"
                                onChange={e => setEditData({ ...editData, full_name: e.target.value })}
                                autoFocus={editingField === 'full_name'}
                            />
                        ) : (
                            <Text strong className="full-name">{record.full_name || record.username}</Text>
                        )}
                        <Text type="secondary" className="username">@{record.username}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Vai trò',
            key: 'roles',
            width: 150,
            filters: [
                { text: 'ADMIN', value: 'admin' },
                { text: 'INSTRUCTOR', value: 'instructor' },
                { text: 'USER', value: 'user' },
            ],
            onFilter: (value: any, record: UserData) => record.roles.some(role => role.name === value),
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
            filters: [
                { text: 'Nam', value: 'Nam' },
                { text: 'Nữ', value: 'Nữ' },
                { text: 'Khác', value: 'Khác' },
            ],
            onFilter: (value: any, record: UserData) => record.gender === value,
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
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
                <div className="filter-dropdown-container" onKeyDown={(e) => e.stopPropagation()}>
                    <DatePicker.RangePicker
                        value={selectedKeys[0] ? [dayjs(selectedKeys[0][0]), dayjs(selectedKeys[0][1])] : null}
                        onChange={(dates) => setSelectedKeys(dates ? [[dates[0]?.toISOString(), dates[1]?.toISOString()]] : [])}
                        className="range-picker-filter"
                        size="small"
                    />
                    <Space>
                        <Button type="primary" onClick={() => confirm()} size="small" className="filter-btns">Lọc</Button>
                        <Button onClick={() => { clearFilters(); confirm(); }} size="small" className="filter-btns">Xóa</Button>
                    </Space>
                </div>
            ),
            onFilter: (value: any, record: UserData) => {
                if (!value || value.length === 0) return true;
                const start = dayjs(value[0][0]).startOf('day');
                const end = dayjs(value[0][1]).endOf('day');
                const recordDate = dayjs(record.created_at);
                return recordDate.isAfter(start) && recordDate.isBefore(end);
            },
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
                                renderItem={(item) => <List.Item><Text className="course-item-text">- {item}</Text></List.Item>}
                                className="enrolled-courses-list"
                            />
                        ) : "Chưa mua khóa học nào"
                    }
                    trigger="hover"
                >
                    <Badge count={count} showZero color={count > 0 ? '#52c41a' : '#d9d9d9'} className="success-badge" />
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
        <div className="user-management-container" >
            <div className="user-management-header">
                <div className="header-info">
                    <Title level={4} className="header-title">Quản lý người dùng</Title>
                    <Text type="secondary">Quản lý người dùng, giảng viên và phân quyền toàn hệ thống</Text>
                </div>
                <Space>
                    {/* Top actions moved to card header */}
                </Space>
            </div>

            <Row gutter={[16, 16]} className="stats-row">
                {[1, 2, 3, 4].map(i => (
                    <Col key={i} xs={24} sm={12} md={6}>
                        <Card className="glass-card stats-card">
                            {loading && users.length === 0 ? (
                                <Skeleton active avatar title={false} paragraph={{ rows: 1 }} />
                            ) : (
                                i === 1 ? <Statistic title={<Text type="secondary" className="stats-title">Học viên</Text>} value={users.length} valueStyle={{ fontSize: '20px' }} prefix={<TeamOutlined className="stats-icon student" />} /> :
                                    i === 2 ? <Statistic title={<Text type="secondary" className="stats-title">Giảng viên</Text>} value={users.filter(u => u.roles.some(r => r.name === 'instructor')).length} valueStyle={{ fontSize: '20px' }} prefix={<IdcardOutlined className="stats-icon instructor" />} /> :
                                        i === 3 ? <Statistic title={<Text type="secondary" className="stats-title">Quản trị viên</Text>} value={users.filter(u => u.roles.some(r => r.name === 'admin')).length} valueStyle={{ fontSize: '20px' }} prefix={<CrownOutlined className="stats-icon admin" />} /> :
                                            <Statistic title={<Text type="secondary" className="stats-title">Khóa học bán</Text>} value={users.reduce((a, b) => a + b.enrollments_count, 0)} valueStyle={{ fontSize: '20px' }} prefix={<BookOutlined className="stats-icon courses" />} />
                            )}
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card className="glass-card user-list-card">
                <div className="user-list-header">
                    <div className="header-left">
                        <Title level={4} className="header-title">
                            <UsergroupAddOutlined /> Danh sách thành viên
                        </Title>
                        {isDeleteMode && (
                            <Tag color="error" className="delete-mode-tag">
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
                                    className="save-batch-btn"
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
                <div className="table-wrapper">
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
        </div >
    );
}
