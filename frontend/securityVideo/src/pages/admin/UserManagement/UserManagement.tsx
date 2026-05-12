import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Button, Space, Tag,
    message, Typography, Card, Modal, Input, Select,
    App
} from 'antd';
import {
    DeleteOutlined, SaveOutlined, CloseOutlined,
    PlusOutlined, EditOutlined, SearchOutlined
} from '@ant-design/icons';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../services/user.service';
import { departmentService } from '../../../services/department.service';
import styles from './UserManagement.module.scss';
import type { User as UserData, Role as RoleData } from '../../../types/user';
export type { UserData, RoleData };

// New specialized components
import { UserTable } from './components/UserTable';
import { UserFormModal } from './components/UserFormModal';

const { Title, Text } = Typography;

export default function UserManagement() {
    const { message, modal } = App.useApp();
    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [departmentId, setDepartmentId] = useState<number | undefined>(undefined);
    const [actionLoading, setActionLoading] = useState(false);

    // Debounce Logic
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search
        }, 500);

        return () => clearTimeout(handler);
    }, [search]);

    // React Query
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['users', page, pageSize, debouncedSearch, departmentId],
        queryFn: () => userService.getAll({ page, limit: pageSize, search: debouncedSearch, department_id: departmentId }),
        placeholderData: (previousData) => previousData,
    });

    const { data: rolesData } = useQuery({
        queryKey: ['roles'],
        queryFn: userService.getRoles,
        staleTime: Infinity,
    });

    const { data: departmentsData } = useQuery({
        queryKey: ['departments'],
        queryFn: departmentService.getAll,
        staleTime: 5 * 60 * 1000,
    });

    const users = usersData?.users || [];
    const total = usersData?.total || 0;
    const roles = rolesData || [];
    const departments = departmentsData || [];
    const loading = usersLoading || actionLoading;

    // React Query Client for invalidation
    const queryClient = useQueryClient();

    // Selection State
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [isDeleteMode, setIsDeleteMode] = useState(false);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);

    const resetStates = () => {
        setSelectedRowKeys([]);
        setIsDeleteMode(false);
    };

    const handleBatchDelete = async () => {
        if (selectedRowKeys.length === 0) return;
        modal.confirm({
            title: `Xác nhận xóa ${selectedRowKeys.length} thành viên?`,
            content: 'Hành động này không thể hoàn tác.',
            onOk: async () => {
                try {
                    setActionLoading(true);
                    await userService.deleteBatch(selectedRowKeys as number[]);
                    message.success(`Đã xóa thành công ${selectedRowKeys.length} thành viên`);
                    queryClient.invalidateQueries({ queryKey: ['users'] });
                    resetStates();
                } catch (e: any) {
                    message.error('Lỗi khi xóa một số thành viên');
                } finally {
                    setActionLoading(false);
                }
            }
        });
    };

    const handleOpenCreate = () => {
        setEditingUser(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = useCallback((user: UserData) => {
        setEditingUser(user);
        setIsModalOpen(true);
    }, []);

    const handleModalFinish = async (values: any) => {
        try {
            setActionLoading(true);
            if (editingUser) {
                await userService.updateUser(editingUser.id, values);
                message.success('Cập nhật thông tin thành công');
            } else {
                await userService.create(values);
                message.success('Tạo người dùng mới thành công');
            }
            setIsModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi xử lý dữ liệu');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevokeAccess = useCallback(async (userId: number, courseId: number) => {
        try {
            setActionLoading(true);
            await userService.revokeCourse(userId, courseId);
            message.success('Đã thu hồi quyền truy cập thành công');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi khi thu hồi quyền');
        } finally {
            setActionLoading(false);
        }
    }, [queryClient, message]);

    const paginationConfig = useMemo(() => ({
        current: page,
        pageSize: pageSize,
        total: total,
        onChange: (p: number, s: number) => {
            setPage(p);
            setPageSize(s);
        },
        showSizeChanger: true,
        pageSizeOptions: ['10', '20', '50', '100'],
        selectProps: { showSearch: false },
        itemRender: (current: number, type: string, originalElement: any) => {
            if (type === 'page') {
                return <a>{current < 10 ? `0${current}` : current}</a>;
            }
            return originalElement;
        }
    }), [page, pageSize, total]);

    return (
        <div className={styles.userManagementContainer} >
            <div className={styles.userManagementHeader}>
                <div className={styles.headerInfo}>
                    <Title level={4} className={styles.headerTitle}>Quản lý nhân sự</Title>
                    <Text type="secondary">Quản lý thông tin học viên, nhân viên và phân quyền hệ thống</Text>
                </div>
            </div>

            <Card className="glass-card">
                <div className={styles.searchBarWrapper}>
                    <div className={styles.headerLeft}>
                        <Input
                            placeholder="Tìm kiếm tên, email, username..."
                            prefix={<SearchOutlined className={styles.searchIcon} />}
                            onChange={e => setSearch(e.target.value)}
                            value={search}
                            className={styles.searchBar}
                            allowClear
                        />
                        <Select
                            placeholder="Lọc theo phòng ban"
                            style={{ width: 200 }}
                            allowClear
                            onChange={(val) => {
                                setDepartmentId(val);
                                setPage(1);
                            }}
                            options={departments.map((d: any) => ({ value: d.id, label: d.name }))}
                        />
                        {isDeleteMode && (
                            <Tag color="error" className={styles.deleteModeTag}>
                                Chọn {selectedRowKeys.length} người để xóa
                            </Tag>
                        )}
                    </div>

                    <Space className={styles.searchBarContainer}>
                        {isDeleteMode ? (
                            <Space>
                                <Button
                                    type="primary"
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={handleBatchDelete}
                                    loading={loading}
                                    disabled={selectedRowKeys.length === 0}
                                >
                                    Xác nhận xóa ({selectedRowKeys.length})
                                </Button>
                                <Button icon={<CloseOutlined />} onClick={resetStates}>Hủy</Button>
                            </Space>
                        ) : (
                            <Space>
                                <Button
                                    danger
                                    icon={<DeleteOutlined />}
                                    onClick={() => setIsDeleteMode(true)}
                                >
                                    Xóa nhiều
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={handleOpenCreate}
                                    className={styles.adminAddButton}
                                >
                                    Thêm thành viên
                                </Button>
                            </Space>
                        )}
                    </Space>
                </div>

                <UserTable
                    users={users}
                    roles={roles}
                    departments={departments}
                    loading={loading}
                    isDeleteMode={isDeleteMode}
                    selectedRowKeys={selectedRowKeys}
                    onSelectChange={setSelectedRowKeys}
                    onRevokeAccess={handleRevokeAccess}
                    onRowClick={handleOpenEdit}
                    pagination={paginationConfig}
                />
            </Card>

            <UserFormModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onSuccess={handleModalFinish}
                roles={roles}
                departments={departments}
                loading={loading}
                initialValues={editingUser}
            />
        </div>
    );
}
