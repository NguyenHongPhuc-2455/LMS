import { useState, useEffect } from 'react';
import { Table, Select, Typography, Space, Progress, Avatar, Card, Button, Tooltip } from 'antd';
import { UserOutlined, ReloadOutlined } from '@ant-design/icons';
import { courseService } from '@/services/course.service';
import { statsService } from '@/services/stats.service';
import { categoryService, type Category } from '@/services/category.service';
import styles from './CourseProgress.module.scss';

const { Title, Text } = Typography;
const { Option } = Select;

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
        setLoadingStudents(true);
        try {
            const data = await statsService.getCourseProgress(courseId);
            setStudents(data);
        } catch (error) {
            console.error('Failed to fetch student progress:', error);
        } finally {
            setLoadingStudents(false);
        }
    };

    const columns = [
        {
            title: 'Học viên',
            key: 'student',
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
            <div className={styles.pageHeader}>
                <div style={{ marginBottom: 20 }}>
                    <Title level={4} style={{ margin: 0 }}>Tiến độ học tập</Title>
                    <Typography.Text type="secondary">Theo dõi quá trình hoàn thành khóa học của học viên</Typography.Text>
                </div>
            </div>

            <Card className="glass-card">
                <div className={styles.courseSelectorWrapper}>
                    <Space size={20} wrap>
                        <Space size={8}>
                            <Text strong>Danh mục:</Text>
                            <Select
                                placeholder="Chọn danh mục"
                                style={{ width: 220 }}
                                onChange={handleCategoryChange}
                                loading={loadingCategories}
                                showSearch
                                optionFilterProp="children"
                                size="small"
                                value={selectedCategory}
                            >
                                {categories.map(cat => (
                                    <Option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </Option>
                                ))}
                            </Select>
                        </Space>

                        <Space size={8}>
                            <Text strong>Khóa học:</Text>
                            <Select
                                placeholder={selectedCategory ? "Chọn khóa học" : "Chọn danh mục trước"}
                                style={{ width: 300 }}
                                onChange={handleCourseChange}
                                loading={loadingCourses}
                                showSearch
                                optionFilterProp="children"
                                size="small"
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
                                size="small"
                                onClick={() => selectedCourse && handleCourseChange(selectedCourse)}
                                loading={loadingStudents}
                                disabled={!selectedCourse}
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
                                return <a className="page-number">{current < 10 ? `0${current}` : current}</a>;
                            }
                            return originalElement;
                        }
                    } as any}
                    bordered
                    locale={{ emptyText: selectedCourse ? 'Chưa có học viên nào tham gia khóa học này' : 'Vui lòng chọn khóa học để xem dữ liệu' }}
                />
            </Card>
        </div>
    );
}
