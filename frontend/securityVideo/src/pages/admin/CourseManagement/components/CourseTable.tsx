import { Table, Space, Typography, Badge, Button, Popconfirm, DatePicker, Select, Input, Tag } from 'antd';
import { CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import { Edit, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import styles from '../CourseManagement.module.scss';

const { Text } = Typography;
const { RangePicker } = DatePicker;

interface Course {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    is_private: boolean;
    is_mandatory: boolean; // Added mandatory field
    level: string;
    category_id?: number | null;
    created_at: string;
    updated_at: string;
    _count?: { sections: number, enrollments: number };
}

interface CourseTableProps {
    courses: Course[];
    categories: any[];
    loading: boolean;
    onEdit: (course: Course) => void;
    onDelete: (id: number) => void;
    onNavigateToSections: (id: number) => void;
    onStatusChange: (id: number, isPrivate: boolean) => void;
    onCategoryChange: (id: number, categoryId: number | null) => void;
}

export default function CourseTable({
    courses,
    categories,
    loading,
    onEdit,
    onDelete,
    onNavigateToSections,
    onStatusChange,
    onCategoryChange
}: CourseTableProps) {
    const getColumnSearchProps = (dataIndex: string): any => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    placeholder={`Tìm tên khóa học...`}
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
            title: 'Khóa học',
            key: 'info',
            dataIndex: 'title',
            ...getColumnSearchProps('title'),
            sorter: (a: Course, b: Course) => a.title.localeCompare(b.title),
            render: (_: any, c: Course) => (
                <Space
                    size={12}
                    className={styles.courseInfoSpace}
                    onClick={() => onNavigateToSections(c.id)}
                >
                    <img src={c.thumbnail || 'https://placehold.jp/150x150.png'} className={styles.courseThumbnail} />
                    <div>
                        <Text strong className={styles.courseTitleText}>{c.title}</Text>
                        <Text type="secondary" className={styles.courseLevelText}>{c.level}</Text>
                    </div>
                </Space>
            ),
            filters: [
                { text: 'Cơ bản', value: 'Cơ bản' },
                { text: 'Trung cấp', value: 'Trung cấp' },
                { text: 'Nâng cao', value: 'Nâng cao' },
            ],
            onFilter: (value: any, record: Course) => record.level === value,
        },
        {
            title: 'Danh mục',
            key: 'category',
            width: 180,
            filters: categories.map(cat => ({ text: cat.name, value: cat.id })),
            onFilter: (value: any, record: Course) => record.category_id === value,
            render: (c: Course) => (
                <Select
                    value={c.category_id}
                    onChange={(val) => onCategoryChange(c.id, val)}
                    placeholder="Chưa phân loại"
                    style={{ width: '100%' }}
                    size="small"
                    allowClear
                    className={styles.statusSelect}
                    options={categories.map(cat => ({
                        value: cat.id,
                        label: cat.name
                    }))}
                />
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_private',
            width: 140,
            filters: [
                { text: 'RIÊNG TƯ', value: true },
                { text: 'CÔNG KHAI', value: false },
            ],
            onFilter: (value: any, record: Course) => record.is_private === value,
            render: (isPrivate: boolean, record: Course) => (
                <Select
                    value={isPrivate}
                    onChange={(val) => onStatusChange(record.id, val)}
                    className={styles.statusSelect}
                    size="small"
                    showSearch={false}
                    popupClassName={styles.statusPopup}
                    options={[
                        {
                            value: true,
                            label: 'RIÊNG TƯ'
                        },
                        {
                            value: false,
                            label: 'CÔNG KHAI'
                        }
                    ]}
                />
            )
        },
        {
            title: 'Loại khóa',
            dataIndex: 'is_mandatory',
            width: 120,
            filters: [
                { text: 'BẮT BUỘC', value: true },
                { text: 'TỰ CHỌN', value: false },
            ],
            onFilter: (value: any, record: Course) => record.is_mandatory === value,
            render: (isMandatory: boolean) => (
                <Tag color={isMandatory ? 'volcano' : 'default'}>
                    {isMandatory ? 'BẮT BUỘC' : 'TỰ CHỌN'}
                </Tag>
            )
        },
        {
            title: 'nhân sự',
            key: 'students',
            width: 100,
            sorter: (a: Course, b: Course) => (a._count?.enrollments || 0) - (b._count?.enrollments || 0),
            render: (c: Course) => (
                <Badge
                    count={c._count?.enrollments || 0}
                    showZero
                    color="#52c41a"
                    className={styles.studentBadge}
                />
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
                <div className={styles.filterPickerWrapper} onKeyDown={(e) => e.stopPropagation()}>
                    <RangePicker
                        value={selectedKeys[0] ? [dayjs(selectedKeys[0][0]), dayjs(selectedKeys[0][1])] : null}
                        onChange={(dates) => setSelectedKeys(dates ? [[dates[0]?.toISOString(), dates[1]?.toISOString()]] : [])}
                        className={styles.filterRangePicker}
                        size="small"
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            size="small"
                            className={styles.filterBtn}
                        >
                            Lọc
                        </Button>
                        <Button
                            onClick={() => {
                                clearFilters();
                                confirm();
                            }}
                            size="small"
                            className={styles.filterBtn}
                        >
                            Xóa
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered: boolean) => (
                <CalendarOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
            onFilter: (value: any, record: Course) => {
                if (!value || value.length === 0) return true;
                const start = dayjs(value[0][0]).startOf('day');
                const end = dayjs(value[0][1]).endOf('day');
                const recordDate = dayjs(record.created_at);
                return recordDate.isAfter(start) && recordDate.isBefore(end);
            },
            render: (date: string) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Cập nhật',
            dataIndex: 'updated_at',
            width: 150,
            render: (date: string) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 120,
            render: (record: Course) => (
                <Space>
                    <Button type="text" icon={<Edit size={16} />} onClick={() => onEdit(record)} />
                    <Popconfirm title="Xóa toàn bộ khóa học?" onConfirm={() => onDelete(record.id)}>
                        <Button type="text" danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <Table
            dataSource={courses}
            columns={columns}
            rowKey="id"
            loading={loading}
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
            scroll={{ x: 1200, y: 600 }}
            virtual
            bordered
        />
    );
}
