import { Table, Space, Badge, Button, Popconfirm } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';
import { PlayCircle, Edit, Trash2 } from 'lucide-react';
import styles from '../LessonManagement.module.scss';

interface Lesson {
    id: number;
    title: string;
    video_url: string;
    type: 'VIDEO' | 'DOCUMENT' | 'QUIZ';
    order?: number;
    duration?: number;
}

interface LessonTableProps {
    lessons: Lesson[];
    loading: boolean;
    onEdit: (lesson: Lesson) => void;
    onDelete: (lesson: Lesson) => void;
}

export default function LessonTable({ lessons, loading, onEdit, onDelete }: LessonTableProps) {
    const columns = [
        {
            title: 'ID',
            dataIndex: 'id',
            width: 80,
            sorter: (a: Lesson, b: Lesson) => a.id - b.id
        },
        {
            title: 'Tên bài giảng',
            dataIndex: 'title',
            sorter: (a: Lesson, b: Lesson) => a.title.localeCompare(b.title),
            render: (t: string, r: Lesson) => (
                <Space>
                    {r.type === 'QUIZ' ? <QuestionCircleOutlined className={styles.quizIcon} /> : <PlayCircle size={14} color="#6366f1" />}
                    {t}
                </Space>
            )
        },
        {
            title: 'Phân loại',
            dataIndex: 'type',
            filters: [
                { text: 'Trắc nghiệm', value: 'QUIZ' },
                { text: 'Video/Tài liệu', value: 'VIDEO' },
                { text: 'TÀI LIỆU', value: 'DOCUMENT' },
            ],
            onFilter: (v: any, r: Lesson) => r.type === v,
            render: (t: string) => t === 'QUIZ' ? <Badge status="warning" text="Trắc nghiệm" /> : <Badge status="processing" text="Video/Tài liệu" />
        },
        {
            title: 'Thời lượng',
            dataIndex: 'duration',
            sorter: (a: Lesson, b: Lesson) => (a.duration || 0) - (b.duration || 0),
            render: (d: number) => {
                if (!d) return '00:00';
                const m = Math.floor(d / 60);
                const s = d % 60;
                return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
            }
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 150,
            render: (record: Lesson) => (
                <Space>
                    <Button type="text" icon={<Edit size={16} />} onClick={() => onEdit(record)} />
                    <Popconfirm title="Xóa bài giảng?" onConfirm={() => onDelete(record)}>
                        <Button type="text" danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Table
            dataSource={lessons}
            loading={loading}
            rowKey="id"
            columns={columns}
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
            scroll={{ y: 500 }}
            virtual
            bordered
        />
    );
}
