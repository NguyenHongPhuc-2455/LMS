import { Table, Space, Button } from 'antd';
import { UserOutlined, BookOutlined, ApartmentOutlined, CloseOutlined } from '@ant-design/icons';
import styles from '../CourseRequests.module.scss';

interface RequestTableProps {
    type: 'course' | 'program';
    data: any[];
    loading: boolean;
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

export default function RequestTable({
    type,
    data,
    loading,
    selectedIds,
    onSelectionChange,
    onApprove,
    onReject
}: RequestTableProps) {
    const columns = [
        {
            title: 'Học viên',
            dataIndex: 'user',
            key: 'user',
            render: (user: any) => (
                <Space>
                    <UserOutlined />
                    <div>
                        <div style={{ fontWeight: 600 }}>{user.full_name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                    </div>
                </Space>
            )
        },
        {
            title: type === 'course' ? 'Khóa học' : 'Lộ trình học',
            dataIndex: type,
            key: type,
            render: (item: any) => (
                <Space>
                    {type === 'course' ? <BookOutlined /> : <ApartmentOutlined style={{ color: '#6366f1' }} />}
                    <span style={{ fontWeight: 500 }}>{item.title}</span>
                </Space>
            )
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            render: (text: string) => text || <i style={{ color: '#94a3b8' }}>Không có lý do</i>
        },
        {
            title: 'Ngày gửi',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleString('vi-VN')
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        className={styles.approveBtn}
                        onClick={() => onApprove(record.id)}
                    >
                        Duyệt
                    </Button>
                    <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => onReject(record.id)}
                    >
                        Từ chối
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            rowSelection={{
                selectedRowKeys: selectedIds,
                onChange: (keys: any) => onSelectionChange(keys),
            }}
            locale={{ emptyText: type === 'course' ? 'Không có yêu cầu khóa học nào' : 'Không có yêu cầu lộ trình nào' }}
        />
    );
}
