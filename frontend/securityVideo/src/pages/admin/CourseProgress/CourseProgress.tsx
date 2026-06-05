import React, { useState, useEffect } from 'react';
import { Table, Select, Typography, Space, Progress, Avatar, Card, Button, Tooltip, Input } from 'antd';
import { UserOutlined, ReloadOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { courseService } from '@/services/course.service';
import { statsService } from '@/services/stats.service';
import { categoryService, type Category } from '@/services/category.service';
import { departmentService } from '@/services/department.service';
import styles from './CourseProgress.module.scss';

const { Title, Text } = Typography;
const { Option } = Select;

// Lấy thông tin user từ localStorage
const userStr = localStorage.getItem('user');
const currentUser = userStr ? JSON.parse(userStr) : null;
const userRoles = currentUser?.roles || [];
const roleNames = userRoles.map((r: any) => {
    const name = typeof r === 'string' ? r : r.name;
    return name?.toLowerCase();
});
const isManagerOnly = roleNames.includes('manager') && !roleNames.includes('admin');
const managerDepartmentId: number | undefined = isManagerOnly ? currentUser?.department_id : undefined;

interface Course {
    id: number;
    title: string;
}

interface StudentProgress {
    id: number;
    fullName: string;
    email: string;
    avatar: string;
    completedLessons: number;
    totalLessons: number;
    progressPercent: number;
    enrolledAt: string;
    courseId?: number;
    courseTitle?: string;
    categoryId?: number;
    categoryName?: string;
}

export default function CourseProgress() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
    const [students, setStudents] = useState<StudentProgress[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isGlobalSearch, setIsGlobalSearch] = useState(false);
    const [columnSearchText, setColumnSearchText] = useState('');

    // Filters State
    const [departments, setDepartments] = useState<any[]>([]);
    const [departmentId, setDepartmentId] = useState<number | undefined>(
        isManagerOnly ? Number(managerDepartmentId) : undefined
    );

    // 3-level cascading dept state
    const [selectedLevel1, setSelectedLevel1] = useState<number | null | undefined>(undefined);
    const [selectedLevel2, setSelectedLevel2] = useState<number | null | undefined>(undefined);
    const [selectedLevel3, setSelectedLevel3] = useState<number | null | undefined>(undefined);

    useEffect(() => {
        fetchCategories();
        loadDepartments();
    }, []);

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const data = await categoryService.getAllCategories();
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const loadDepartments = async () => {
        try {
            const depts = await departmentService.getAll();
            setDepartments(depts || []);
        } catch (error) {
            console.error('Failed to fetch departments:', error);
        }
    };

    const fetchCourses = async (categoryId: number) => {
        setLoadingCourses(true);
        try {
            const data = await courseService.getAll('', categoryId);
            setCourses(data);
        } catch (error) {
            console.error('Failed to fetch courses:', error);
        } finally {
            setLoadingCourses(false);
        }
    };

    // 3-level handlers
    const handleDeptChange = (val: number | undefined) => setDepartmentId(val);

    const handleLevel1Change = (val: number | null | undefined) => {
        setSelectedLevel1(val);
        setSelectedLevel2(null);
        setSelectedLevel3(null);
        handleDeptChange(val === null ? undefined : val);
    };

    const handleLevel2Change = (val: number | null | undefined) => {
        setSelectedLevel2(val);
        setSelectedLevel3(null);
        const actual = val === null ? undefined : val;
        handleDeptChange(actual ?? (selectedLevel1 === null ? undefined : selectedLevel1));
    };

    const handleLevel3Change = (val: number | null | undefined) => {
        setSelectedLevel3(val);
        const actual = val === null ? undefined : val;
        handleDeptChange(actual ?? (selectedLevel2 === null ? undefined : selectedLevel2));
    };

    const handleCategoryChange = (categoryId: number) => {
        setSelectedCategory(categoryId);
        setSelectedCourse(null);
        setStudents([]);
        fetchCourses(categoryId);
    };

    const handleCourseChange = (courseId: number) => {
        setSelectedCourse(courseId);
        setIsGlobalSearch(false);
    };

    const handleStudentSearch = async (value: string) => {
        setSearchText(value);
        if (!value && !selectedCourse) {
            setStudents([]);
            setIsGlobalSearch(false);
            return;
        }

        setLoadingStudents(true);
        try {
            const data = await statsService.searchProgress(value, selectedCourse || undefined, departmentId);
            setStudents(data);
            setIsGlobalSearch(!selectedCourse);

            // If only one result and no course selected, try to "auto-select" for the user
            if (data.length === 1 && !selectedCourse) {
                const item = data[0];
                if (item.categoryId) {
                    setSelectedCategory(item.categoryId);
                    fetchCourses(item.categoryId);
                }
                setSelectedCourse(item.courseId);
            }
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoadingStudents(false);
        }
    };

    // Auto load / filter student progress when course or department changes
    useEffect(() => {
        const loadStudents = async () => {
            if (!selectedCourse) {
                if (!searchText) {
                    setStudents([]);
                }
                return;
            }
            setLoadingStudents(true);
            try {
                let data;
                if (searchText) {
                    data = await statsService.searchProgress(searchText, selectedCourse, departmentId);
                } else {
                    data = await statsService.getCourseProgress(selectedCourse, departmentId);
                }
                setStudents(data);
            } catch (error) {
                console.error('Failed to fetch student progress:', error);
            } finally {
                setLoadingStudents(false);
            }
        };
        loadStudents();
    }, [selectedCourse, departmentId]);

    const getColumnSearchProps = React.useCallback((dataIndex: string): any => ({
        filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
            <div style={{ padding: 8 }} onKeyDown={(e) => e.stopPropagation()}>
                <Input
                    placeholder={`Tìm tên hoặc email...`}
                    value={selectedKeys[0]}
                    onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
                    onPressEnter={() => handleStudentSearch(selectedKeys[0])}
                    style={{ marginBottom: 8, display: 'block' }}
                />
                <Space>
                    <Button
                        type="primary"
                        onClick={() => {
                            confirm();
                            handleStudentSearch(selectedKeys[0]);
                        }}
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
                            handleStudentSearch('');
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
    }), []);

    const columns = React.useMemo(() => [
        {
            title: 'Nhân sự',
            key: 'student',
            ...getColumnSearchProps('fullName'),
            render: (record: StudentProgress) => (
                <Space>
                    <Avatar src={record.avatar} icon={<UserOutlined />} />
                    <div>
                        <Text strong style={{ display: 'block' }}>{record.fullName}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
                    </div>
                </Space>
            ),
        },
        ...(isGlobalSearch ? [
            {
                title: 'Danh mục',
                dataIndex: 'categoryName',
                key: 'categoryName',
                render: (text: string) => text || <Text type="secondary">Trống</Text>
            },
            {
                title: 'Khóa học',
                dataIndex: 'courseTitle',
                key: 'courseTitle',
                render: (text: string) => <Text strong>{text}</Text>
            }
        ] : []),
        {
            title: 'Ngày tham gia',
            dataIndex: 'enrolledAt',
            key: 'enrolledAt',
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Tiến độ',
            key: 'progress',
            render: (record: StudentProgress) => (
                <div style={{ minWidth: '200px' }}>
                    <Progress
                        percent={record.progressPercent}
                        size="small"
                        status={record.progressPercent === 100 ? 'success' : 'active'}
                        strokeColor={record.progressPercent === 100 ? '#52c41a' : '#B8121A'}
                    />
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                        Hoàn thành {record.completedLessons}/{record.totalLessons} bài học
                    </Text>
                </div>
            ),
        }
    ], [isGlobalSearch, getColumnSearchProps]);

    return (
        <div className={styles.container}>
            {/* <div className={styles.pageHeader}>
                <div style={{ marginBottom: 20 }}>
                    <Title level={4} style={{ margin: 0 }}>Tiến độ học tập</Title>
                    <Typography.Text type="secondary">Theo dõi quá trình hoàn thành khóa học của nhân sự</Typography.Text>
                </div>
            </div> */}

            <Card className="glass-card">
                <div className={styles.courseSelectorWrapper}>
                    <Space size={20} wrap>
                        <Space size={8}>
                            <Text strong>Danh mục:</Text>
                            <Select
                                placeholder="Chọn danh mục"
                                style={{ width: 180 }}
                                onChange={handleCategoryChange}
                                loading={loadingCategories}
                                showSearch
                                optionFilterProp="children"
                                value={selectedCategory}
                            >
                                {categories.map(cat => (
                                    <Option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </Option>
                                ))}
                                <Option value={-1}>Trống (Không danh mục)</Option>
                            </Select>
                        </Space>

                        <Space size={8}>
                            <Text strong>Khóa học:</Text>
                            <Select
                                placeholder={selectedCategory ? "Chọn khóa học" : "Chọn danh mục trước"}
                                style={{ width: 220 }}
                                onChange={handleCourseChange}
                                loading={loadingCourses}
                                showSearch
                                optionFilterProp="children"
                                disabled={!selectedCategory}
                                value={selectedCourse}
                            >
                                {courses.map(course => (
                                    <Option key={course.id} value={course.id}>
                                        {course.title}
                                    </Option>
                                ))}
                            </Select>
                        </Space>

                        {/* Bộ lọc phòng ban 3 cấp */}
                        {isManagerOnly ? (
                            <span style={{ color: '#666', fontStyle: 'italic', fontSize: 13, alignSelf: 'center' }}>
                                Phòng ban: <strong style={{ color: '#C72127' }}>
                                    {departments.find((d: any) => d.id === departmentId)?.name || '...'}
                                </strong>
                            </span>
                        ) : (
                            <Space size={16} wrap>
                                <Space size={8}>
                                    <Text strong>Khối:</Text>
                                    <Select
                                        placeholder="Tất cả khối"
                                        style={{ width: 160 }}
                                        allowClear
                                        value={selectedLevel1}
                                        onChange={handleLevel1Change}
                                    >
                                        <Option value={null as any}>Tất cả khối</Option>
                                        {departments.filter((d: any) => !d.parent_id).map((d: any) => (
                                            <Option key={d.id} value={d.id}>{d.name}</Option>
                                        ))}
                                    </Select>
                                </Space>

                                <Space size={8}>
                                    <Text strong>Phòng ban:</Text>
                                    <Select
                                        placeholder="Chọn phòng ban"
                                        style={{ width: 180 }}
                                        allowClear
                                        disabled={!selectedLevel1}
                                        value={selectedLevel2}
                                        onChange={handleLevel2Change}
                                    >
                                        <Option value={null as any}>Tất cả phòng ban</Option>
                                        {departments.filter((d: any) => d.parent_id === selectedLevel1).map((d: any) => (
                                            <Option key={d.id} value={d.id}>{d.name}</Option>
                                        ))}
                                    </Select>
                                </Space>

                                <Space size={8}>
                                    <Text strong>Tổ/Nhóm:</Text>
                                    <Select
                                        placeholder="Chọn tổ/nhóm"
                                        style={{ width: 160 }}
                                        allowClear
                                        disabled={!selectedLevel2}
                                        value={selectedLevel3}
                                        onChange={handleLevel3Change}
                                    >
                                        <Option value={null as any}>Tất cả tổ/nhóm</Option>
                                        {departments.filter((d: any) => d.parent_id === selectedLevel2).map((d: any) => (
                                            <Option key={d.id} value={d.id}>{d.name}</Option>
                                        ))}
                                    </Select>
                                </Space>
                            </Space>
                        )}

                        <Tooltip title="Làm mới dữ liệu">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={async () => {
                                    if (searchText) {
                                        handleStudentSearch(searchText);
                                    } else if (selectedCourse) {
                                        setLoadingStudents(true);
                                        try {
                                            const data = await statsService.getCourseProgress(selectedCourse, departmentId);
                                            setStudents(data);
                                        } catch (error) {
                                            console.error('Failed to fetch student progress:', error);
                                        } finally {
                                            setLoadingStudents(false);
                                        }
                                    }
                                }}
                                loading={loadingStudents}
                                disabled={!selectedCourse && !searchText}
                            />
                        </Tooltip>
                    </Space>
                </div>

                <Table
                    columns={columns}
                    dataSource={students}
                    rowKey="id"
                    loading={loadingStudents}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
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
                    bordered
                    locale={{ emptyText: selectedCourse ? 'Chưa có nhân sự nào tham gia khóa học này' : 'Vui lòng chọn khóa học để xem dữ liệu' }}
                />
            </Card>
        </div>
    );
}
