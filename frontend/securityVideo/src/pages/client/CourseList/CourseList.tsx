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

import MyCourseGrid from './components/MyCourseGrid';

export default function CourseList() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [registeredCourses, setRegisteredCourses] = useState<any[]>([]);
    const [categoryName, setCategoryName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [categories, setCategories] = useState<any[]>([]);
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId') ? parseInt(searchParams.get('categoryId') as string) : undefined;

    // Phân trang & Sắp xếp
    const [currentPageMy, setCurrentPageMy] = useState(1);
    const [currentPagePrivate, setCurrentPagePrivate] = useState(1);
    const [currentPagePublic, setCurrentPagePublic] = useState(1);
    const [sortBy, setSortBy] = useState('newest');
    const pageSize = 5;

    useEffect(() => {
        setCurrentPageMy(1);
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
                // Fetch all courses and my courses in parallel
                const [allData, myData] = await Promise.all([
                    courseService.getAll(searchQuery, categoryId),
                    courseService.getMyCourses()
                ]);

                setCourses(allData);
                setRegisteredCourses(myData);

                if (categoryId) {
                    const currentCat = categories.find(c => c.id === categoryId);
                    if (currentCat) setCategoryName(currentCat.name);
                    else {
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
                setIsInitialLoading(false);
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

    if (isInitialLoading) {
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
            case 'progress-desc':
                sorted.sort((a: any, b: any) => (b.progressPercent || 0) - (a.progressPercent || 0));
                break;
            case 'progress-asc':
                sorted.sort((a: any, b: any) => (a.progressPercent || 0) - (b.progressPercent || 0));
                break;
            case 'recent':
                sorted.sort((a: any, b: any) => new Date(b.lastActivity || b.enrolledAt || b.created_at).getTime() - new Date(a.lastActivity || a.enrolledAt || a.created_at).getTime());
                break;
            case 'old-view':
                sorted.sort((a: any, b: any) => new Date(a.lastActivity || a.enrolledAt || a.created_at).getTime() - new Date(b.lastActivity || b.enrolledAt || b.created_at).getTime());
                break;
        }
        return sorted;
    };

    // Filter out registered courses from the main list
    const registeredIds = new Set(registeredCourses.map(rc => rc.id));
    const availableCourses = courses.filter(c => !registeredIds.has(c.id));

    const sortedRegisteredCourses = sortCourses(registeredCourses);
    const publicCourses = sortCourses(availableCourses.filter(c => !c.is_private));
    const privateCourses = sortCourses(availableCourses.filter(c => c.is_private));

    return (
        <div className={styles.courseListContainer}>
            <div style={{ marginBottom: '32px' }}>
                <Typography.Title level={2}>Tất cả Khóa học</Typography.Title>
                <Typography.Title level={5} type="secondary" style={{ fontWeight: 400, marginTop: 0 }}>
                    {categoryId
                        ? `Đang hiển thị các khóa học thuộc danh mục "${categoryName || '...'}"`
                        : "Khám phá và chọn lựa những khóa học phù hợp với bạn"}
                </Typography.Title>
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

            {loading ? (
                <div style={{ marginTop: '40px' }}>
                    <Skeleton active paragraph={{ rows: 6 }} />
                    <Skeleton active paragraph={{ rows: 6 }} style={{ marginTop: '40px' }} />
                </div>
            ) : (
                <>
                    {registeredCourses.length > 0 && (
                        <MyCourseGrid
                            title="Khóa học của tôi"
                            courses={sortedRegisteredCourses}
                            currentPage={currentPageMy}
                            pageSize={pageSize}
                            setCurrentPage={setCurrentPageMy}
                        />
                    )}

                    <CourseGrid
                        title="Khóa học Riêng tư (Cần phê duyệt)"
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
                        <Empty description="Chưa có khóa học nào được đăng tải" style={{ marginTop: '40px' }} />
                    )}
                </>
            )}
        </div>
    );
}
