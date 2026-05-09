import React, { useState, useMemo, useCallback } from 'react';
import { Table, Space, Typography, Badge, Avatar, Input, Popconfirm, Button, Modal } from 'antd';
import { UserOutlined, SearchOutlined, UsergroupAddOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import type { TableColumnsType } from 'antd';
import styles from '../UserManagement.module.scss';
import type { User as UserData, Role as RoleData } from '../../../../types/user';

// Sub-components & Hooks
import { UserEditableCell } from './UserEditableCell';
import { useUserTableColumns } from '../hooks/useUserTableColumns';

const { Text } = Typography;



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
    onUpdate: (id: number, field: string, value: any) => void;
    onStartEdit: (record: UserData) => void;
    pagination?: any;
}

export const UserTable = React.memo(({
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
    onUpdate,
    onStartEdit,
    pagination
}: UserTableProps) => {
    const [courseModalVisible, setCourseModalVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [courseSearchText, setCourseSearchText] = useState('');

    const { columns } = useUserTableColumns({
        editingKeys,
        roles,
        onUpdate,
        onStartEdit,
        setSelectedUserId,
        setCourseModalVisible
    });


    const rowSelection = useMemo(() => (isDeleteMode || isBatchEditMode) ? {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: 50,
    } : undefined, [isDeleteMode, isBatchEditMode, selectedRowKeys, onSelectChange]);

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
                scroll={{ x: 2000, y: 600 }}
                virtual
                bordered
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
});