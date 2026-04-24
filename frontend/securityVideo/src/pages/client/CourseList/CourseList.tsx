import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Skeleton, message, Empty, Typography, Button, Space } from 'antd';
import { ArrowLeftOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { courseService } from '../../../services/course.service';
import { categoryService } from '../../../services/category.service';
import { useNavigate } from 'react-router-dom';
import styles from './CourseList.module.scss';

// Sub-components
import CourseFilter from './components/CourseFilter';
import CourseGrid from './components/CourseGrid';
import type { Course } from '../components/CourseCard';

export default function CourseList() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [categoryName, setCategoryName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId') as string) : undefined;

    // Phân trang & Sắp xếp
    const [currentPagePrivate, setCurrentPagePrivate] = useState(1);
    const [currentPagePublic, setCurrentPagePublic] = useState(1);
    const [sortBy, setSortBy] = useState('newest');
    const pageSize = 4;

    useEffect(() => {
        setCurrentPagePrivate(1);
        setCurrentPagePublic(1);
    }, [searchQuery, sortBy]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const data = await courseService.getAll(searchQuery, categoryId);
                setCourses(data);

                if (categoryId) {
                    const cats = await categoryService.getAllCategories();
                    const currentCat = cats.find(c => c.id === categoryId);
                    if (currentCat) setCategoryName(currentCat.name);
                } else {
                    setCategoryName(null);
                }
            } catch (error) {
                message.error('Lỗi khi tải danh sách khóa học');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [searchQuery, categoryId]);

    if (loading) {
        return (
            <div className={styles.loaderContainer}>
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    const sortCourses = (list: Course[]) => {
        const sorted = [...list];
        switch (sortBy) {
            case 'newest':
                sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                break;
            case 'az':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'za':
                sorted.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'level':
                const levels: Record<string, number> = { 'Cơ bản': 1, 'Trung cấp': 2, 'Nâng cao': 3 };
                sorted.sort((a, b) => (levels[a.level] || 99) - (levels[b.level] || 99));
                break;
        }
        return sorted;
    };

    const publicCourses = sortCourses(courses.filter(c => !c.is_private));
    const privateCourses = sortCourses(courses.filter(c => c.is_private));

    return (
        <div className={styles.courseListContainer}>
            {categoryId && (
                <div style={{ marginBottom: '32px', background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/home')} style={{ color: '#64748b', padding: 0 }}>
                            Quay lại Trang chủ
                        </Button>
                    </div>
                    <Space size={16} align="center">
                        <div style={{ width: '48px', height: '48px', background: '#fff', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FolderOpenOutlined style={{ fontSize: '24px', color: '#C72127' }} />
                        </div>
                        <div>
                            <Typography.Title level={2} style={{ margin: 0, color: '#1e293b' }}>{categoryName || 'Danh mục'}</Typography.Title>
                            <Typography.Text type="secondary">{courses.length} khóa học trong danh mục này</Typography.Text>
                        </div>
                    </Space>
                </div>
            )}

            {!categoryId && (
                <div style={{ marginBottom: '32px' }}>
                    <Typography.Title level={2}>Tất cả Khóa học</Typography.Title>
                    <Typography.Text type="secondary">Khám phá và chọn lựa những khóa học phù hợp với bạn</Typography.Text>
                </div>
            )}

            <CourseGrid
                title="Khóa học Riêng tư (Cần phê duyệt)"
                tagLabel="Yêu cầu"
                courses={privateCourses}
                currentPage={currentPagePrivate}
                pageSize={pageSize}
                setCurrentPage={setCurrentPagePrivate}
                renderExtra={<CourseFilter sortBy={sortBy} setSortBy={setSortBy} />}
            />

            <CourseGrid
                title="Khóa học cộng đồng (Tự động)"
                courses={publicCourses}
                currentPage={currentPagePublic}
                pageSize={pageSize}
                setCurrentPage={setCurrentPagePublic}
            />

            {courses.length === 0 && (
                <Empty description="Chưa có khóa học nào được đăng tải" />
            )}
        </div>
    );
}
