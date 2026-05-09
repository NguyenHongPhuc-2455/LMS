import React, { useState, useEffect } from 'react';
import { Select, DatePicker, Input, Typography, Space, Tag } from 'antd';
import { CrownOutlined, IdcardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from '../UserManagement.module.scss';
import type { User as UserData, Role as RoleData } from '../../../../types/user';

const { Text } = Typography;

interface UserEditableCellProps {
    record: UserData;
    field: string;
    currentText: any;
    isEditing: boolean;
    roles: RoleData[];
    onUpdate: (id: number, field: string, value: any) => void;
    onStartEdit: (record: UserData) => void;
}

export const UserEditableCell = React.memo(({
    record,
    field,
    currentText,
    isEditing,
    roles,
    onUpdate,
    onStartEdit
}: UserEditableCellProps) => {
    const [localValue, setLocalValue] = useState(currentText);

    // Sync local value when entering edit mode or when currentText changes from outside
    useEffect(() => {
        setLocalValue(currentText);
    }, [currentText, isEditing]);

    if (isEditing) {
        if (field === 'roles') {
            const firstRole = record.roles?.[0];
            const defaultRoleId = (firstRole && typeof firstRole === 'object') ? firstRole.id : undefined;
            
            return (
                <Select
                    defaultValue={defaultRoleId}
                    style={{ width: '100%', minWidth: '110px' }}
                    size="small"
                    showSearch={false}
                    onChange={(val) => onUpdate(record.id, 'role_id', val)}
                    options={roles.map(r => ({ value: r.id, label: r.name.toUpperCase() }))}
                />
            );
        }
        if (field === 'gender') {
            return (
                <Select
                    value={localValue}
                    style={{ width: '100%', minWidth: '90px' }}
                    size="small"
                    showSearch={false}
                    onChange={(val) => {
                        setLocalValue(val);
                        onUpdate(record.id, 'gender', val);
                    }}
                    options={[
                        { value: 'Nam', label: 'Nam' },
                        { value: 'Nữ', label: 'Nữ' },
                        { value: 'Khác', label: 'Khác' }
                    ]}
                />
            );
        }
        if (field === 'dob' || field === 'join_date') {
            return (
                <DatePicker
                    value={localValue ? dayjs(localValue) : null}
                    style={{ width: '100%', minWidth: '120px' }}
                    size="small"
                    format="DD/MM/YYYY"
                    onChange={(date) => {
                        const val = date ? date.toISOString() : null;
                        setLocalValue(val);
                        onUpdate(record.id, field, val);
                    }}
                />
            );
        }
        return (
            <Input
                value={localValue || ''}
                style={{ width: '100%', minWidth: '150px' }}
                size="small"
                onChange={(e) => setLocalValue(e.target.value)}
                onBlur={() => {
                    if (localValue !== currentText) {
                        onUpdate(record.id, field, localValue);
                    }
                }}
                onPressEnter={() => {
                    if (localValue !== currentText) {
                        onUpdate(record.id, field, localValue);
                    }
                }}
            />
        );
    }

    return (
        <div
            onClick={() => onStartEdit(record)}
            className={styles.editableCellDisplay}
        >
            {field === 'roles' ? (
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
            ) : (field === 'dob' || field === 'join_date') ? (
                currentText ? dayjs(currentText).format('DD/MM/YYYY') : <Text type="secondary">-</Text>
            ) : field === 'updated_at' || field === 'created_at' ? (
                dayjs(currentText).format('HH:mm DD/MM/YYYY')
            ) : (
                currentText || <Text type="secondary">-</Text>
            )}
        </div>
    );
}, (prevProps, nextProps) => {
    return (
        prevProps.isEditing === nextProps.isEditing &&
        prevProps.currentText === nextProps.currentText &&
        prevProps.record.id === nextProps.record.id &&
        prevProps.roles === nextProps.roles
    );
});
