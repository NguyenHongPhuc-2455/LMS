import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Skeleton, message, Empty, Typography } from 'antd';
import { courseService } from '../../../services/course.service';
import { categoryService } from '../../../services/category.service';
import styles from './CourseList.module.scss';

// Sub-components
import CourseFilter from './components/CourseFilter';
import CourseGrid from './components/CourseGrid';
import type { Course } from '../components/CourseCard';

export default function CourseList() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [categoryName, setCategoryName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
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
        const fetchInitialData = async () => {
            try {
                const cats = await categoryService.getAllCategories();
                setCategories(cats);
            } catch (e) { console.error('Lỗi tải danh mục'); }
        };
        fetchInitialData();
    }, []);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const data = await courseService.getAll(searchQuery, categoryId);
                setCourses(data);

                if (categoryId) {
                    const currentCat = categories.find(c => c.id === categoryId);
                    if (currentCat) setCategoryName(currentCat.name);
                    else {
                        // If not found in current state, maybe it's not loaded yet or invalid
                        const cats = await categoryService.getAllCategories();
                        const findCat = cats.find(c => c.id === categoryId);
                        if (findCat) setCategoryName(findCat.name);
                    }
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
    }, [searchQuery, categoryId, categories]);

    const handleCategoryChange = (id: number | undefined) => {
        if (id) {
            searchParams.set('categoryId', id.toString());
        } else {
            searchParams.delete('categoryId');
        }
        setSearchParams(searchParams);
    };

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
            <div style={{ marginBottom: '32px' }}>
                <Typography.Title level={2}>Tất cả Khóa học</Typography.Title>
                <Typography.Text type="secondary">
                    {categoryId
                        ? `Đang hiển thị các khóa học thuộc danh mục "${categoryName || '...'}"`
                        : "Khám phá và chọn lựa những khóa học phù hợp với bạn"}
                </Typography.Text>
            </div>

            <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'flex-start' }}>
                <CourseFilter
                    categories={categories}
                    selectedCategoryId={categoryId}
                    onCategoryChange={handleCategoryChange}
                    sortBy={sortBy}
                    setSortBy={setSortBy}
                />
            </div>

            <CourseGrid
                title="Khóa học Riêng tư (Cần phê duyệt)"
                // tagLabel="Yêu cầu"
                courses={privateCourses}
                currentPage={currentPagePrivate}
                pageSize={pageSize}
                setCurrentPage={setCurrentPagePrivate}
            />

            <CourseGrid
                title="Khóa học cộng đồng (Khóa học Công khai)"
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
