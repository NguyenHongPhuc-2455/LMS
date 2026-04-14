import { useEffect, useState, useRef } from 'react';
import {
    Table, Button, Space, Input, Tag, Popconfirm,
    message, Typography, Card, Badge, Modal, Form,
    Select, Row, Col, Statistic, Avatar, Popover, List
} from 'antd';
import {
    SearchOutlined, DeleteOutlined, UserOutlined,
    ArrowLeftOutlined, BookOutlined,
    PlusOutlined, EditOutlined, TeamOutlined,
    CrownOutlined, UsergroupAddOutlined, IdcardOutlined
} from '@ant-design/icons';
import type { InputRef, TableColumnsType, TableColumnType } from 'antd';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import { useNavigate } from 'react-router-dom';
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
    roles: RoleData[];
    created_at: string;
    enrollments_count: number;
    enrolled_courses: string[];
}

type DataIndex = keyof UserData;

export default function UserManagement() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [form] = Form.useForm();
    const navigate = useNavigate();

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

    const showModal = (user: UserData | null = null) => {
        setEditingUser(user);
        if (user) {
            form.setFieldsValue({
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role_id: user.roles[0]?.id // Tạm thời lấy role chính
            });
        } else {
            form.resetFields();
        }
        setIsModalOpen(true);
    };

    const handleFinish = async (values: any) => {
        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, values);
                message.success('Cập nhật người dùng thành công');
            } else {
                await api.post('/users', values);
                message.success('Tạo người dùng mới thành công');
            }
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi lưu dữ liệu');
        }
    };

    const handleDelete = async (userId: number) => {
        try {
            await api.delete(`/users/${userId}`);
            message.success('Đã xóa người dùng');
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi khi xóa');
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

    const columns: TableColumnsType<UserData> = [
        { title: 'ID', dataIndex: 'id', key: 'id', width: 70, sorter: (a, b) => a.id - b.id },
        {
            title: 'Người dùng',
            key: 'user_info',
            ...getColumnSearchProps('username'),
            render: (_, record) => (
                <Space>
                    <Avatar icon={<UserOutlined />} style={{ background: 'var(--primary-hover)' }} />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong style={{ color: 'var(--text-main)' }}>{record.full_name || record.username}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>@{record.username}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            ...getColumnSearchProps('email'),
            render: (text) => <Text style={{ color: 'var(--text-muted)' }}>{text}</Text>
        },
        {
            title: 'Vai trò',
            key: 'roles',
            render: (_, record) => (
                <Space wrap>
                    {record.roles.map(role => (
                        <Tag key={role.id} color={role.name === 'admin' ? 'gold' : (role.name === 'instructor' ? 'purple' : 'blue')} icon={role.name === 'admin' ? <CrownOutlined /> : <IdcardOutlined />}>
                            {role.name.toUpperCase()}
                        </Tag>
                    ))}
                </Space>
            )
        },
        {
            title: 'Sở hữu',
            dataIndex: 'enrollments_count',
            key: 'enrollments',
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
            title: 'Hành động',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="text" icon={<EditOutlined style={{ color: '#1890ff' }} />} onClick={() => showModal(record)} />
                    <Popconfirm title="Xóa người dùng?" onConfirm={() => handleDelete(record.id)} okText="Xóa" cancelText="Hủy" okButtonProps={{ danger: true }}>
                        <Button type="text" danger icon={<DeleteOutlined />} />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div style={{ padding: '40px', background: 'var(--bg-color)', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                <div>
                    <Title level={2} className="premium-title" style={{ margin: 0 }}>Quản lý người dùng</Title>
                    <Text style={{ color: 'var(--text-muted)' }}>Quản lý người dùng, giảng viên và phân quyền toàn hệ thống</Text>
                </div>
                <Space>
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()} className="btn-primary" style={{ width: 'auto', padding: '0 24px' }}>
                        Thêm thành viên
                    </Button>
                </Space>
            </div>

            <Row gutter={[24, 24]} style={{ marginBottom: 32 }}>
                <Col xs={24} sm={12} md={6}>
                    <Card className="glass-card">
                        <Statistic title={<Text style={{ color: 'var(--text-muted)' }}>Học viên</Text>} value={users.length} prefix={<TeamOutlined style={{ color: '#3b82f6' }} />} styles={{ content: { color: 'var(--text-main)' } }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card className="glass-card">
                        <Statistic title={<Text style={{ color: 'var(--text-muted)' }}>Giảng viên</Text>} value={users.filter(u => u.roles.some(r => r.name === 'instructor')).length} prefix={<IdcardOutlined style={{ color: '#a855f7' }} />} styles={{ content: { color: 'var(--text-main)' } }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card className="glass-card">
                        <Statistic title={<Text style={{ color: 'var(--text-muted)' }}>Quản trị viên</Text>} value={users.filter(u => u.roles.some(r => r.name === 'admin')).length} prefix={<CrownOutlined style={{ color: '#f59e0b' }} />} styles={{ content: { color: 'var(--text-main)' } }} />
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={6}>
                    <Card className="glass-card">
                        <Statistic title={<Text style={{ color: 'var(--text-muted)' }}>Khóa học đã bán</Text>} value={users.reduce((a, b) => a + b.enrollments_count, 0)} prefix={<BookOutlined style={{ color: '#10b981' }} />} styles={{ content: { color: 'var(--text-main)' } }} />
                    </Card>
                </Col>
            </Row>

            <Card className="glass-card" style={{ padding: 0 }}>
                <Title level={4} style={{ padding: '24px 24px 0 24px', color: 'var(--text-main)' }}>
                    <UsergroupAddOutlined /> Danh sách thành viên
                </Title>
                <Table
                    columns={columns}
                    dataSource={users}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 10 }}
                    rowClassName={() => 'premium-row'}
                    style={{ padding: '0 12px 12px 12px' }}
                />
            </Card>

            <Modal
                title={editingUser ? 'Cập nhật thành viên' : 'Tạo thành viên mới'}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                className="premium-modal"
            >
                <Form form={form} layout="vertical" onFinish={handleFinish} initialValues={{ role_id: 3 }}>
                    <Form.Item name="full_name" label="Họ và tên">
                        <Input placeholder="Nguyễn Văn A" />
                    </Form.Item>
                    <Form.Item
                        name="username"
                        label="Tên đăng nhập"
                        rules={[
                            { required: true, message: 'Bắt buộc nhập!' },
                            { pattern: /^[a-zA-Z0-9_]{3,20}$/, message: '3-20 ký tự, không gạch chéo/dấu' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[
                            { required: true, message: 'Bắt buộc nhập!' },
                            { type: 'email', message: 'Email không hợp lệ!' }
                        ]}
                    >
                        <Input />
                    </Form.Item>
                    {!editingUser && (
                        <Form.Item
                            name="password"
                            label="Mật khẩu"
                            rules={[
                                { required: true, message: 'Bắt buộc nhập!' },
                                { min: 6, message: 'Tối thiểu 6 ký tự' }
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>
                    )}
                    <Form.Item name="role_id" label="Vai trò chính" rules={[{ required: true }]}>
                        <Select placeholder="Chọn quyền">
                            {roles.map(r => (
                                <Option key={r.id} value={r.id}>{r.name.toUpperCase()}</Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item style={{ marginTop: 24 }}>
                        <Button type="primary" htmlType="submit" className="btn-primary">
                            {editingUser ? 'Lưu thay đổi' : 'Tạo ngay'}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <style>{`
                .ant-table {
                    background: transparent !important;
                    color: var(--text-main) !important;
                }
                .ant-table-thead > tr > th {
                    background: rgba(255, 255, 255, 0.02) !important;
                    color: var(--text-muted) !important;
                    border-bottom: 1px solid var(--border-color) !important;
                }
                .ant-table-tbody > tr > td {
                    border-bottom: 1px solid var(--border-color) !important;
                }
                .ant-table-tbody > tr:hover > td {
                    background: rgba(255, 255, 255, 0.05) !important;
                }
                .ant-pagination-item, .ant-pagination-item-link {
                    background: transparent !important;
                    border-color: var(--border-color) !important;
                }
                .ant-pagination-item a { color: var(--text-muted) !important; }
                .ant-modal-content {
                    background: var(--surface-color) !important;
                    color: var(--text-main) !important;
                    border: 1px solid var(--border-color);
                    border-radius: 20px;
                }
                .ant-modal-header {
                    background: transparent !important;
                    border-bottom: 1px solid var(--border-color) !important;
                }
                .ant-modal-title { color: white !important; }
                .ant-form-item-label > label { color: var(--text-muted) !important; }
            `}</style>
        </div>
    );
}
