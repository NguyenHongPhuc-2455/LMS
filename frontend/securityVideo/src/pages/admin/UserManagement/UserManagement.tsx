import { useEffect, useState } from 'react';
import {
    Button, Space, Tag,
    message, Typography, Card, Modal
} from 'antd';
import {
    DeleteOutlined, SaveOutlined, CloseOutlined,
    PlusOutlined, EditOutlined, UsergroupAddOutlined
} from '@ant-design/icons';

import { userService } from '../../../services/user.service';
import styles from './UserManagement.module.scss';

// New specialized components
import UserStatistics from './components/UserStatistics';
import UserTable from './components/UserTable';
import UserFormModal from './components/UserFormModal';

const { Title, Text } = Typography;

interface RoleData {
    id: number;
    name: string;
    description: string;
}

interface UserData {
    id: number;
    username: string;
    email: string;
    full_name: string;
    avatar?: string;
    phone?: string;
    dob?: string;
    gender?: string;
    bio?: string;
    roles: RoleData[];
    created_at: string;
    updated_at: string;
    enrollments_count: number;
    enrolled_courses: string[];
}

export default function UserManagement() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [roles, setRoles] = useState<RoleData[]>([]);
    const [loading, setLoading] = useState(false);

    // Selection & Edit State
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [editingKeys, setEditingKeys] = useState<React.Key[]>([]);
    const [editData, setEditData] = useState<Record<number, any>>({});

    // Modes
    const [isDeleteMode, setIsDeleteMode] = useState(false);
    const [isBatchEditMode, setIsBatchEditMode] = useState(false);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [usersData, rolesData] = await Promise.all([
                userService.getAll(),
                userService.getRoles()
            ]);
            setUsers(usersData);
            setRoles(rolesData);
        } catch (error: any) {
            message.error('Lỗi khi tải dữ liệu hệ thống');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
                        setLoading(true);
                        for (const key of selectedRowKeys) {
                            await userService.delete(Number(key));
                        }
                        message.success(`Đã xóa thành công ${selectedRowKeys.length} thành viên`);
                        resetStates();
                        await fetchData();
                    } catch (e: any) {
                        message.error('Lỗi khi xóa một số thành viên');
                    } finally {
                        setLoading(false);
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

        setLoading(true);
        try {
            const payload = Object.entries(editData).map(([id, data]) => ({
                id,
                ...data
            }));

            await userService.batchUpdate({ users: payload });

            message.success(`Đã cập nhật ${payload.length} thành viên thành công`);
            resetStates();
            await fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi lưu thay đổi');
        } finally {
            setLoading(false);
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
                    newEditData[id as number] = { ...rest, role_id: userRoles[0]?.id };
                }
            }
        });
        setEditData(newEditData);
        setIsBatchEditMode(false); // Close the selection mode
    };

    const handleCreateFinish = async (values: any) => {
        try {
            setLoading(true);
            await userService.create(values);
            message.success('Tạo người dùng mới thành công');
            setIsCreateModalOpen(false);
            fetchData();
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi lưu dữ liệu');
        } finally {
            setLoading(false);
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

            <UserStatistics users={users} loading={loading} />

            <Card className="glass-card user-list-card">
                <div className={styles.userListHeader}>
                    <div className={styles.headerLeft}>
                        <Title level={4} className={styles.headerTitle}>
                            <UsergroupAddOutlined /> Danh sách thành viên
                        </Title>
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

                    <Space>
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
                                >
                                    Thêm thành viên
                                </Button>
                            </Space>
                        )}
                    </Space>
                </div>

                <div className={styles.tableWrapper}>
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
                    />
                </div>
            </Card>

            <UserFormModal
                open={isCreateModalOpen}
                onCancel={() => setIsCreateModalOpen(false)}
                onSuccess={handleCreateFinish}
                roles={roles}
                loading={loading}
            />
        </div >
    );
}

