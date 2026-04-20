import { Table, Space, Button, Popconfirm, Typography } from 'antd';
import { Edit, Trash2, FolderOpen } from 'lucide-react';
import styles from '../SectionManagement.module.scss';

const { Text } = Typography;

interface Section {
    id: number;
    title: string;
    order: number;
    lessons?: any[];
}

interface SectionTableProps {
    sections: Section[];
    loading: boolean;
    onEdit: (section: Section) => void;
    onDelete: (id: number) => void;
    onNavigateLessons: (sectionId: number) => void;
    courseSelected: boolean;
}

export default function SectionTable({
    sections,
    loading,
    onEdit,
    onDelete,
    onNavigateLessons,
    courseSelected
}: SectionTableProps) {
    if (!courseSelected) {
        return (
            <div className={styles.emptySectionWrapper}>
                <FolderOpen size={40} className={styles.emptyIcon} />
                <Text type="secondary" className={styles.emptyText}>
                    Vui lòng chọn một khóa học bên trên để quản lý chương
                </Text>
            </div>
        );
    }

    const columns = [
        {
            title: 'Thứ tự',
            dataIndex: 'order',
            width: 100,
            sorter: (a: Section, b: Section) => a.order - b.order
        },
        {
            title: 'Tiêu đề chương',
            dataIndex: 'title',
            render: (text: string, record: Section) => (
                <span
                    className={styles.sectionTitleLink}
                    onClick={() => onNavigateLessons(record.id)}
                >
                    {text}
                </span>
            )
        },
        {
            title: 'Số bài giảng',
            key: 'lessons',
            render: (record: Section) => record.lessons?.length || 0
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 150,
            render: (record: Section) => (
                <Space>
                    <Button type="text" icon={<Edit size={16} />} onClick={() => onEdit(record)} />
                    <Popconfirm title="Xóa chương này?" onConfirm={() => onDelete(record.id)}>
                        <Button type="text" danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Table
            dataSource={sections}
            loading={loading}
            rowKey="id"
            columns={columns}
        />
    );
}
