import React from 'react';
import { Table, Space, Select, Tag, Button, Popconfirm, Badge, Typography, message, Input } from 'antd';
import { Edit, Trash2 } from 'lucide-react';
import { SearchOutlined } from '@ant-design/icons';
import { programService } from '../../../../services/program.service';
import styles from '../ProgramManagement.module.scss';

const { Text } = Typography;
const { Option } = Select;

import { type Course } from '../../../../types/course';
import { type Program } from '../../../../types/program';

interface ProgramTableProps {
    programs: Program[];
    total?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number, pageSize: number) => void;
    loading: boolean;
    onEdit: (p: Program) => void;
    onDelete: (id: number) => void;
    onOpenCourseDrawer: (p: Program) => void;
    onRefresh: () => void;
}

export default function ProgramTable({ programs, total, page, pageSize, onPageChange, loading, onEdit, onDelete, onOpenCourseDrawer, onRefresh }: ProgramTableProps) {
    const getColumnSearchProps = (dataIndex: string): any => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    placeholder={`Tìm lộ trình...`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => confirm()}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => confirm()}
                        icon={<SearchOutlined />}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Tìm
                    </Button>
                    <Button
                        onClick={() => {
                            clearFilters?.();
                            confirm();
                        }}
                        size="small"
                        style={{ width: 90 }}
                    >
                        Xóa
                    </Button>
                </Space>
            </div>
        ),
        filterIcon: (filtered: boolean) => (
            <SearchOutlined style={{ color: filtered ? '#fff' : '#fff', fontSize: '18px' }} />
        ),
        onFilter: (value: any, record: any) =>
            record[dataIndex]
                ? record[dataIndex].toString().toLowerCase().includes(value.toLowerCase())
                : '',
    });

    const columns = [
        {
            title: 'Lộ trình',
            key: 'info',
            width: 350,
            minWidth: 300,
            dataIndex: 'title',
            fixed: 'left' as const,
            ...getColumnSearchProps('title'),
            render: (_: any, p: Program) => (
                <div className={styles.programInfoCell}>
                    <img src={p.thumbnail || 'https://via.placeholder.com/80x45'} className={styles.programThumb} alt="thumbnail" />
                    <div>
                        <Text className={styles.programTitle}>{p.title}</Text>
                        <Text className={styles.programLevel}>{p.level}</Text>
                    </div>
                </div>
            )
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 150,
            minWidth: 150,
            filters: [
                { text: 'DRAFT', value: 'DRAFT' },
                { text: 'PUBLISHED', value: 'PUBLISHED' },
                { text: 'ARCHIVED', value: 'ARCHIVED' },
                { text: 'CÔNG KHAI', value: false },
                { text: 'RIÊNG TƯ', value: true },
            ],
            onFilter: (value: any, p: Program) => {
                if (typeof value === 'boolean') return p.is_private === value;
                return p.status === value;
            },
            render: (p: Program) => (
                <div style={{ minWidth: '100px' }}>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Select
                            size="small"
                            value={p.status}
                            showSearch={false}
                            popupMatchSelectWidth={false}
                            onChange={async (val) => {
                                try {
                                    await programService.update(p.id, { status: val });
                                    message.success('Đã cập nhật trạng thái');
                                    onRefresh();
                                } catch {
                                    message.error('Lỗi khi cập nhật');
                                }
                            }}
                            style={{ width: '100%' }}
                            className="status-select-inline"
                        >
                            <Option value="DRAFT">Nháp</Option>
                            <Option value="PUBLISHED">Phát hành</Option>
                            <Option value="ARCHIVED">Lưu trữ</Option>
                        </Select>
                        <Select
                            size="small"
                            value={p.is_private}
                            showSearch={false}
                            popupMatchSelectWidth={false}
                            onChange={async (val) => {
                                try {
                                    await programService.update(p.id, { is_private: val });
                                    message.success('Đã cập nhật chế độ truy cập');
                                    onRefresh();
                                } catch {
                                    message.error('Lỗi khi cập nhật');
                                }
                            }}
                            style={{ width: '100%' }}
                        >
                            <Option value={false}>CÔNG KHAI</Option>
                            <Option value={true}>RIÊNG TƯ</Option>
                        </Select>
                    </Space>
                </div>
            )
        },
        {
            title: 'Loại lộ trình',
            dataIndex: 'is_mandatory',
            width: 130,
            filters: [
                { text: 'BẮT BUỘC', value: true },
                { text: 'TỰ NGUYỆN', value: false },
            ],
            onFilter: (value: any, p: Program) => p.is_mandatory === value,
            render: (_: any, p: Program) => (
                <div style={{ whiteSpace: 'nowrap' }}>
                    {p.is_mandatory ? (
                        <Tag color="red" style={{ fontWeight: 600, margin: 0 }}>BẮT BUỘC</Tag>
                    ) : (
                        <Tag color="blue" style={{ fontWeight: 600, margin: 0 }}>TỰ NGUYỆN</Tag>
                    )}
                </div>
            )
        },
        {
            title: 'Phạm vi',
            dataIndex: 'apply_scope',
            width: 180,
            filters: [
                { text: 'Toàn bộ nhân viên', value: 'ALL_EMPLOYEE' },
                { text: 'Theo phòng ban', value: 'BY_DEPARTMENT' },
                { text: 'Theo vị trí', value: 'BY_POSITION' },
                { text: 'Nhân viên cụ thể', value: 'SPECIFIC_USER' },
                { text: 'Nhân viên mới', value: 'NEW_EMPLOYEE' },
                { text: 'NV mới - Phòng ban', value: 'NEW_EMPLOYEE_BY_DEPARTMENT' },
                { text: 'NV mới - Vị trí', value: 'NEW_EMPLOYEE_BY_POSITION' },
            ],
            onFilter: (value: any, p: Program) => p.apply_scope === value,
            render: (scope: string) => {
                const scopeLabels: Record<string, string> = {
                    ALL_EMPLOYEE: 'Toàn bộ nhân viên',
                    BY_DEPARTMENT: 'Theo phòng ban',
                    BY_POSITION: 'Theo vị trí',
                    SPECIFIC_USER: 'Nhân viên cụ thể',
                    NEW_EMPLOYEE: 'Chỉ nhân viên mới',
                    NEW_EMPLOYEE_BY_DEPARTMENT: 'NV mới - Phòng ban',
                    NEW_EMPLOYEE_BY_POSITION: 'NV mới - Vị trí',
                };
                return <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>{scopeLabels[scope || 'ALL_EMPLOYEE'] || 'Toàn bộ nhân viên'}</span>;
            }
        },
        {
            title: 'Khóa học',
            key: 'courses',
            width: 100,
            render: (p: Program) => (
                <span style={{ color: '#000', fontWeight: 500, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {p._count?.courses || 0} khóa
                </span>
            )
        },
        {
            title: 'Nhân sự',
            key: 'enroll',
            width: 100,
            render: (p: Program) => (
                <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {p._count?.enrollments || 0}
                </span>
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            width: 120,
            render: (d: string) => <span style={{ whiteSpace: 'nowrap' }}>{new Date(d).toLocaleDateString('vi-VN')}</span>
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 100,
            fixed: 'right' as const,
            render: (p: Program) => (
                <Space>
                    <Button type="text" icon={<Edit size={16} />} onClick={() => onEdit(p)} />
                    <Popconfirm title="Xóa Lộ trình học này?" onConfirm={() => onDelete(p.id)}>
                        <Button type="text" danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Table
            dataSource={programs}
            columns={columns as any}
            rowKey="id"
            loading={loading}
            onRow={(record) => ({
                onClick: (event) => {
                    // Ngăn mở Drawer khi bấm vào Select, Button, Popconfirm bên trong
                    const target = event.target as HTMLElement;
                    if (
                        target.closest('.ant-select') ||
                        target.closest('.ant-popover') ||
                        target.closest('button') ||
                        target.closest('.ant-popconfirm')
                    ) return;
                    onOpenCourseDrawer(record);
                },
                style: { cursor: 'pointer' }
            })}
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
            scroll={{ x: 1400, y: 600 }}
            bordered
        />
    );
}
