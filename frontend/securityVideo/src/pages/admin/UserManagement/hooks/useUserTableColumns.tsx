import React, { useMemo } from 'react';
import { Space, Button, Typography, Switch, message } from 'antd';
import type { TableColumnsType } from 'antd';
import dayjs from 'dayjs';
import styles from '../UserManagement.module.scss';
import type { User as UserData } from '../../../../types/user';

const { Text } = Typography;

interface UseUserTableColumnsProps {
    positions: any[];
    setSelectedUserId: (id: number | null) => void;
    setCourseModalVisible: (visible: boolean) => void;
    onRefresh: () => void;
}

export function useUserTableColumns({
    positions,
    setSelectedUserId,
    setCourseModalVisible,
    onRefresh
}: UseUserTableColumnsProps) {

    const columns: TableColumnsType<UserData> = useMemo(() => [
        {
            title: 'MNS',
            dataIndex: 'employee_id',
            key: 'employee_id',
            width: 130,
            fixed: 'left',
            sorter: (a, b) => (a.employee_id || '').localeCompare(b.employee_id || ''),
            render: (text) => <span style={{ fontWeight: 600, color: '#000' }}>{text || '-'}</span>
        },
        {
            title: 'Họ tên & Tài khoản',
            key: 'user_info',
            width: 280,
            fixed: 'left',
            render: (_, record) => (
                <div className={styles.userTextStack}>
                    <span style={{ fontWeight: 600 }} className={styles.fullName}>{record.full_name || record.username}</span>
                    <span style={{ color: 'rgba(0, 0, 0, 0.45)', fontSize: '12px' }} className={styles.username}>@{record.username}</span>
                </div>
            )
        },
        {
            title: 'Phòng ban',
            dataIndex: 'department',
            key: 'department',
            render: (text) => <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>{text || 'Chưa xếp'}</span>
        },
        {
            title: 'Vị trí',
            dataIndex: 'position',
            key: 'position',
            render: (text, record: any) => {
                const posName = text || positions.find(p => p.id === record.position_id)?.name || '-';
                return <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>{posName}</span>;
            }
        },
        {
            title: 'Vai trò',
            key: 'roles',
            render: (_, record) => (
                <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '8px' }}>
                    {record.roles?.map((role: any) => (
                        <span
                            key={typeof role === 'object' ? role.id : role}
                            style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}
                        >
                            {(typeof role === 'object' ? role.name : role).toUpperCase()}
                        </span>
                    ))}
                </div>
            )
        },
        {
            title: 'Email',
            key: 'contact',
            render: (_, record) => (
                <div style={{ display: 'flex', flexDirection: 'column', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '12px' }}>{record.email}</span>
                    <span style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>{record.phone || '-'}</span>
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
                        checked={record.is_active}
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
        }
    ], [positions, setCourseModalVisible, setSelectedUserId]);

    return { columns };
}
