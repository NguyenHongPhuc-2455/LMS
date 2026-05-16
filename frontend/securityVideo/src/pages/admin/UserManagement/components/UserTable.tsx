import React, { useState, useMemo } from 'react';
import { Table, Space, Typography, Badge, Avatar, Input, Popconfirm, Button, Modal } from 'antd';
import { UsergroupAddOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import styles from '../UserManagement.module.scss';
import type { User as UserData, Role as RoleData } from '../../../../types/user';


// Sub-components & Hooks
import { useUserTableColumns } from '../hooks/useUserTableColumns';

const { Text } = Typography;

interface UserTableProps {
    users: UserData[];
    roles: RoleData[];
    departments: any[];
    positions: any[];
    loading: boolean;
    isDeleteMode: boolean;
    selectedRowKeys: React.Key[];
    onSelectChange: (keys: React.Key[]) => void;
    onRevokeAccess: (userId: number, courseId: number) => void;
    onRowClick: (record: UserData) => void;
    onRefresh: () => void;
    pagination?: any;
}

export const UserTable = React.memo(({
    users,
    roles,
    departments,
    positions,
    loading,
    isDeleteMode,
    selectedRowKeys,
    onSelectChange,
    onRevokeAccess,
    onRowClick,
    onRefresh,
    pagination
}: UserTableProps) => {
    const [courseModalVisible, setCourseModalVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [courseSearchText, setCourseSearchText] = useState('');

    const { columns } = useUserTableColumns({
        roles,
        departments,
        positions,
        setSelectedUserId,
        setCourseModalVisible,
        onRefresh
    });

    const rowSelection = useMemo(() => isDeleteMode ? {
        selectedRowKeys,
        onChange: onSelectChange,
        columnWidth: 50,
    } : undefined, [isDeleteMode, selectedRowKeys, onSelectChange]);

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
                rowClassName={() => 'premium-row'}
                onRow={(record) => ({
                    onClick: (event) => {
                        // Tránh trigger khi bấm vào nút hoặc checkbox
                        const target = event.target as HTMLElement;
                        if (
                            target.closest('.ant-table-selection-column') ||
                            target.closest('button') ||
                            target.closest('.ant-switch') ||
                            target.closest('a') ||
                            target.closest('.ant-modal')
                        ) {
                            return;
                        }
                        onRowClick(record);
                    },
                    style: { cursor: 'pointer' }
                })}
                scroll={{ x: 1800, y: 600 }}
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
                onCancel={(e) => {
                    e.stopPropagation();
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
                        prefix={<BookOutlined />}
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
                                        description="Học viên sẽ không còn thấy khóa học này?"
                                        onConfirm={() => onRevokeAccess(selectedUserId!, course.id)}
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
                            <Text type="secondary">Không tìm thấy khóa học nào</Text>
                        </div>
                    )}
                </div>
            </Modal>
        </>
    );
});