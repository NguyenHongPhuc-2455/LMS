import { Table, Space, Typography, Badge, Button, Popconfirm, DatePicker, Select, Input, Tag, Switch } from 'antd';
import { CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import { Edit, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import styles from '../CourseManagement.module.scss';

const { Text } = Typography;
const { RangePicker } = DatePicker;

import { type Course } from '../../../../types/course';

interface CourseTableProps {
    courses: Course[];
    categories: any[];
    loading: boolean;
    selectedRowKeys: React.Key[];
    onSelectionChange: (keys: React.Key[]) => void;
    onEdit: (course: Course) => void;
    onDelete: (id: number) => void;
    onNavigateToSections: (id: number) => void;
    onStatusChange: (id: number, isPrivate: boolean) => void;
    onCategoryChange: (id: number, categoryId: number | null) => void;
    onToggleActive: (id: number, isActive: boolean) => void;
}

export default function CourseTable({
    courses,
    categories,
    loading,
    selectedRowKeys,
    onSelectionChange,
    onEdit,
    onDelete,
    onNavigateToSections,
    onStatusChange,
    onCategoryChange,
    onToggleActive
}: CourseTableProps) {
    console.log('CourseTable Props:', { onToggleActive });
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
            width: 350,
            fixed: 'left' as const,
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
            filters: categories.map(cat => ({ text: cat.name, value: cat.id })),
            onFilter: (value: any, record: Course) => record.category_id === value,
            render: (c: Course) => (
                <div style={{ minWidth: '110px' }}>
                    <Select
                        value={c.category_id}
                        onChange={(val) => onCategoryChange(c.id, val)}
                        placeholder="Danh mục"
                        style={{ width: '100%' }}
                        size="small"
                        allowClear
                        popupMatchSelectWidth={false}
                        className={styles.statusSelect}
                        options={categories.map(cat => ({
                            value: cat.id,
                            label: cat.name
                        }))}
                    />
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_private',
            filters: [
                { text: 'RIÊNG TƯ', value: true },
                { text: 'CÔNG KHAI', value: false },
            ],
            onFilter: (value: any, record: Course) => record.is_private === value,
            render: (isPrivate: boolean, record: Course) => (
                <div style={{ minWidth: '110px' }}>
                    <Select
                        value={isPrivate}
                        onChange={(val) => onStatusChange(record.id, val)}
                        className={styles.statusSelect}
                        size="small"
                        showSearch={false}
                        popupMatchSelectWidth={false}
                        popupClassName={styles.statusPopup}
                        options={[
                            { value: true, label: 'RIÊNG TƯ' },
                            { value: false, label: 'CÔNG KHAI' }
                        ]}
                    />
                </div>
            )
        },
        {
            title: 'Hiển thị',
            key: 'active',
            filters: [
                { text: 'Đang mở', value: true },
                { text: 'Đã đóng', value: false },
            ],
            onFilter: (value: any, record: Course) => (!record.deleted_at) === value,
            render: (_: any, record: Course) => {
                const isActive = !record.deleted_at;
                return (
                    <div style={{ whiteSpace: 'nowrap' }}>
                        <Switch
                            checked={isActive}
                            onChange={(checked) => onToggleActive(record.id, checked)}
                            size="small"
                            checkedChildren="ON"
                            unCheckedChildren="OFF"
                        />
                    </div>
                );
            }
        },
        {
            title: 'Loại khóa',
            dataIndex: 'is_mandatory',
            filters: [
                { text: 'BẮT BUỘC', value: true },
                { text: 'TỰ CHỌN', value: false },
            ],
            onFilter: (value: any, record: Course) => record.is_mandatory === value,
            render: (isMandatory: boolean) => (
                <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {isMandatory ? 'BẮT BUỘC' : 'TỰ CHỌN'}
                </span>
            )
        },
        {
            title: 'nhân sự',
            key: 'students',
            sorter: (a: Course, b: Course) => (a._count?.enrollments || 0) - (b._count?.enrollments || 0),
            render: (c: Course) => (
                <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {c._count?.enrollments || 0}
                </span>
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
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
            render: (date: string) => <span style={{ whiteSpace: 'nowrap' }}>{new Date(date).toLocaleDateString()}</span>
        },
        {
            title: 'Cập nhật',
            dataIndex: 'updated_at',
            render: (date: string) => <span style={{ whiteSpace: 'nowrap' }}>{new Date(date).toLocaleDateString()}</span>
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 120,
            fixed: 'right' as const,
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
            rowSelection={{
                selectedRowKeys,
                onChange: onSelectionChange,
            }}
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
            scroll={{ x: 1600, y: 600 }}
            bordered
        />
    );
}
