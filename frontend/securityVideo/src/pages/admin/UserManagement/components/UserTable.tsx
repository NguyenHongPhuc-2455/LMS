import React, { useState, useMemo, useEffect } from 'react';
import { Table, Space, Typography, Badge, Avatar, Input, Popconfirm, Button, Modal, Tabs, message, Spin, Skeleton } from 'antd';
import { UsergroupAddOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import styles from '../UserManagement.module.scss';
import type { User as UserData, Role as RoleData } from '../../../../types/user';
import { userService } from '../../../../services/user.service';


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
    onRevokeProgramAccess: (userId: number, programId: number) => void;
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
    onRevokeProgramAccess,
    onRowClick,
    onRefresh,
    pagination
}: UserTableProps) => {
    const [courseModalVisible, setCourseModalVisible] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
    const [courseSearchText, setCourseSearchText] = useState('');

    const [modalLoading, setModalLoading] = useState(false);
    const [enrolledCourses, setEnrolledCourses] = useState<{ id: number; title: string }[]>([]);
    const [enrolledPrograms, setEnrolledPrograms] = useState<{ id: number; title: string }[]>([]);

    const { columns } = useUserTableColumns({
        positions,
        setSelectedUserId,
        setCourseModalVisible,
        onRefresh
    });

    const isFirstLoad = loading && (!users || users.length === 0);

    const displayData = useMemo(() => {
        if (isFirstLoad) {
            return Array.from({ length: 5 }).map((_, index) => ({ id: `dummy-${index}`, isDummy: true } as any));
        }
        return users;
    }, [users, isFirstLoad]);

    const skeletonColumns = useMemo(() => {
        if (!isFirstLoad) return columns;
        return columns.map(col => ({
            ...col,
            render: (value: any, record: any, index: number) => {
                if (record.isDummy) {
                    return <Skeleton.Button active size="small" style={{ width: '80%', height: 16 }} />;
                }
                return col.render ? (col.render as any)(value, record, index) : value;
            }
        }));
    }, [columns, isFirstLoad]);

    const rowSelection = useMemo(() => {
        if (isFirstLoad) return undefined;
        return isDeleteMode ? {
            selectedRowKeys,
            onChange: onSelectChange,
            columnWidth: 50,
        } : undefined;
    }, [isDeleteMode, selectedRowKeys, onSelectChange, isFirstLoad]);

    const selectedUser = users.find(u => u.id === selectedUserId);

    useEffect(() => {
        if (selectedUserId && courseModalVisible) {
            setModalLoading(true);
            userService.getLearningAccess(selectedUserId)
                .then(res => {
                    setEnrolledCourses(res.enrolled_courses || []);
                    setEnrolledPrograms(res.enrolled_programs || []);
                })
                .catch(() => {
                    message.error('Lỗi khi tải danh sách quyền học tập');
                })
                .finally(() => {
                    setModalLoading(false);
                });
        } else {
            setEnrolledCourses([]);
            setEnrolledPrograms([]);
        }
    }, [selectedUserId, courseModalVisible, selectedUser?.enrollments_count, selectedUser?.programs_count]);

    const filteredUserCourses = enrolledCourses.filter(c =>
        c.title.toLowerCase().includes(courseSearchText.toLowerCase())
    );

    const filteredUserPrograms = enrolledPrograms.filter((p: any) =>
        p.title.toLowerCase().includes(courseSearchText.toLowerCase())
    );

    return (
        <>
            <Table
                columns={skeletonColumns}
                dataSource={displayData}
                rowKey="id"
                loading={isFirstLoad ? false : loading}
                rowSelection={rowSelection}
                pagination={isFirstLoad ? false : pagination}
                rowClassName={() => 'premium-row'}
                onRow={(record) => ({
                    onClick: (event) => {
                        if (record.isDummy) return;
                        // Avoid triggering when clicking buttons, switches, or modal content
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
                    style: { cursor: record.isDummy ? 'default' : 'pointer' }
                })}
                scroll={{ x: 1500 }}
                bordered
            />

            <Modal
                title={
                    <Space>
                        <UsergroupAddOutlined />
                        <span>Quản lý học tập: <Text strong>{selectedUser?.full_name || selectedUser?.username}</Text></span>
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
                destroyOnClose
            >
                <Spin spinning={modalLoading}>
                    <div style={{ marginBottom: 16 }}>
                        <Input
                            placeholder="Tìm kiếm khóa học hoặc lộ trình của học viên..."
                            prefix={<BookOutlined />}
                            value={courseSearchText}
                            onChange={e => setCourseSearchText(e.target.value)}
                            allowClear
                        />
                    </div>
                    <Tabs
                        defaultActiveKey="courses"
                        items={[
                            {
                                key: 'courses',
                                label: `Khóa học (${filteredUserCourses.length})`,
                                children: (
                                    <div style={{ maxHeight: '350px', overflowY: 'auto', paddingTop: 8 }}>
                                        {filteredUserCourses.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {filteredUserCourses.map(course => (
                                                    <div key={course.id} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '12px',
                                                        background: 'rgba(0,0,0,0.02)',
                                                         borderRadius: '5px',
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
                                )
                            },
                            {
                                key: 'programs',
                                label: `Lộ trình học (${filteredUserPrograms.length})`,
                                children: (
                                    <div style={{ maxHeight: '350px', overflowY: 'auto', paddingTop: 8 }}>
                                        {filteredUserPrograms.length > 0 ? (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {filteredUserPrograms.map(program => (
                                                    <div key={program.id} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '12px',
                                                        background: 'rgba(0,0,0,0.02)',
                                                         borderRadius: '5px',
                                                        border: '1px solid rgba(0,0,0,0.05)'
                                                    }}>
                                                        <Text strong>{program.title}</Text>
                                                        <Popconfirm
                                                            title="Thu hồi quyền truy cập"
                                                            description="Học viên sẽ không còn thấy lộ trình học này?"
                                                            onConfirm={() => onRevokeProgramAccess(selectedUserId!, program.id)}
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
                                                <Text type="secondary">Không tìm thấy lộ trình học nào</Text>
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />
                </Spin>
            </Modal>
        </>
    );
});