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
    CrownOutlined, IdcardOutlined,
    EditOutlined, UsergroupAddOutlined
} from '@ant-design/icons';

import type { InputRef, TableColumnsType, TableColumnType } from 'antd';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import { userService } from '../../../services/user.service';
import styles from './UserManagement.module.scss';

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

    // Selection & Edit State
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [editingKeys, setEditingKeys] = useState<React.Key[]>([]);
    const [editData, setEditData] = useState<Record<number, any>>({});

    // Modes
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isBatchEditMode, setIsBatchEditMode] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createForm] = Form.useForm();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef<InputRef>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, rolesData] = await Promise.all([
                userService.getAll(),
                userService.getRoles()
            ]);
            setUsers(usersData);
            setRoles(rolesData);
        } catch (error: any) {
            message.error('Lỗi khi tải dữ liệu hệ thống');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const resetStates = () => {
        setEditingKeys([]);
        setEditData({});
        setSelectedRowKeys([]);
        setIsDeleteMode(false);
        setIsBatchEditMode(false);
    };

    const handleBatchSave = async () => {
        if (isDeleteMode) {
            if (selectedRowKeys.length === 0) return;
            Modal.confirm({
                title: `Xác nhận xóa ${selectedRowKeys.length} thành viên?`,
                content: 'Hành động này không thể hoàn tác.',
                onOk: async () => {
                    try {
                        setLoading(true);
                        for (const key of selectedRowKeys) {
                            await userService.delete(Number(key));
                        }
                        message.success(`Đã xóa thành công ${selectedRowKeys.length} thành viên`);
                        resetStates();
                        await fetchData();
                    } catch (e: any) {
                        message.error('Lỗi khi xóa một số thành viên');
                    } finally {
                        setLoading(false);
                    }
                }
            });
            return;
        }

        // Handle Batch Edit
        const changeCount = Object.keys(editData).length;
        if (changeCount === 0) {
            resetStates();
            return;
        }

        setLoading(true);
        try {
            const payload = Object.entries(editData).map(([id, data]) => ({
                id,
                ...data
            }));

            await userService.batchUpdate({ users: payload });

            message.success(`Đã cập nhật ${payload.length} thành viên thành công`);
            resetStates();
            await fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi lưu thay đổi');
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (selectedKeys: string[], confirm: (param?: FilterConfirmProps) => void, dataIndex: DataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const getColumnSearchProps = (dataIndex: DataIndex): TableColumnType<UserData> => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div className={styles.filterDropdownContainer} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    ref={searchInput}
                    placeholder={`Tìm ${dataIndex}`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
                    className={styles.filterInput}
                />
                <Space>
                    <Button type="primary" onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)} icon={<SearchOutlined />} size="small" className={styles.filterBtns}>Tìm</Button>
                    <Button onClick={() => { if (clearFilters) clearFilters(); setSelectedKeys?.([]); confirm(); }} size="small" className={styles.filterBtns}>Xóa</Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />,
        onFilter: (value, record) => record[dataIndex] ? record[dataIndex]!.toString().toLowerCase().includes((value as string).toLowerCase()) : false,
        render: (text) => searchedColumn === dataIndex ? (
            <Highlighter highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }} searchWords={[searchText]} autoEscape textToHighlight={text ? text.toString() : ''} />
        ) : (text),
    });

    const startRowEditing = (record: UserData) => {
        if (isDeleteMode) return;
        if (!editingKeys.includes(record.id)) {
            setEditingKeys([...editingKeys, record.id]);
            // Initialize editData for this row if not exists
            if (!editData[record.id]) {
                const { roles, ...rest } = record;
                setEditData({ ...editData, [record.id]: { ...rest, role_id: roles[0]?.id } });
            }
        }
    };

    const updateEditData = (id: number, field: string, value: any) => {
        setEditData(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const renderEditableCell = (record: UserData, field: keyof UserData, currentText: any) => {
        const isEditing = editingKeys.includes(record.id);

        if (isEditing) {
            if (field === 'roles') {
                return (
                    <Select
                        defaultValue={record.roles[0]?.id}
                        className="full-width"
                        size="small"
                        onChange={(val) => updateEditData(record.id, 'role_id', val)}
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
                        onChange={(val) => updateEditData(record.id, 'gender', val)}
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
                        onChange={(date) => updateEditData(record.id, 'dob', date ? date.toISOString() : null)}
                    />
                );
            }
            return (
                <Input
                    defaultValue={currentText}
                    size="small"
                    onChange={(e) => updateEditData(record.id, field as string, e.target.value)}
                />
            );
        }

        return (
            <div
                onClick={() => startRowEditing(record)}
                className={styles.editableCellDisplay}
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
            render: (_, record) => {
                const isEditing = editingKeys.includes(record.id);
                return (
                    <Space onClick={() => startRowEditing(record)} className={styles.userInfoWrapper}>
                        <Badge dot={isEditing} status="processing" offset={[-2, 32]}>
                            <Avatar
                                src={record.avatar}
                                icon={!record.avatar && <UserOutlined />}
                                className={styles.userAvatar}
                            />
                        </Badge>
                        <div className={styles.userTextStack}>
                            {isEditing ? (
                                <Input
                                    defaultValue={record.full_name}
                                    size="small"
                                    onChange={e => updateEditData(record.id, 'full_name', e.target.value)}
                                    placeholder="Họ tên"
                                />
                            ) : (
                                <Text strong className={styles.fullName}>{record.full_name || record.username}</Text>
                            )}
                            <Text type="secondary" className={styles.username}>@{record.username}</Text>
                        </div>
                    </Space>
                );
            }
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
                                renderItem={(item) => <List.Item><Text className={styles.courseItemText}>- {item}</Text></List.Item>}
                                className={styles.enrolledCoursesList}
                            />
                        ) : "Chưa mua khóa học nào"
                    }
                    trigger="hover"
                >
                    <Badge count={count} showZero color={count > 0 ? '#52c41a' : '#d9d9d9'} className={styles.successBadge} />
                </Popover>
            )
        }
    ];

    const onSelectChange = (newSelectedRowKeys: React.Key[]) => {
        setSelectedRowKeys(newSelectedRowKeys);
    };

    const rowSelection = (isDeleteMode || isBatchEditMode) ? {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: 50,
    } : undefined;

    const startBatchEdit = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 thành viên để sửa');
            return;
        }
        setEditingKeys(selectedRowKeys);
        const newEditData = { ...editData };
        selectedRowKeys.forEach(id => {
            if (!newEditData[id as number]) {
                const user = users.find(u => u.id === id);
                if (user) {
                    const { roles, ...rest } = user;
                    newEditData[id as number] = { ...rest, role_id: roles[0]?.id };
                }
            }
        });
        setEditData(newEditData);
        setIsBatchEditMode(false); // Close the selection mode
    };

    return (
        <div className={styles.userManagementContainer} >
            <div className={styles.userManagementHeader}>
                <div className={styles.headerInfo}>
                    <Title level={4} className={styles.headerTitle}>Quản lý người dùng</Title>
                    <Text type="secondary">Quản lý, phân quyền và chỉnh sửa thông tin hàng loạt</Text>
                </div>
            </div>

            <Row gutter={[16, 16]} className={styles.statsRow}>
                {[1, 2, 3, 4].map(i => (
                    <Col key={i} xs={24} sm={12} md={6}>
                        <Card className="glass-card stats-card">
                            {loading && users.length === 0 ? (
                                <Skeleton active avatar title={false} paragraph={{ rows: 1 }} />
                            ) : (
                                i === 1 ? <Statistic title={<Text type="secondary" className={styles.statsTitle}>Học viên</Text>} value={users.length} valueStyle={{ fontSize: '20px' }} prefix={<TeamOutlined className={`${styles.statsIcon} ${styles.student}`} />} /> :
                                    i === 2 ? <Statistic title={<Text type="secondary" className={styles.statsTitle}>Giảng viên</Text>} value={users.filter(u => u.roles.some(r => r.name === 'instructor')).length} valueStyle={{ fontSize: '20px' }} prefix={<IdcardOutlined className={`${styles.statsIcon} ${styles.instructor}`} />} /> :
                                        i === 3 ? <Statistic title={<Text type="secondary" className={styles.statsTitle}>Quản trị viên</Text>} value={users.filter(u => u.roles.some(r => r.name === 'admin')).length} valueStyle={{ fontSize: '20px' }} prefix={<CrownOutlined className={`${styles.statsIcon} ${styles.admin}`} />} /> :
                                            <Statistic title={<Text type="secondary" className={styles.statsTitle}>Khóa học bán</Text>} value={users.reduce((a, b) => a + b.enrollments_count, 0)} valueStyle={{ fontSize: '20px' }} prefix={<BookOutlined className={`${styles.statsIcon} ${styles.courses}`} />} />
                            )}
                        </Card>
                    </Col>
                ))}
            </Row>

            <Card className="glass-card user-list-card">
                <div className={styles.userListHeader}>
                    <div className={styles.headerLeft}>
                        <Title level={4} className={styles.headerTitle}>
                            <UsergroupAddOutlined /> Danh sách thành viên
                        </Title>
                        {editingKeys.length > 0 && (
                            <Tag color="processing" icon={<EditOutlined />} className="edit-mode-tag">
                                Đang chỉnh sửa {editingKeys.length} người
                            </Tag>
                        )}
                        {isDeleteMode && (
                            <Tag color="error" className={styles.deleteModeTag}>
                                Đang chọn {selectedRowKeys.length} người để xóa
                            </Tag>
                        )}
                        {isBatchEditMode && (
                            <Tag color="warning" className="edit-mode-tag">
                                Chọn người dùng để sửa hàng loạt ({selectedRowKeys.length})
                            </Tag>
                        )}
                    </div>

                    <Space>
                        {(editingKeys.length > 0 || isDeleteMode || isBatchEditMode) ? (
                            <Space>
                                {isBatchEditMode ? (
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={startBatchEdit}
                                        disabled={selectedRowKeys.length === 0}
                                    >
                                        Bắt đầu sửa ({selectedRowKeys.length})
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        onClick={handleBatchSave}
                                        loading={loading}
                                        className={styles.saveBatchBtn}
                                    >
                                        Lưu {isDeleteMode ? 'Xóa' : 'Thay đổi'}
                                    </Button>
                                )}
                                <Button icon={<CloseOutlined />} onClick={resetStates}>Hủy</Button>
                            </Space>
                        ) : (
                            <Space>
                                <Button
                                    icon={<EditOutlined />}
                                    onClick={() => setIsBatchEditMode(true)}
                                >
                                    Sửa hàng loạt
                                </Button>
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => setIsDeleteMode(true)}
                                >
                                    Xóa nhiều
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    Thêm thành viên
                                </Button>
                            </Space>
                        )}
                    </Space>
                </div>

                <div className={styles.tableWrapper}>
                    <Table
                        columns={columns}
                        dataSource={users}
                        rowKey="id"
                        loading={loading}
                        rowSelection={rowSelection}
                        pagination={{ pageSize: 10 }}
                        rowClassName={(record) => editingKeys.includes(record.id) ? `${styles.editableRow} ${styles.active}` : 'premium-row'}
                        scroll={{ x: 1800 }}
                    />
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

    async function handleCreateFinish(values: any) {
        try {
            setLoading(true);
            await userService.create(values);
            message.success('Tạo người dùng mới thành công');
            setIsCreateModalOpen(false);
            createForm.resetFields();
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi lưu dữ liệu');
        } finally {
            setLoading(false);
        }
    }
}
