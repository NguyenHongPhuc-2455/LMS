import React, { useState, useEffect } from 'react';
import { Table, Select, Typography, Space, Progress, Avatar, Card, Button, Tooltip, Input } from 'antd';
import { UserOutlined, ReloadOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { courseService } from '@/services/course.service';
import { statsService } from '@/services/stats.service';
import { categoryService, type Category } from '@/services/category.service';
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

    useEffect(() => {
        fetchCategories();
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

    const handleCategoryChange = (categoryId: number) => {
        setSelectedCategory(categoryId);
        setSelectedCourse(null);
        setStudents([]);
        fetchCourses(categoryId);
    };

    const handleCourseChange = async (courseId: number) => {
        setSelectedCourse(courseId);
        setIsGlobalSearch(false);
        setLoadingStudents(true);
        try {
            // Truyền departmentId nếu là Manager để lọc chỉ nhân sự phòng ban mình
            const data = await statsService.getCourseProgress(courseId, managerDepartmentId);
            setStudents(data);
        } catch (error) {
            console.error('Failed to fetch student progress:', error);
        } finally {
            setLoadingStudents(false);
        }
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
            const data = await statsService.searchProgress(value, selectedCourse || undefined);
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

    const getColumnSearchProps = (dataIndex: string): any => ({
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
    });

    const columns = [
        {
            title: 'nhân sự',
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
    ];

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

                        <Tooltip title="Làm mới dữ liệu">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => {
                                    if (searchText) handleStudentSearch(searchText);
                                    else if (selectedCourse) handleCourseChange(selectedCourse);
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
