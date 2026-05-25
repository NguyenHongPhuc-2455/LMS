import React, { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import {
    Button, Space, Tag,
    Typography, Card, Input, Select,
    App, Switch
} from 'antd';
import {
    DeleteOutlined, CloseOutlined,
    PlusOutlined, SearchOutlined, DownloadOutlined
} from '@ant-design/icons';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { userService } from '../../../services/user.service';
import { departmentService } from '../../../services/department.service';
import { positionService } from '../../../services/position.service';
import styles from './UserManagement.module.scss';
import type { User as UserData, Role as RoleData } from '../../../types/user';
export type { UserData, RoleData };

// New specialized components
import { UserTable } from './components/UserTable';
import { UserFormModal } from './components/UserFormModal';

const { Title, Text } = Typography;
const EMPTY_ARRAY: any[] = [];

const SearchInput = React.memo(({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        const handler = setTimeout(() => {
            onChange(localValue);
        }, 400);
        return () => clearTimeout(handler);
    }, [localValue, onChange]);

    return (
        <Input
            placeholder="Tìm kiếm tên, email, username..."
            prefix={<SearchOutlined className={styles.searchIcon} />}
            onChange={e => setLocalValue(e.target.value)}
            value={localValue}
            className={styles.searchBar}
            allowClear
        />
    );
});

export default function UserManagement() {
    const { message, modal } = App.useApp();
    const [searchParams, setSearchParams] = useSearchParams();

    // Lấy thông tin user từ localStorage để kiểm tra role
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const userRoles = currentUser?.roles || EMPTY_ARRAY;
    const roleNames = userRoles.map((r: any) => {
        const name = typeof r === 'string' ? r : r.name;
        return name?.toLowerCase();
    });
    const isManagerOnly = roleNames.includes('manager') && !roleNames.includes('admin');

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Đồng bộ departmentId từ URL
    const urlDeptId = searchParams.get('departmentId');
    const [departmentId, setDepartmentId] = useState<number | undefined>(
        urlDeptId ? parseInt(urlDeptId) : undefined
    );
    const [positionId, setPositionId] = useState<number | undefined>();
    const [includeInactive, setIncludeInactive] = useState(false);

    const [actionLoading, setActionLoading] = useState(false);

    // Cascading states cho lọc bộ phận 3 cấp
    const [selectedLevel1, setSelectedLevel1] = useState<number | null | undefined>();
    const [selectedLevel2, setSelectedLevel2] = useState<number | null | undefined>();
    const [selectedLevel3, setSelectedLevel3] = useState<number | null | undefined>();

    // React Query
    const { data: usersData, isLoading: usersLoading } = useQuery({
        queryKey: ['users', page, pageSize, debouncedSearch, departmentId, positionId, includeInactive],
        queryFn: () => userService.getAll({
            page,
            limit: pageSize,
            search: debouncedSearch,
            department_id: departmentId,
            position_id: positionId,
            include_inactive: includeInactive
        }),
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

    const { data: positionsData } = useQuery({
        queryKey: ['positions'],
        queryFn: positionService.getAll,
        staleTime: 5 * 60 * 1000,
    });

    // Khi URL thay đổi (ví dụ bấm từ sidebar), cập nhật lại state local
    useEffect(() => {
        const id = searchParams.get('departmentId');
        // Nếu là Manager, ép buộc về phòng ban của mình, bỏ qua URL khác
        if (isManagerOnly && currentUser?.department_id) {
            const managerDeptId = currentUser.department_id;
            if (!id || parseInt(id) !== managerDeptId) {
                searchParams.set('departmentId', managerDeptId.toString());
                setSearchParams(searchParams, { replace: true });
            }
            setDepartmentId(managerDeptId);
        } else {
            setDepartmentId(id ? parseInt(id) : undefined);
        }
        setPage(1);
    }, [searchParams]);

    // Đồng bộ ngược từ departmentId (ví dụ URL đổi hoặc reset) sang 3 cấp dropdown
    useEffect(() => {
        if (departmentId && departmentsData && departmentsData.length > 0) {
            const currentDept = departmentsData.find((d: any) => d.id === departmentId);
            if (currentDept) {
                if (!currentDept.parent_id) {
                    setSelectedLevel1(currentDept.id);
                    setSelectedLevel2(null);
                    setSelectedLevel3(null);
                } else {
                    const parentDept = departmentsData.find((d: any) => d.id === currentDept.parent_id);
                    if (parentDept) {
                        if (!parentDept.parent_id) {
                            setSelectedLevel1(parentDept.id);
                            setSelectedLevel2(currentDept.id);
                            setSelectedLevel3(null);
                        } else {
                            const grandParentDept = departmentsData.find((d: any) => d.id === parentDept.parent_id);
                            if (grandParentDept) {
                                setSelectedLevel1(grandParentDept.id);
                                setSelectedLevel2(parentDept.id);
                                setSelectedLevel3(currentDept.id);
                            }
                        }
                    }
                }
            }
        } else if (!departmentId) {
            setSelectedLevel1(null);
            setSelectedLevel2(null);
            setSelectedLevel3(null);
        }
    }, [departmentId, departmentsData]);


    const users = usersData?.users || EMPTY_ARRAY;
    const total = usersData?.total || 0;
    const roles = rolesData || EMPTY_ARRAY;
    const departments = departmentsData || EMPTY_ARRAY;
    const positions = positionsData || EMPTY_ARRAY;
    const loading = usersLoading || actionLoading;

    const queryClient = useQueryClient();

    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['users'] });
    }, [queryClient]);


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

    const exportAllUsers = async () => {
        try {
            setActionLoading(true);
            const XLSX = await import('xlsx');
            const response = await userService.getAll({
                page: 1,
                limit: 9999,
                search: debouncedSearch,
                department_id: departmentId,
                position_id: positionId,
                include_inactive: includeInactive
            });

            const dataToExport = response.users.map((u: any) => ({
                'Mã nhân sự': u.employee_id || '',
                'Họ và tên': u.full_name,
                'Username': u.username,
                'Email': u.email || '',
                'Số điện thoại': u.phone || '',
                'Phòng ban': u.department || 'Chưa phân phòng',
                'Vị trí chức danh': u.position || '',
                'Ngày nhận việc': u.join_date ? new Date(u.join_date).toLocaleDateString('vi-VN') : '',
                'Vai trò': u.roles?.map((r: any) => r.title || r.name).join(', ') || '',
                'Khóa học đăng ký': u.enrollments_count || 0,
                'Trạng thái': u.deleted_at ? 'Tạm khóa' : 'Đang hoạt động'
            }));

            const worksheet = XLSX.utils.json_to_sheet(dataToExport);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách nhân sự');

            XLSX.writeFile(workbook, `danh_sach_nhan_su_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.xlsx`);
        } catch (e) {
            console.error('Lỗi xuất excel:', e);
            message.error('Không thể xuất danh sách nhân sự');
        } finally {
            setActionLoading(false);
        }
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

    const handleRevokeProgramAccess = useCallback(async (userId: number, programId: number) => {
        try {
            setActionLoading(true);
            await userService.revokeProgram(userId, programId);
            message.success('Đã thu hồi quyền truy cập lộ trình thành công');
            queryClient.invalidateQueries({ queryKey: ['users'] });
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi khi thu hồi quyền lộ trình');
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
                return React.cloneElement(originalElement, {
                    children: current < 10 ? `0${current}` : current
                });
            }
            return originalElement;
        }
    }), [page, pageSize, total]);

    // Cập nhật URL khi người dùng chọn lọc trên UI
    const handleDepartmentChange = (val: number | undefined) => {
        startTransition(() => {
            if (val) {
                searchParams.set('departmentId', val.toString());
            } else {
                searchParams.delete('departmentId');
            }
            setSearchParams(searchParams);
        });
    };

    const handleLevel1Change = (val: number | null | undefined) => {
        const actualVal = val === null ? undefined : val;
        setSelectedLevel1(val);
        setSelectedLevel2(null);
        setSelectedLevel3(null);
        handleDepartmentChange(actualVal);
    };

    const handleLevel2Change = (val: number | null | undefined) => {
        const actualVal = val === null ? undefined : val;
        setSelectedLevel2(val);
        setSelectedLevel3(null);
        handleDepartmentChange(actualVal || selectedLevel1 || undefined);
    };

    const handleLevel3Change = (val: number | null | undefined) => {
        const actualVal = val === null ? undefined : val;
        setSelectedLevel3(val);
        handleDepartmentChange(actualVal || selectedLevel2 || undefined);
    };

    return (
        <div className={styles.userManagementContainer} >
            {/* <div className={styles.userManagementHeader}>
                <div className={styles.headerInfo}>
                    <Title level={4} className={styles.headerTitle}>Quản lý nhân sự</Title>
                    <Text type="secondary">Quản lý thông tin học viên, nhân viên và phân quyền hệ thống</Text>
                </div>
            </div> */}

            <Card className="glass-card">
                <div className={styles.searchBarWrapper}>
                    <div className={styles.headerLeft}>
                        <SearchInput
                            value={debouncedSearch}
                            onChange={(val) => {
                                setDebouncedSearch(val);
                                setPage(1);
                            }}
                        />
                        {/* Manager không được đổi phòng ban - ẩn dropdown, chỉ hiển thị label tên phòng ban */}
                        {isManagerOnly ? (
                            <span style={{ padding: '0 8px', color: '#666', fontStyle: 'italic', fontSize: 13 }}>
                                Phòng ban: <strong style={{ color: '#C72127' }}>
                                    {departments.find((d: any) => d.id === departmentId)?.name || '...'}
                                </strong>
                            </span>
                        ) : (
                            <Space size={8} style={{ display: 'flex', alignItems: 'center' }}>
                                <Select
                                    placeholder="Chọn Khối"
                                    style={{ width: 140 }}
                                    allowClear
                                    value={selectedLevel1}
                                    onChange={handleLevel1Change}
                                    options={[
                                        { value: null as any, label: 'Tất cả' },
                                        ...departments.filter((d: any) => !d.parent_id).map((d: any) => ({ value: d.id, label: d.name }))
                                    ]}
                                />
                                <Select
                                    placeholder="Chọn Phòng ban"
                                    style={{ width: 150 }}
                                    allowClear
                                    disabled={!selectedLevel1}
                                    value={selectedLevel2}
                                    onChange={handleLevel2Change}
                                    options={[
                                        { value: null as any, label: 'Tất cả' },
                                        ...departments.filter((d: any) => d.parent_id === selectedLevel1).map((d: any) => ({ value: d.id, label: d.name }))
                                    ]}
                                />
                                <Select
                                    placeholder="Chọn Tổ/Nhóm"
                                    style={{ width: 140 }}
                                    allowClear
                                    disabled={!selectedLevel2}
                                    value={selectedLevel3}
                                    onChange={handleLevel3Change}
                                    options={[
                                        { value: null as any, label: 'Tất cả' },
                                        ...departments.filter((d: any) => d.parent_id === selectedLevel2).map((d: any) => ({ value: d.id, label: d.name }))
                                    ]}
                                />
                            </Space>
                        )}
                        <Select
                            placeholder="Lọc theo vị trí"
                            style={{ width: 180 }}
                            allowClear
                            value={positionId}
                            onChange={(val) => { setPositionId(val); setPage(1); }}
                            options={positions.map((p: any) => ({ value: p.id, label: p.name }))}
                        />
                        {isDeleteMode && (
                            <Tag color="error" className={styles.deleteModeTag}>
                                Chọn {selectedRowKeys.length} người để xóa
                            </Tag>
                        )}
                    </div>

                    <div className={styles.headerRight}>
                        <Space size={16}>
                            <div className={styles.inactiveToggle}>
                                <Text className={styles.toggleLabel}>Hiện tất cả NS</Text>
                                <Switch
                                    size="small"
                                    checked={includeInactive}
                                    onChange={setIncludeInactive}
                                />
                            </div>

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
                                        Xóa
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<PlusOutlined />}
                                        onClick={handleOpenCreate}
                                        className={styles.adminAddButton}
                                    >
                                        Thêm
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<DownloadOutlined />}
                                        onClick={exportAllUsers}
                                        loading={loading}
                                        style={{ background: '#B8121A', borderColor: '#B8121A', borderRadius: 8 }}
                                    >
                                        Xuất File
                                    </Button>
                                </Space>
                            )}
                        </Space>
                    </div>
                </div>

                <UserTable
                    users={users}
                    roles={roles}
                    departments={departments}
                    positions={positions}
                    loading={loading}
                    isDeleteMode={isDeleteMode}
                    selectedRowKeys={selectedRowKeys}
                    onSelectChange={setSelectedRowKeys}
                    onRevokeAccess={handleRevokeAccess}
                    onRevokeProgramAccess={handleRevokeProgramAccess}
                    onRowClick={handleOpenEdit}
                    onRefresh={handleRefresh}
                    pagination={paginationConfig}
                />
            </Card>

            {isModalOpen && (
                <UserFormModal
                    open={isModalOpen}
                    onCancel={useCallback(() => setIsModalOpen(false), [])}
                    onSuccess={handleModalFinish}
                    roles={roles}
                    departments={departments}
                    positions={positions}
                    loading={loading}
                    initialValues={editingUser}
                />
            )}
        </div>
    );
}
