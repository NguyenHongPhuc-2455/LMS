import React from 'react';
import { Table, Space, Typography, Badge, Button, Popconfirm, DatePicker, Select, Input, Tag, Switch, Skeleton } from 'antd';
import { CalendarOutlined, SearchOutlined } from '@ant-design/icons';
import { Edit, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import styles from '../CourseManagement.module.scss';

const { Text } = Typography;
const { RangePicker } = DatePicker;

import { type Course } from '../../../../types/course';

interface CourseTableProps {
    courses: Course[];
    total?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number, pageSize: number) => void;
    onTableChange?: (page: number, pageSize: number, payload: {
        sortField?: string;
        sortOrder?: 'ascend' | 'descend' | null;
        privateFilter?: boolean | null;
        activeFilter?: boolean | null;
        levelFilter?: string[] | null;
    }) => void;
    categories: any[];
    loading: boolean;
    updatingId?: number | null;
    selectedRowKeys: React.Key[];
    onSelectionChange: (keys: React.Key[]) => void;
    onEdit: (course: Course) => void;
    onDelete: (id: number) => void;
    onNavigateToSections: (id: number) => void;
    onStatusChange: (id: number, isPrivate: boolean) => void;
    onCategoryChange: (id: number, categoryId: number | null) => void;
    onToggleActive: (id: number, isActive: boolean) => void;
}

function CourseTable({
    courses,
    total,
    page,
    pageSize,
    onPageChange,
    onTableChange,
    categories,
    loading,
    updatingId,
    selectedRowKeys,
    onSelectionChange,
    onEdit,
    onDelete,
    onNavigateToSections,
    onStatusChange,
    onCategoryChange,
    onToggleActive
}: CourseTableProps) {

    const getColumnSearchProps = React.useCallback((dataIndex: string): any => ({
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
    }), []);

    const categoryOptions = React.useMemo(() => categories.map((cat) => ({
        value: cat.id,
        label: cat.name
    })), [categories]);

    const columns = React.useMemo(() => [
        {
            title: 'Khóa học',
            key: 'info',
            dataIndex: 'title',
            sorter: true,
            width: 350,
            fixed: 'left' as const,
            ...getColumnSearchProps('title'),
            render: (_: any, c: Course) => (
                <Space
                    size={12}
                    className={styles.courseInfoSpace}
                    onClick={() => onNavigateToSections(c.id)}
                >
                    <img src={c.thumbnail || 'https://placehold.jp/150x150.png'} alt={c.title} className={styles.courseThumbnail} />
                    <div>
                        <Text strong className={styles.courseTitleText}>{c.title}</Text>
                        <Text type="secondary" className={styles.courseLevelText}>{c.level}</Text>
                    </div>
                </Space>
            ),
            // Server-side filter — onFilter bị bỏ, AntD sẽ gửi giá trị qua onChange
            filters: [
                { text: 'Cơ bản', value: 'Cơ bản' },
                { text: 'Trung cấp', value: 'Trung cấp' },
                { text: 'Nâng cao', value: 'Nâng cao' },
            ],
        },
        {
            title: 'Danh mục',
            key: 'category',
            width: 220,
            // Server-side filter — không dùng onFilter
            filters: categoryOptions.map(cat => ({ text: cat.label, value: cat.value })),
            render: (_: any, c: Course) => (
                <div style={{ minWidth: '190px' }}>
                    <Select
                        value={c.category_id}
                        onChange={(val) => onCategoryChange(c.id, val)}
                        placeholder="Danh mục"
                        style={{ width: '100%' }}
                        size="small"
                        allowClear
                        loading={updatingId === c.id}
                        disabled={updatingId === c.id}
                        popupMatchSelectWidth={false}
                        className={styles.statusSelect}
                        options={categoryOptions}
                    />
                </div>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_private',
            sorter: true,
            width: 160,
            // Server-side filter
            filters: [
                { text: 'RIÊNG TƯ', value: true },
                { text: 'CÔNG KHAI', value: false },
            ],
            render: (isPrivate: boolean, record: Course) => (
                <div style={{ minWidth: '130px' }}>
                    <Select
                        value={isPrivate}
                        onChange={(val) => onStatusChange(record.id, val)}
                        className={styles.statusSelect}
                        size="small"
                        showSearch={false}
                        loading={updatingId === record.id}
                        disabled={updatingId === record.id}
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
            width: 120,
            // Server-side filter
            filters: [
                { text: 'Đang mở', value: true },
                { text: 'Đã đóng', value: false },
            ],
            render: (_: any, record: Course) => {
                const isActive = !record.deleted_at;
                return (
                    <div style={{ minWidth: '80px', display: 'flex', justifyContent: 'center' }}>
                        <Switch
                            checked={isActive}
                            size="small"
                            loading={updatingId === record.id}
                            disabled={updatingId === record.id}
                            onChange={(checked) => onToggleActive(record.id, checked)}
                            style={{ backgroundColor: isActive ? '#52c41a' : undefined }}
                        />
                    </div>
                );
            }
        },
        {
            title: 'Số chương',
            key: 'sections',
            sorter: true,
            width: 140,
            render: (_: any, record: Course) => <span style={{ whiteSpace: 'nowrap' }}>{record._count?.sections || 0} chương</span>
        },
        {
            title: 'Loại khóa',
            dataIndex: 'is_mandatory',
            width: 140,
            // Server-side filter
            filters: [
                { text: 'BẮT BUỘC', value: true },
                { text: 'TỰ CHỌN', value: false },
            ],
            render: (isMandatory: boolean) => (
                <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {isMandatory ? 'BẮT BUỘC' : 'TỰ CHỌN'}
                </span>
            )
        },
        {
            title: 'Nhân sự',
            key: 'students',
            sorter: true,
            width: 120,
            render: (_: any, c: Course) => (
                <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>
                    {c._count?.enrollments || 0}
                </span>
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            sorter: true,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
                <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                    <RangePicker
                        value={selectedKeys[0]}
                        onChange={(dates) => setSelectedKeys(dates ? [dates] : [])}
                        style={{ marginBottom: 8, display: 'flex' }}
                    />
                    <Space style={{ display: 'flex', justifyContent: 'flex-end' }}>
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
            // Date filter vẫn client-side vì chỉ filter trên trang hiện tại (10 rows)
            // và không có server-side date range filter endpoint
            onFilter: (value: any, record: Course) => {
                if (!value || value.length === 0) return true;
                const start = dayjs(value[0]).startOf('day');
                const end = dayjs(value[1]).endOf('day');
                const recordDate = dayjs(record.created_at);
                return recordDate.isAfter(start) && recordDate.isBefore(end);
            },
            render: (date: string) => <span style={{ whiteSpace: 'nowrap' }}>{new Date(date).toLocaleDateString()}</span>
        },
        {
            title: 'Cập nhật',
            dataIndex: 'updated_at',
            width: 150,
            render: (date: string) => <span style={{ whiteSpace: 'nowrap' }}>{new Date(date).toLocaleDateString()}</span>
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 120,
            fixed: 'right' as const,
            render: (_: any, record: Course) => (
                <Space>
                    <Button type="text" icon={<Edit size={16} />} onClick={() => onEdit(record)} />
                    <Popconfirm title="Xóa toàn bộ khóa học?" onConfirm={() => onDelete(record.id)}>
                        <Button type="text" danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ], [
        categoryOptions,
        onNavigateToSections,
        onCategoryChange,
        onStatusChange,
        onToggleActive,
        onEdit,
        onDelete,
        getColumnSearchProps,
        updatingId
    ]);

    const paginationConfig = React.useMemo(() => ({
        total,
        current: page,
        pageSize,
        onChange: onPageChange,
        pageSizeOptions: ['10', '20', '50', '100'],
        showSizeChanger: true,
        selectProps: { showSearch: false },
        itemRender: (currentPage: number, type: string, originalElement: any) => {
            if (type === 'page') {
                return React.cloneElement(originalElement, {
                    className: 'page-number',
                    children: currentPage < 10 ? `0${currentPage}` : currentPage
                });
            }
            return originalElement;
        }
    }), [total, page, pageSize, onPageChange]);

    const rowSelection = React.useMemo(() => ({
        selectedRowKeys,
        onChange: onSelectionChange,
    }), [selectedRowKeys, onSelectionChange]);

    const handleTableChange = React.useCallback((pagination: any, filters: any, sorter: any) => {
        const currentPage = pagination?.current || 1;
        const currentPageSize = pagination?.pageSize || 10;
        onPageChange?.(currentPage, currentPageSize);

        if (!onTableChange) return;

        const normalizedSorter = Array.isArray(sorter) ? sorter[0] : sorter;
        const sortFieldMap: Record<string, string> = {
            title: 'title',
            is_private: 'is_private',
            created_at: 'created_at',
            sections: 'sections_count',
            students: 'enrollments_count'
        };
        const mappedSortField = normalizedSorter?.columnKey ? sortFieldMap[normalizedSorter.columnKey] : undefined;
        const mappedSortOrder = (normalizedSorter?.order || null) as 'ascend' | 'descend' | null;

        onTableChange(currentPage, currentPageSize, {
            sortField: mappedSortField,
            sortOrder: mappedSortOrder,
            privateFilter: Array.isArray(filters?.is_private) && filters.is_private.length > 0 ? filters.is_private[0] : null,
            activeFilter: Array.isArray(filters?.active) && filters.active.length > 0 ? filters.active[0] : null,
            levelFilter: Array.isArray(filters?.info) && filters.info.length > 0 ? filters.info : null
        });
    }, [onPageChange, onTableChange]);

    const isFirstLoad = loading && (!courses || courses.length === 0);

    const displayData = React.useMemo(() => {
        if (isFirstLoad) {
            return Array.from({ length: 5 }).map((_, index) => ({ id: `dummy-${index}`, isDummy: true } as any));
        }
        return courses;
    }, [courses, isFirstLoad]);

    const skeletonColumns = React.useMemo(() => {
        if (!isFirstLoad) return columns;
        return columns.map(col => ({
            ...col,
            render: (value: any, record: any, index: number) => {
                if (record.isDummy) {
                    return <Skeleton.Button active size="small" style={{ width: '80%', height: 16 }} />;
                }
                return col.render ? (col.render as any)(value, record, index) : value;
            }
        }));
    }, [columns, isFirstLoad]);

    const resolvedRowSelection = React.useMemo(() => {
        if (isFirstLoad) return undefined;
        return rowSelection;
    }, [rowSelection, isFirstLoad]);

    return (
        <Table
            dataSource={displayData}
            columns={skeletonColumns}
            rowKey="id"
            loading={isFirstLoad ? false : loading}
            rowSelection={resolvedRowSelection}
            pagination={isFirstLoad ? false : (paginationConfig as any)}
            scroll={{ x: 1670, y: 600 }}
            bordered
            onChange={isFirstLoad ? undefined : handleTableChange}
            onRow={(record) => ({
                onClick: (event) => {
                    if (record.isDummy) return;
                }
            })}
        />
    );
}

export default React.memo(CourseTable);
