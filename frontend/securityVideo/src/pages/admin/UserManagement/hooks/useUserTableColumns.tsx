import React, { useRef, useState, useMemo } from 'react';
import { Space, Input, Button, Typography, Switch, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
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
    positions: any[];
    setSelectedUserId: (id: number | null) => void;
    setCourseModalVisible: (visible: boolean) => void;
    onRefresh: () => void;
}

export function useUserTableColumns({
    roles,
    departments,
    positions,
    setSelectedUserId,
    setCourseModalVisible,
    onRefresh
}: UseUserTableColumnsProps) {
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const searchInput = useRef<InputRef>(null);

    const handleSearch = React.useCallback((selectedKeys: string[], confirm: (param?: FilterConfirmProps) => void, dataIndex: DataIndex) => {
        confirm();
        setSearchText(selectedKeys[0]);
        setSearchedColumn(dataIndex);
    }, []);

    const getColumnSearchProps = React.useCallback((dataIndex: DataIndex, placeholder?: string): TableColumnType<UserData> => ({
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
    }), [searchText, searchedColumn, handleSearch]);

    const columns: TableColumnsType<UserData> = useMemo(() => [
        {
            title: 'MNS',
            dataIndex: 'employee_id',
            key: 'employee_id',
            width: 130,
            fixed: 'left',
            sorter: (a, b) => (a.employee_id || '').localeCompare(b.employee_id || ''),
            ...getColumnSearchProps('employee_id', 'Tìm mã...'),
            render: (text) => <Text strong style={{ color: '#000' }}>{text || '-'}</Text>
        },
        {
            title: 'Họ tên & Tài khoản',
            key: 'user_info',
            width: 280,
            fixed: 'left',
            ...getColumnSearchProps('username', 'Tìm tên hoặc username...'),
            render: (_, record) => (
                <div className={styles.userTextStack}>
                    <Text strong className={styles.fullName}>{record.full_name || record.username}</Text>
                    <Text type="secondary" className={styles.username}>@{record.username}</Text>
                </div>
            )
        },
        {
            title: 'Phòng ban',
            dataIndex: 'department',
            key: 'department',
            filters: departments.map(d => ({ text: d.name, value: d.name })),
            onFilter: (value: any, record: UserData) => record.department === value,
            render: (text) => <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>{text || 'Chưa xếp'}</span>
        },
        {
            title: 'Vị trí',
            dataIndex: 'position',
            key: 'position',
            filters: positions.map(p => ({ text: p.name, value: p.name })),
            onFilter: (value: any, record: UserData) => record.position === value,
            render: (text, record: any) => {
                const posName = text || positions.find(p => p.id === record.position_id)?.name || '-';
                return <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>{posName}</span>;
            }
        },
        {
            title: 'Vai trò',
            key: 'roles',
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
                <Space wrap={false}>
                    {record.roles?.map((role: any) => (
                        <span
                            key={typeof role === 'object' ? role.id : role}
                            style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}
                        >
                            {(typeof role === 'object' ? role.name : role).toUpperCase()}
                        </span>
                    ))}
                </Space>
            )
        },
        {
            title: 'Thông tin liên hệ',
            key: 'contact',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
                    <Text style={{ fontSize: '12px' }}>{record.email}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>{record.phone || '-'}</Text>
                </div>
            )
        },
        {
            title: 'Ngày vào làm',
            dataIndex: 'join_date',
            key: 'join_date',
            render: (text) => <span style={{ whiteSpace: 'nowrap' }}>{text ? dayjs(text).format('DD/MM/YYYY') : '-'}</span>
        },
        {
            title: 'Hoạt động',
            key: 'active',
            render: (_, record) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <Switch
                        size="small"
                        checked={!record.deleted_at}
                        onChange={async (checked) => {
                            try {
                                const { userService } = await import('../../../../services/user.service');
                                await userService.toggleStatus(record.id, !checked);
                                message.success('Cập nhật trạng thái thành công');
                                onRefresh();
                            } catch (error) {
                                message.error('Lỗi khi cập nhật trạng thái');
                            }
                        }}
                    />
                </div>
            )
        },
        {
            title: 'Khóa học',
            key: 'enrolled_courses',
            render: (_, record) => {
                const cCount = record.enrollments_count || 0;
                const pCount = record.programs_count || 0;
                return (
                    <Button
                        type="link"
                        size="small"
                        style={{ whiteSpace: 'nowrap' }}
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(record.id);
                            setCourseModalVisible(true);
                        }}
                    >
                        {cCount} khóa {pCount > 0 ? `/ ${pCount} lộ trình` : ''}
                    </Button>
                );
            }
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (text) => <span style={{ whiteSpace: 'nowrap' }}>{dayjs(text).format('DD/MM/YYYY')}</span>
        }
    ], [departments, positions, getColumnSearchProps, setCourseModalVisible, setSelectedUserId]);

    return { columns, getColumnSearchProps };
}
