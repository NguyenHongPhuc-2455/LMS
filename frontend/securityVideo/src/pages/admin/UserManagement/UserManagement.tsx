import { useState, useEffect, useCallback } from 'react';
import {
    Button, Space, Tag,
    message, Typography, Card, Modal, Input, Tooltip
} from 'antd';
import {
    DeleteOutlined, SaveOutlined, CloseOutlined,
    PlusOutlined, EditOutlined, SearchOutlined, ReloadOutlined
} from '@ant-design/icons';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../../services/user.service';
import styles from './UserManagement.module.scss';
import type { User as UserData, Role as RoleData } from '../../../types/user';
export type { UserData, RoleData };

// New specialized components
import { UserTable } from './components/UserTable';
import { UserFormModal } from './components/UserFormModal';

const { Title, Text } = Typography;



export default function UserManagement() {
    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
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
        queryKey: ['users', page, pageSize, debouncedSearch],
        queryFn: () => userService.getAll({ page, limit: pageSize, search: debouncedSearch }),
        placeholderData: (previousData) => previousData,
    });

    const { data: rolesData } = useQuery({
        queryKey: ['roles'],
        queryFn: userService.getRoles,
        staleTime: Infinity, // Role dữ liệu tĩnh, không cần fetch lại thường xuyên
    });

    const users = usersData?.users || [];
    const total = usersData?.total || 0;
    const roles = rolesData || [];
    const loading = usersLoading || actionLoading;

    // React Query Client for invalidation
    const queryClient = useQueryClient();

    // Selection & Edit State
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [editingKeys, setEditingKeys] = useState<React.Key[]>([]);
    const [editData, setEditData] = useState<Record<number, any>>({});

    // Modes
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isBatchEditMode, setIsBatchEditMode] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const resetStates = () => {
        setEditingKeys([]);
        setEditData({});
        setSelectedRowKeys([]);
        setIsDeleteMode(false);
        setIsBatchEditMode(false);
    };

    const handleBatchSave = async () => {
        if (isDeleteMode) {
            if (selectedRowKeys.length === 0) return;
            Modal.confirm({
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
            return;
        }

        // Handle Batch Edit
        const changeCount = Object.keys(editData).length;
        if (changeCount === 0) {
            resetStates();
            return;
        }

        setActionLoading(true);
        try {
            // Chuyển đổi dữ liệu batch edit phù hợp với API
            const payload = Object.entries(editData).map(([id, data]) => ({
                id: parseInt(id),
                ...data
            }));

            await userService.updateBatch(payload);
            message.success('Đã lưu thay đổi hàng loạt');
            queryClient.invalidateQueries({ queryKey: ['users'] });
            resetStates();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi lưu thay đổi');
        } finally {
            setActionLoading(false);
        }
    };

    const startBatchEdit = () => {
        if (selectedRowKeys.length === 0) {
            message.warning('Vui lòng chọn ít nhất 1 thành viên để sửa');
            return;
        }
        setEditingKeys(selectedRowKeys);
        const newEditData = { ...editData };
        selectedRowKeys.forEach(id => {
            if (!newEditData[id as number]) {
                const user = users.find(u => u.id === id);
                if (user) {
                    const { roles: userRoles, ...rest } = user;
                    const firstRole = userRoles?.[0];
                    const roleId = (firstRole && typeof firstRole === 'object') ? firstRole.id : undefined;
                    newEditData[id as number] = { ...rest, role_id: roleId, gender: user.gender };
                }
            }
        });
        setEditData(newEditData);
        setIsBatchEditMode(false); // Close the selection mode
    };

    const startRowEditing = useCallback((record: UserData) => {
        setIsDeleteMode(false);
        setIsBatchEditMode(false);
        
        setEditingKeys(prev => {
            if (prev.includes(record.id)) return prev;
            return [...prev, record.id];
        });

        setEditData(prev => {
            if (prev[record.id]) return prev;
            const { roles: userRoles, ...rest } = record;
            const firstRole = userRoles?.[0];
            const roleId = (firstRole && typeof firstRole === 'object') ? firstRole.id : undefined;
            return { ...prev, [record.id]: { ...rest, role_id: roleId } };
        });
    }, []);

    const updateEditData = useCallback((id: number, field: string, value: any) => {
        setEditData(prev => ({
            ...prev,
            [id]: {
                ...prev[id],
                [field]: value
            }
        }));
    }, []);

    const handleCreateFinish = async (values: any) => {
        try {
            setActionLoading(true);
            await userService.create(values);
            message.success('Tạo người dùng mới thành công');
            setIsCreateModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi lưu dữ liệu');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRevokeAccess = async (userId: number, courseId: number) => {
        try {
            setActionLoading(true);
            await userService.revokeCourse(userId, courseId);
            message.success('Đã thu hồi quyền truy cập khóa học thành công');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi khi thu hồi quyền truy cập');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className={styles.userManagementContainer} >
            <div className={styles.userManagementHeader}>
                <div className={styles.headerInfo}>
                    <Title level={4} className={styles.headerTitle}>Quản lý người dùng</Title>
                    <Text type="secondary">Quản lý, phân quyền và chỉnh sửa thông tin hàng loạt</Text>
                </div>
            </div>

            <Card className="glass-card">
                <div className={styles.searchBarWrapper}>
                    <div className={styles.headerLeft}>
                        {editingKeys.length > 0 && (
                            <Tag color="processing" icon={<EditOutlined />} className="edit-mode-tag">
                                Đang chỉnh sửa {editingKeys.length} người
                            </Tag>
                        )}
                        {isDeleteMode && (
                            <Tag color="error" className={styles.deleteModeTag}>
                                Đang chọn {selectedRowKeys.length} người để xóa
                            </Tag>
                        )}
                        {isBatchEditMode && (
                            <Tag color="warning" className="edit-mode-tag">
                                Chọn người dùng để sửa hàng loạt ({selectedRowKeys.length})
                            </Tag>
                        )}
                    </div>

                    <Space className={styles.searchBarContainer}>
                        <Input
                            placeholder="Tìm kiếm theo tên, email hoặc username..."
                            prefix={<SearchOutlined className={styles.searchIcon} />}
                            onPressEnter={e => {
                                setSearch(e.currentTarget.value);
                                setPage(1);
                            }}
                            onChange={e => {
                                if (e.target.value === '') {
                                    setSearch('');
                                    setPage(1);
                                }
                            }}
                            className={styles.searchBar}
                            allowClear
                        />
                        {(editingKeys.length > 0 || isDeleteMode || isBatchEditMode) ? (
                            <Space>
                                {isBatchEditMode ? (
                                    <Button
                                        type="primary"
                                        icon={<EditOutlined />}
                                        onClick={startBatchEdit}
                                        disabled={selectedRowKeys.length === 0}
                                    >
                                        Bắt đầu sửa ({selectedRowKeys.length})
                                    </Button>
                                ) : (
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        onClick={handleBatchSave}
                                        loading={loading}
                                        className={styles.saveBatchBtn}
                                    >
                                        Lưu {isDeleteMode ? 'Xóa' : 'Thay đổi'}
                                    </Button>
                                )}
                                <Button icon={<CloseOutlined />} onClick={resetStates}>Hủy</Button>
                            </Space>
                        ) : (
                            <Space>
                                <Button
                                    icon={<EditOutlined />}
                                    onClick={() => setIsBatchEditMode(true)}
                                >
                                    Sửa hàng loạt
                                </Button>
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
                                    onClick={() => setIsCreateModalOpen(true)}
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
                    loading={loading}
                    editingKeys={editingKeys}
                    setEditingKeys={setEditingKeys}
                    editData={editData}
                    setEditData={setEditData}
                    isDeleteMode={isDeleteMode}
                    isBatchEditMode={isBatchEditMode}
                    selectedRowKeys={selectedRowKeys}
                    onSelectChange={setSelectedRowKeys}
                    onRevokeAccess={handleRevokeAccess}
                    onUpdate={updateEditData}
                    onStartEdit={startRowEditing}
                    pagination={{
                        current: page,
                        pageSize: pageSize,
                        total: total,
                        onChange: (p, s) => {
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
                    }}
                />
            </Card>

            <UserFormModal
                open={isCreateModalOpen}
                onCancel={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateFinish}
                roles={roles}
                loading={loading}
            />
        </div>
    );
}


