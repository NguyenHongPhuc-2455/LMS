import React, { useRef, useState, useMemo } from 'react';
import { Space, Input, Button, Typography, Badge, Avatar, Tag } from 'antd';
import { SearchOutlined, UserOutlined, BookOutlined, CrownOutlined, IdcardOutlined } from '@ant-design/icons';
import type { InputRef, TableColumnType, TableColumnsType } from 'antd';
import type { FilterConfirmProps } from 'antd/es/table/interface';
import Highlighter from 'react-highlight-words';
import dayjs from 'dayjs';
import styles from '../UserManagement.module.scss';
import type { User as UserData, Role as RoleData } from '../../../../types/user';

const { Text } = Typography;

type DataIndex = keyof UserData;

interface UseUserTableColumnsProps {
    roles: RoleData[];
    departments: any[];
    setSelectedUserId: (id: number | null) => void;
    setCourseModalVisible: (visible: boolean) => void;
}

export function useUserTableColumns({
    roles,
    departments,
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
        filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#C72127' : undefined }} />,
        onFilter: (value, record) => {
            const searchValue = (value as string).toLowerCase();
            if (dataIndex === 'username') {
                return (record.username?.toLowerCase().includes(searchValue)) ||
                    (record.full_name?.toLowerCase().includes(searchValue));
            }
            return record[dataIndex] ? record[dataIndex]!.toString().toLowerCase().includes(searchValue) : false;
        },
        render: (text) => {
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
            width: 130,
            fixed: 'left',
            sorter: (a, b) => (a.employee_id || '').localeCompare(b.employee_id || ''),
            ...getColumnSearchProps('employee_id', 'Tìm mã...'),
            render: (text) => <Text strong color="blue">{text || '-'}</Text>
        },
        {
            title: 'Họ tên & Tài khoản',
            key: 'user_info',
            width: 280,
            fixed: 'left',
            ...getColumnSearchProps('username', 'Tìm tên hoặc username...'),
            render: (_, record) => (
                <Space className={styles.userInfoWrapper}>
                    <Avatar
                        src={record.avatar}
                        icon={!record.avatar && <UserOutlined />}
                        className={styles.userAvatar}
                    />
                    <div className={styles.userTextStack}>
                        <Text strong className={styles.fullName}>{record.full_name || record.username}</Text>
                        <Text type="secondary" className={styles.username}>@{record.username}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Phòng ban',
            dataIndex: 'department',
            key: 'department',
            width: 180,
            filters: departments.map(d => ({ text: d.name, value: d.name })),
            onFilter: (value: any, record: UserData) => record.department === value,
            render: (text) => <Tag color="cyan">{text || 'Chưa xếp'}</Tag>
        },
        {
            title: 'Vị trí',
            dataIndex: 'position',
            key: 'position',
            width: 150,
            render: (text) => text || '-'
        },
        {
            title: 'Vai trò',
            key: 'roles',
            width: 160,
            filters: [
                { text: 'Quản trị viên', value: 'admin' },
                { text: 'Giảng viên', value: 'instructor' },
                { text: 'Học viên', value: 'user' },
            ],
            onFilter: (value: any, record: UserData) => {
                const roles = record.roles as any[];
                return roles.some(role => {
                    const name = typeof role === 'object' ? role.name : role;
                    return name === value;
                });
            },
            render: (_, record) => (
                <Space wrap>
                    {record.roles?.map((role: any) => (
                        <Tag 
                            key={typeof role === 'object' ? role.id : role} 
                            color={role.name === 'admin' ? 'gold' : (role.name === 'instructor' ? 'purple' : 'blue')} 
                            icon={role.name === 'admin' ? <CrownOutlined /> : <IdcardOutlined />}
                        >
                            {(typeof role === 'object' ? role.name : role).toUpperCase()}
                        </Tag>
                    ))}
                </Space>
            )
        },
        {
            title: 'Thông tin liên hệ',
            key: 'contact',
            width: 250,
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text size="small">{record.email}</Text>
                    <Text type="secondary" size="small">{record.phone || '-'}</Text>
                </div>
            )
        },
        {
            title: 'Ngày vào làm',
            dataIndex: 'join_date',
            key: 'join_date',
            width: 140,
            render: (text) => text ? dayjs(text).format('DD/MM/YYYY') : '-'
        },
        {
            title: 'Khóa học',
            key: 'enrolled_courses',
            width: 180,
            render: (_, record) => (
                <Button
                    type="link"
                    size="small"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUserId(record.id);
                        setCourseModalVisible(true);
                    }}
                >
                    <BookOutlined /> {record.enrolled_courses?.length || 0} khóa
                </Button>
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 160,
            render: (text) => dayjs(text).format('DD/MM/YYYY')
        }
    ], [departments, getColumnSearchProps, setCourseModalVisible, setSelectedUserId]);

    return { columns, getColumnSearchProps };
}
