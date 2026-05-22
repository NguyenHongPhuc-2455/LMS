import React, { useState, useMemo } from 'react';
import { Modal, Table, Input, Space, Typography, Tag, Button } from 'antd';
import { SearchOutlined, UserOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface UserSelectionModalProps {
    open: boolean;
    onCancel: () => void;
    onOk: (selectedIds: number[]) => void;
    users: any[];
    initialSelectedIds: number[];
    loading?: boolean;
}

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

    // Đồng bộ selectedRowKeys khi mở modal
    React.useEffect(() => {
        if (open) {
            setSelectedRowKeys(initialSelectedIds);
        }
    }, [open, initialSelectedIds]);

    const filteredUsers = useMemo(() => {
        return users.filter(u => 
            u.full_name?.toLowerCase().includes(searchText.toLowerCase()) ||
            u.username?.toLowerCase().includes(searchText.toLowerCase()) ||
            u.employee_id?.toLowerCase().includes(searchText.toLowerCase())
        );
    }, [users, searchText]);

    const columns = [
        {
            title: 'Nhân viên',
            key: 'user',
            render: (_: any, record: any) => (
                <Space>
                    <UserOutlined />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <Text strong>{record.full_name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>@{record.username} {record.employee_id ? `(${record.employee_id})` : ''}</Text>
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

    const handleOk = () => {
        onOk(selectedRowKeys.map(key => Number(key)));
    };

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
                columns={columns}
                rowKey="id"
                size="small"
                loading={loading}
                pagination={{ pageSize: 8 }}
                rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                    preserveSelectedRowKeys: true
                }}
                scroll={{ y: 400 }}
            />
        </Modal>
    );
};
