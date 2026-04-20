import { Table, Space, Select, Tag, Button, Popconfirm, Badge, Typography, message } from 'antd';
import { Edit, Trash2 } from 'lucide-react';
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
    const columns = [
        {
            title: 'Chương trình học',
            key: 'info',
            render: (p: Program) => (
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
            render: (p: Program) => (
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                    <Select
                        size="small"
                        value={p.status}
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
                <Button type="link" onClick={() => onOpenCourseDrawer(p)} style={{ padding: 0 }}>
                    <Tag color="blue">{p._count?.courses || 0} khóa</Tag>
                </Button>
            )
        },
        {
            title: 'Học viên',
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
                    <Popconfirm title="Xóa chương trình học này?" onConfirm={() => onDelete(p.id)}>
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
            pagination={{ pageSize: 8 }}
        />
    );
}
