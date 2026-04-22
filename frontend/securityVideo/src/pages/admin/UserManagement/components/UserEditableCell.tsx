import { Select, DatePicker, Input, Typography, Space, Tag } from 'antd';
import { CrownOutlined, IdcardOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from '../UserManagement.module.scss';

const { Text } = Typography;

interface RoleData {
    id: number;
    name: string;
}

interface UserEditableCellProps {
    record: any;
    field: string;
    currentText: any;
    isEditing: boolean;
    roles: RoleData[];
    onUpdate: (id: number, field: string, value: any) => void;
    onStartEdit: (record: any) => void;
}

export default function UserEditableCell({
    record,
    field,
    currentText,
    isEditing,
    roles,
    onUpdate,
    onStartEdit
}: UserEditableCellProps) {
    if (isEditing) {
        if (field === 'roles') {
            return (
                <Select
                    defaultValue={record.roles[0]?.id}
                    className="full-width"
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
                    defaultValue={currentText}
                    className="full-width"
                    size="small"
                    showSearch={false}
                    onChange={(val) => onUpdate(record.id, 'gender', val)}
                    options={[
                        { value: 'Nam', label: 'Nam' },
                        { value: 'Nữ', label: 'Nữ' },
                        { value: 'Khác', label: 'Khác' }
                    ]}
                />
            );
        }
        if (field === 'dob') {
            return (
                <DatePicker
                    defaultValue={currentText ? dayjs(currentText) : undefined}
                    className="full-width"
                    size="small"
                    format="DD/MM/YYYY"
                    onChange={(date) => onUpdate(record.id, 'dob', date ? date.toISOString() : null)}
                />
            );
        }
        return (
            <Input
                defaultValue={currentText}
                size="small"
                onChange={(e) => onUpdate(record.id, field, e.target.value)}
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
                    {record.roles.map((role: any) => (
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
}
