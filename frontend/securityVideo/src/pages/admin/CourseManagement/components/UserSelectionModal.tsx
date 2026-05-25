import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Modal, Table, Input, Space, Typography, Tag } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

/** Debounce hook — trả về giá trị sau `delay` ms kể từ lần thay đổi cuối */
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(id);
    }, [value, delay]);
    return debounced;
}

interface UserSelectionModalProps {
    open: boolean;
    onCancel: () => void;
    onOk: (selectedIds: number[]) => void;
    users: any[];
    initialSelectedIds: number[];
    loading?: boolean;
}

// Định nghĩa columns ngoài component để tránh tạo lại mỗi render
const USER_COLUMNS = [
    {
        title: 'Nhân viên',
        key: 'user',
        render: (_: any, record: any) => (
            <Space>
                <UserOutlined />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <Text strong>{record.full_name}</Text>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        @{record.username}{record.employee_id ? ` (${record.employee_id})` : ''}
                    </Text>
                </div>
            </Space>
        )
    },
    {
        title: 'Phòng ban',
        dataIndex: 'department',
        key: 'department',
        render: (text: string) => text || '-'
    },
    {
        title: 'Vị trí',
        dataIndex: 'position',
        key: 'position',
        render: (text: string) => text || '-'
    }
];

export const UserSelectionModal: React.FC<UserSelectionModalProps> = ({
    open,
    onCancel,
    onOk,
    users,
    initialSelectedIds,
    loading
}) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [searchText, setSearchText] = useState('');

    // Debounce 250ms — tránh filter lại mảng lớn mỗi keystroke
    const debouncedSearch = useDebounce(searchText, 250);

    // Đồng bộ selection khi mở modal
    useEffect(() => {
        if (open) setSelectedRowKeys(initialSelectedIds);
    }, [open, initialSelectedIds]);

    const filteredUsers = useMemo(() => {
        if (!debouncedSearch) return users;
        const lower = debouncedSearch.toLowerCase();
        return users.filter(u =>
            u.full_name?.toLowerCase().includes(lower) ||
            u.username?.toLowerCase().includes(lower) ||
            u.employee_id?.toLowerCase().includes(lower)
        );
    }, [users, debouncedSearch]);

    const rowSelection = useMemo(() => ({
        selectedRowKeys,
        onChange: (keys: React.Key[]) => setSelectedRowKeys(keys),
        preserveSelectedRowKeys: true
    }), [selectedRowKeys]);

    const handleOk = useCallback(() => {
        onOk(selectedRowKeys.map(key => Number(key)));
    }, [onOk, selectedRowKeys]);

    return (
        <Modal
            title="Chọn nhân viên áp dụng"
            open={open}
            onCancel={onCancel}
            onOk={handleOk}
            width={700}
            okText="Xác nhận chọn"
            cancelText="Hủy"
            centered
            destroyOnClose
        >
            <div style={{ marginBottom: 16 }}>
                <Input
                    placeholder="Tìm theo tên, username hoặc mã nhân viên..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />
            </div>

            <div style={{ marginBottom: 12 }}>
                <Text type="secondary">Đang chọn: </Text>
                <Tag color="blue">{selectedRowKeys.length} nhân viên</Tag>
            </div>

            <Table
                dataSource={filteredUsers}
                columns={USER_COLUMNS}
                rowKey="id"
                size="small"
                loading={loading}
                pagination={{ pageSize: 8, showSizeChanger: false }}
                rowSelection={rowSelection}
                scroll={{ y: 400 }}
            />
        </Modal>
    );
};
