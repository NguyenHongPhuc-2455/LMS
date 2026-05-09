import React, { useRef, useState, useMemo } from 'react';
import { Space, Input, Button, Typography, Badge, Avatar } from 'antd';
import { SearchOutlined, UserOutlined, BookOutlined } from '@ant-design/icons';
import type { InputRef, TableColumnType, TableColumnsType } from 'antd';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import styles from '../UserManagement.module.scss';
import type { User as UserData, Role as RoleData } from '../../../../types/user';
import { UserEditableCell } from '../components/UserEditableCell';

const { Text } = Typography;

type DataIndex = keyof UserData;

interface UseUserTableColumnsProps {
    editingKeys: React.Key[];
    roles: RoleData[];
    onUpdate: (id: number, field: string, value: any) => void;
    onStartEdit: (record: UserData) => void;
    setSelectedUserId: (id: number | null) => void;
    setCourseModalVisible: (visible: boolean) => void;
}

export function useUserTableColumns({
    editingKeys,
    roles,
    onUpdate,
    onStartEdit,
    setSelectedUserId,
    setCourseModalVisible
}: UseUserTableColumnsProps) {
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef<InputRef>(null);

    const handleSearch = (selectedKeys: string[], confirm: (param?: FilterConfirmProps) => void, dataIndex: DataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    };

    const getColumnSearchProps = (dataIndex: DataIndex, placeholder?: string): TableColumnType<UserData> => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
            <div className={styles.filterDropdownContainer} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    ref={searchInput}
                    placeholder={placeholder || `Tìm ${dataIndex}`}
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
        filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#fff' : '#fff', fontSize: '18px' }} />,
        onFilter: (value, record) => {
            const searchValue = (value as string).toLowerCase();
            if (dataIndex === 'username') {
                return (record.username?.toLowerCase().includes(searchValue)) ||
                    (record.full_name?.toLowerCase().includes(searchValue));
            }
            return record[dataIndex] ? record[dataIndex]!.toString().toLowerCase().includes(searchValue) : false;
        },
        render: (text, record) => {
            if (searchedColumn === dataIndex) {
                return (
                    <Highlighter
                        highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
                        searchWords={[searchText]}
                        autoEscape
                        textToHighlight={text ? text.toString() : ''}
                    />
                );
            }
            return text;
        },
    });

    const columns: TableColumnsType<UserData> = useMemo(() => [
        {
            title: 'Mã nhân sự',
            dataIndex: 'employee_id',
            key: 'employee_id',
            width: 140,
            fixed: 'left',
            sorter: (a, b) => (a.employee_id || '').localeCompare(b.employee_id || ''),
            ...getColumnSearchProps('employee_id', 'Tìm mã nhân sự...'),
            render: (text, record) => (
                <UserEditableCell
                    record={record}
                    field="employee_id"
                    currentText={text}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={onUpdate}
                    onStartEdit={onStartEdit}
                />
            )
        },
        {
            title: 'Người dùng',
            key: 'user_info',
            width: 280,
            fixed: 'left',
            ...getColumnSearchProps('username', 'Tìm tên hoặc username...'),
            render: (_, record) => {
                const isEditing = editingKeys.includes(record.id);
                return (
                    <Space onClick={() => onStartEdit(record)} className={styles.userInfoWrapper}>
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
                                    onChange={e => onUpdate(record.id, 'full_name', e.target.value)}
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
            title: 'Phòng ban',
            dataIndex: 'department',
            key: 'department',
            width: 160,
            filters: [
                { text: 'Phòng CNTT', value: 'Phòng CNTT' },
                { text: 'Phòng Nhân sự', value: 'Phòng Nhân sự' },
                { text: 'Phòng Kế toán', value: 'Phòng Kế toán' },
                { text: 'Phòng Marketing', value: 'Phòng Marketing' },
            ],
            onFilter: (value: any, record: UserData) => record.department === value,
            render: (text, record) => (
                <UserEditableCell
                    record={record}
                    field="department"
                    currentText={text}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={onUpdate}
                    onStartEdit={onStartEdit}
                />
            )
        },
        {
            title: 'Vị trí',
            dataIndex: 'position',
            key: 'position',
            width: 140,
            render: (text, record) => (
                <UserEditableCell
                    record={record}
                    field="position"
                    currentText={text}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={onUpdate}
                    onStartEdit={onStartEdit}
                />
            )
        },
        {
            title: 'Vai trò',
            key: 'roles',
            width: 160,
            filters: [
                { text: 'ADMIN', value: 'admin' },
                { text: 'INSTRUCTOR', value: 'instructor' },
                { text: 'USER', value: 'user' },
            ],
            onFilter: (value: any, record: UserData) => {
                const roles = record.roles as any[];
                return roles.some(role => {
                    const name = typeof role === 'object' ? role.name : role;
                    return name === value;
                });
            },
            render: (_, record) => (
                <UserEditableCell
                    record={record}
                    field="roles"
                    currentText={record.roles}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={onUpdate}
                    onStartEdit={onStartEdit}
                />
            )
        },
        {
            title: 'Ngày vào làm',
            dataIndex: 'join_date',
            key: 'join_date',
            width: 150,
            sorter: (a, b) => new Date(a.join_date || 0).getTime() - new Date(b.join_date || 0).getTime(),
            render: (text, record) => (
                <UserEditableCell
                    record={record}
                    field="join_date"
                    currentText={text}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={onUpdate}
                    onStartEdit={onStartEdit}
                />
            )
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            width: 250,
            ...getColumnSearchProps('email'),
            render: (text, record) => (
                <UserEditableCell
                    record={record}
                    field="email"
                    currentText={text}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={onUpdate}
                    onStartEdit={onStartEdit}
                />
            )
        },
        {
            title: 'Số điện thoại',
            dataIndex: 'phone',
            key: 'phone',
            width: 160,
            render: (text, record) => (
                <UserEditableCell
                    record={record}
                    field="phone"
                    currentText={text}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={onUpdate}
                    onStartEdit={onStartEdit}
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
                    onUpdate={onUpdate}
                    onStartEdit={onStartEdit}
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
                    onUpdate={onUpdate}
                    onStartEdit={onStartEdit}
                />
            )
        },
        {
            title: 'Khóa học đã đăng ký',
            key: 'enrolled_courses',
            width: 220,
            render: (_, record) => (
                <div className={styles.enrollmentCell}>
                    {(record.enrolled_courses?.length || 0) > 0 ? (
                        <Button
                            type="link"
                            onClick={() => {
                                setSelectedUserId(record.id);
                                setCourseModalVisible(true);
                            }}
                            className={styles.manageLink}
                        >
                            <BookOutlined style={{ marginRight: 8 }} />
                            {record.enrolled_courses?.length} khóa học
                        </Button>
                    ) : (
                        <Text type="secondary">Chưa đăng ký</Text>
                    )}
                </div>
            )
        },
        {
            title: 'Tiểu sử',
            dataIndex: 'bio',
            key: 'bio',
            width: 300,
            ellipsis: true,
            render: (text, record) => (
                <UserEditableCell
                    record={record}
                    field="bio"
                    currentText={text}
                    isEditing={editingKeys.includes(record.id)}
                    roles={roles}
                    onUpdate={onUpdate}
                    onStartEdit={onStartEdit}
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
    ], [editingKeys, roles, onStartEdit, onUpdate, getColumnSearchProps, setCourseModalVisible, setSelectedUserId]);

    return { columns, getColumnSearchProps };
}

