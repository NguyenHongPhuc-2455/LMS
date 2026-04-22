import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Skeleton, message, Empty } from 'antd';
import { courseService } from '../../../services/course.service';
import styles from './CourseList.module.scss';

// Sub-components
import CourseFilter from './components/CourseFilter';
import CourseGrid from './components/CourseGrid';
import type { Course } from '../components/CourseCard';

export default function CourseList() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const searchQuery = searchParams.get('search') || '';

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
                const data = await courseService.getAll(searchQuery);
                setCourses(data);
            } catch (error) {
                message.error('Lỗi khi tải danh sách khóa học');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [searchQuery]);

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
