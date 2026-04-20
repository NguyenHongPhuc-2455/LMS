import { Table, Space, Typography, Badge, Avatar, Input } from 'antd';
import { UserOutlined } from '@ant-design/icons';
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
    enrolled_courses: string[];
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
    onSelectChange
}: UserTableProps) {

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
        }
    ];

    const rowSelection = (isDeleteMode || isBatchEditMode) ? {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: 50,
    } : undefined;

    return (
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
    );
}
