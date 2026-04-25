import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton, message, Empty, Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { courseService } from '../../../services/course.service';
import { categoryService } from '../../../services/category.service';
import styles from '../CourseList/CourseList.module.scss';

// Sub-components
import CourseGrid from '../CourseList/components/CourseGrid';
import type { Course } from '../components/CourseCard';

const { Title, Text } = Typography;

export default function CategoryCourseView() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [categoryName, setCategoryName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8; // Cho hiển thị nhiều hơn vì gộp chung

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [coursesData, categoriesData] = await Promise.all([
                    courseService.getAll('', parseInt(id)),
                    categoryService.getAllCategories()
                ]);

                setCourses(coursesData);
                const currentCat = categoriesData.find(c => c.id === parseInt(id));
                if (currentCat) {
                    setCategoryName(currentCat.name);
                } else {
                    setCategoryName('Danh mục không xác định');
                }
            } catch (error) {
                message.error('Lỗi khi tải dữ liệu danh mục');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        setCurrentPage(1);
    }, [id]);

    if (loading) {
        return (
            <div className={styles.loaderContainer} style={{ padding: '40px' }}>
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    return (
        <div className={styles.courseListContainer} style={{ padding: '24px' }}>
            <div style={{ marginBottom: '32px', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/home')} style={{ color: '#64748b', padding: 0 }}>
                        Quay lại Trang chủ
                    </Button>
                </div>
                <Space size={16} align="center">
                    <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FolderOpenOutlined style={{ fontSize: '24px', color: 'C72127' }} />
                    </div>
                    <div>
                        <Title level={2} style={{ margin: 0, color: '#1e293b' }}>{categoryName}</Title>
                        <Text type="secondary">{courses.length} khóa học trong danh mục này</Text>
                    </div>
                </Space>
            </div>

            <CourseGrid
                title={`Khóa học: ${categoryName}`}
                courses={courses}
                currentPage={currentPage}
                pageSize={pageSize}
                setCurrentPage={setCurrentPage}
            />

            {courses.length === 0 && (
                <Empty description="Danh mục này hiện chưa có khóa học nào" style={{ marginTop: '40px' }} />
            )}
        </div>
    );
}
