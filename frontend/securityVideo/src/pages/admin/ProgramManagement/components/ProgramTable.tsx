import { Table, Space, Select, Tag, Button, Popconfirm, Badge, Typography, message, Input } from 'antd';
import { Edit, Trash2 } from 'lucide-react';
import { SearchOutlined } from '@ant-design/icons';
import { programService } from '../../../../services/program.service';
import styles from '../ProgramManagement.module.scss';

const { Text } = Typography;
const { Option } = Select;

interface Course {
    id: number;
    title: string;
    thumbnail: string;
    level: string;
}

interface Program {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    status: string;
    is_private: boolean;
    created_at: string;
    instructor: { full_name: string };
    courses: { order: number; course: Course }[];
    _count: { enrollments: number; courses: number };
}

interface ProgramTableProps {
    programs: Program[];
    loading: boolean;
    onEdit: (p: Program) => void;
    onDelete: (id: number) => void;
    onOpenCourseDrawer: (p: Program) => void;
    onRefresh: () => void;
}

export default function ProgramTable({ programs, loading, onEdit, onDelete, onOpenCourseDrawer, onRefresh }: ProgramTableProps) {
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
            title: 'Lộ trình học',
            key: 'info',
            width: 350,
            dataIndex: 'title',
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
            width: 160,
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
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Select
                        size="small"
                        value={p.status}
                        showSearch={false}
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
            )
        },
        {
            title: 'Khóa học',
            key: 'courses',
            width: 100,
            render: (p: Program) => (
                <Tag color="blue" style={{ cursor: 'pointer' }}>
                    {p._count?.courses || 0} khóa
                </Tag>
            )
        },
        {
            title: 'nhân sự',
            key: 'enroll',
            width: 90,
            render: (p: Program) => (
                <Badge
                    count={p._count?.enrollments || 0}
                    showZero
                    color="#52c41a"
                    className="student-badge"
                />
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            width: 120,
            render: (d: string) => new Date(d).toLocaleDateString('vi-VN')
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 100,
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
            columns={columns}
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
                pageSizeOptions: ['10', '20', '50', '100'],
                showSizeChanger: true,
                defaultPageSize: 10,
                selectProps: { showSearch: false },
                itemRender: (current: number, type: string, originalElement: any) => {
                    if (type === 'page') {
                        return <a className="page-number">{current < 10 ? `0${current}` : current}</a>;
                    }
                    return originalElement;
                }
            } as any}
            scroll={{ y: 600 }}
            virtual
            bordered
        />
    );
}
