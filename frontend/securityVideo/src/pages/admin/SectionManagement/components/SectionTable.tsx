import { Table, Space, Button, Popconfirm } from 'antd';
import { Edit, Trash2 } from 'lucide-react';
import styles from '../SectionManagement.module.scss';


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
}

export default function SectionTable({
    sections,
    loading,
    onEdit,
    onDelete,
    onNavigateLessons
}: SectionTableProps) {

    const columns = [
        {
            title: 'Thứ tự',
            dataIndex: 'order',
            sorter: (a: Section, b: Section) => a.order - b.order,
            render: (text: any) => <span style={{ whiteSpace: 'nowrap' }}>{text}</span>
        },
        {
            title: 'Tiêu đề chương',
            dataIndex: 'title',
            sorter: (a: Section, b: Section) => a.title.localeCompare(b.title),
            filters: sections.map(s => ({ text: s.title, value: s.id })),
            filterSearch: true,
            onFilter: (value: any, record: Section) => record.id === value,
            render: (text: string, record: Section) => (
                <span
                    className={styles.sectionTitleLink}
                    style={{ whiteSpace: 'nowrap' }}
                    onClick={() => onNavigateLessons(record.id)}
                >
                    {text}
                </span>
            )
        },
        {
            title: 'Số bài giảng',
            key: 'lessons',
            render: (record: Section) => <span style={{ whiteSpace: 'nowrap' }}>{record.lessons?.length || 0} bài</span>
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 150,
            render: (record: Section) => (
                <Space style={{ whiteSpace: 'nowrap' }}>
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
            bordered
        />
    );
}