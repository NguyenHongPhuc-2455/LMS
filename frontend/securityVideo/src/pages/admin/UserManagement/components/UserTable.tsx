import { useState } from 'react';
import { Table, Space, Typography, Badge, Avatar, Input, Popconfirm, Button, Modal } from 'antd';
import { UserOutlined, SearchOutlined, UsergroupAddOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import styles from '../UserManagement.module.scss';

// Sub-components & Hooks
import UserEditableCell from './UserEditableCell';
import { useUserTableColumns } from '../hooks/useUserTableColumns';

const { Text } = Typography;

interface RoleData {
    id: number;
    name: string;
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
    enrolled_courses: { id: number; title: string }[];
}

interface UserTableProps {
    users: UserData[];
    roles: RoleData[];
    loading: boolean;
    editingKeys: React.Key[];
    setEditingKeys: (keys: React.Key[]) => void;
    editData: Record<number, any>;
    setEditData: (data: any) => void;
    isDeleteMode: boolean;
    isBatchEditMode: boolean;
    selectedRowKeys: React.Key[];
    onSelectChange: (keys: React.Key[]) => void;
    onRevokeAccess: (userId: number, courseId: number) => void;
    pagination?: any;
}

export default function UserTable({
    users,
    roles,
    loading,
    editingKeys,
    setEditingKeys,
    editData,
    setEditData,
    isDeleteMode,
    isBatchEditMode,
    selectedRowKeys,
    onSelectChange,
    onRevokeAccess,
    pagination
}: UserTableProps) {
    const [courseModalVisible, setCourseModalVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [courseSearchText, setCourseSearchText] = useState('');

    const startRowEditing = (record: UserData) => {
        if (isDeleteMode || isBatchEditMode) return;
        if (!editingKeys.includes(record.id)) {
            setEditingKeys([...editingKeys, record.id]);
            if (!editData[record.id]) {
                const { roles: userRoles, ...rest } = record;
                setEditData({ ...editData, [record.id]: { ...rest, role_id: userRoles[0]?.id } });
            }
        }
    };

    const updateEditData = (id: number, field: string, value: any) => {
        setEditData((prev: any) => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    };

    const { getColumnSearchProps } = useUserTableColumns();

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
            render: (_, record) => (
                <UserEditableCell
                    record={record}
                    field="roles"
                    currentText={record.roles}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={updateEditData}
                    onStartEdit={startRowEditing}
                />
            )
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 200,
            ...getColumnSearchProps('email'),
            render: (text, record) => (
                <UserEditableCell
                    record={record}
                    field="email"
                    currentText={text}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={updateEditData}
                    onStartEdit={startRowEditing}
                />
            )
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            width: 150,
            render: (text, record) => (
                <UserEditableCell
                    record={record}
                    field="phone"
                    currentText={text}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={updateEditData}
                    onStartEdit={startRowEditing}
                />
            )
        },
        {
            title: 'Ngày sinh',
            dataIndex: 'dob',
            key: 'dob',
            width: 150,
            render: (text, record) => (
                <UserEditableCell
                    record={record}
                    field="dob"
                    currentText={text}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={updateEditData}
                    onStartEdit={startRowEditing}
                />
            )
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
            render: (text, record) => (
                <UserEditableCell
                    record={record}
                    field="gender"
                    currentText={text}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={updateEditData}
                    onStartEdit={startRowEditing}
                />
            )
        },
        {
            title: 'Tiểu sử',
            dataIndex: 'bio',
            key: 'bio',
            width: 250,
            ellipsis: true,
            render: (text, record) => (
                <UserEditableCell
                    record={record}
                    field="bio"
                    currentText={text}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={updateEditData}
                    onStartEdit={startRowEditing}
                />
            )
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
            title: 'Khóa học đã đăng ký',
            key: 'enrolled_courses',
            width: 200,
            render: (_, record) => (
                <div className={styles.enrollmentCell}>
                    {record.enrolled_courses.length > 0 ? (
                        <Button
                            type="link"
                            onClick={() => {
                                setSelectedUserId(record.id);
                                setCourseModalVisible(true);
                            }}
                            className={styles.manageLink}
                        >
                            <BookOutlined style={{ marginRight: 8 }} />
                            {record.enrolled_courses.length} khóa học
                        </Button>
                    ) : (
                        <Text type="secondary">Chưa đăng ký</Text>
                    )}
                </div>
            )
        }
    ];

    const rowSelection = (isDeleteMode || isBatchEditMode) ? {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: 50,
    } : undefined;

    // Derive selectedUser from users prop to ensure reactivity
    const selectedUser = users.find(u => u.id === selectedUserId);

    const filteredUserCourses = selectedUser?.enrolled_courses.filter(c =>
        c.title.toLowerCase().includes(courseSearchText.toLowerCase())
    ) || [];

    return (
        <>
            <Table
                columns={columns}
                dataSource={users}
                rowKey="id"
                loading={loading}
                rowSelection={rowSelection}
                pagination={pagination}
                rowClassName={(record) => editingKeys.includes(record.id) ? `${styles.editableRow} ${styles.active}` : 'premium-row'}
                scroll={{ x: 1800 }}
            />

            <Modal
                title={
                    <Space>
                        <UsergroupAddOutlined />
                        <span>Quản lý khóa học: <Text strong>{selectedUser?.full_name || selectedUser?.username}</Text></span>
                    </Space>
                }
                open={courseModalVisible}
                onCancel={() => {
                    setCourseModalVisible(false);
                    setCourseSearchText('');
                    setSelectedUserId(null);
                }}
                footer={null}
                width={600}
                className="premium-modal"
            >
                <div style={{ marginBottom: 16 }}>
                    <Input
                        placeholder="Tìm kiếm khóa học của học viên..."
                        prefix={<SearchOutlined />}
                        value={courseSearchText}
                        onChange={e => setCourseSearchText(e.target.value)}
                        allowClear
                    />
                </div>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    {filteredUserCourses.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filteredUserCourses.map(course => (
                                <div key={course.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '12px',
                                    background: 'rgba(0,0,0,0.02)',
                                    borderRadius: '8px',
                                    border: '1px solid rgba(0,0,0,0.05)'
                                }}>
                                    <Text strong>{course.title}</Text>
                                    <Popconfirm
                                        title="Thu hồi quyền truy cập"
                                        description="Học viên sẽ không còn thấy khóa học này trong danh sách của họ."
                                        onConfirm={() => {
                                            onRevokeAccess(selectedUserId!, course.id);
                                        }}
                                        okText="Thu hồi"
                                        cancelText="Hủy"
                                        okButtonProps={{ danger: true }}
                                    >
                                        <Button danger size="small" icon={<DeleteOutlined />}>Thu hồi</Button>
                                    </Popconfirm>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <Text type="secondary">Không tìm thấy khóa học nào phù hợp</Text>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
}
