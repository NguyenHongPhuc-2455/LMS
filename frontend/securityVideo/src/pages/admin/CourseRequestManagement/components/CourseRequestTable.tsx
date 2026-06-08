import React from 'react';
import { Table, Space, Button } from 'antd';
import { UserOutlined, BookOutlined, ApartmentOutlined } from '@ant-design/icons';
import styles from '../CourseRequests.module.scss';

interface RequestTableProps {
    type: 'course' | 'program';
    data: any[];
    total?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number, pageSize: number) => void;
    loading: boolean;
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
}

export default function RequestTable({
    type,
    data,
    total,
    page,
    pageSize,
    onPageChange,
    loading,
    selectedIds,
    onSelectionChange,
    onApprove,
    onReject
}: RequestTableProps) {
    const columns = React.useMemo(() => [
        {
            title: 'Nhân sự',
            dataIndex: 'user',
            key: 'user',
            width: 250,
            fixed: 'left' as const,
            filters: Array.from(new Set(data.map(r => r.user.full_name))).map(name => ({ text: name, value: name })),
            filterSearch: true,
            onFilter: (value: any, record: any) => record.user.full_name === value,
            render: (user: any) => (
                <Space style={{ whiteSpace: 'nowrap' }}>
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
            width: 200,
            filters: Array.from(new Set(data.map(r => r[type]?.title))).filter(t => t).map(title => ({ text: title, value: title })),
            filterSearch: true,
            onFilter: (value: any, record: any) => record[type]?.title === value,
            render: (item: any) => (
                <Space style={{ whiteSpace: 'nowrap' }}>
                    {type === 'course' ? <BookOutlined /> : <ApartmentOutlined style={{ color: '#6366f1' }} />}
                    <span style={{ fontWeight: 500 }}>{item?.title}</span>
                </Space>
            )
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            render: (text: string) => <span style={{ whiteSpace: 'nowrap' }}>{text || <i style={{ color: '#94a3b8' }}>Không có lý do</i>}</span>
        },
        {
            title: 'Ngày gửi',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => <span style={{ whiteSpace: 'nowrap' }}>{new Date(date).toLocaleString('vi-VN')}</span>
        },
        {
            title: 'Thao tác',
            key: 'action',
            width: 180,
            fixed: 'right' as const,
            render: (_: any, record: any) => (
                <Space size="middle" style={{ whiteSpace: 'nowrap' }}>
                    <Button
                        type="primary"
                        className={styles.approveBtn}
                        onClick={() => onApprove(record.id)}
                    >
                        Duyệt
                    </Button>
                    <Button
                        danger
                        onClick={() => onReject(record.id)}
                    >
                        Từ chối
                    </Button>
                </Space>
            )
        }
    ], [type, data, onApprove, onReject]);

    return (
        <Table
            columns={columns}
            dataSource={data}
            rowKey="id"
            loading={loading}
            rowSelection={{
                selectedRowKeys: selectedIds,
                onChange: (keys: any) => onSelectionChange(keys),
                fixed: 'left' as const,
                columnWidth: 50,
            }}
            locale={{ emptyText: type === 'course' ? 'Không có yêu cầu khóa học nào' : 'Không có yêu cầu lộ trình nào' }}
            pagination={{
                total,
                current: page,
                pageSize,
                onChange: onPageChange,
                pageSizeOptions: ['10', '20', '50', '100'],
                showSizeChanger: true,
                selectProps: { showSearch: false },
                itemRender: (current: number, type: string, originalElement: any) => {
                    if (type === 'page') {
                        return React.cloneElement(originalElement, {
                            className: 'page-number',
                            children: current < 10 ? `0${current}` : current
                        });
                    }
                    return originalElement;
                }
            } as any}
            scroll={{ x: 1000, y: 600 }}
            virtual
        />
    );
}
