import { Typography, Tag, Pagination, Empty } from 'antd';
import CourseCard from '../../components/CourseCard';
import type { Course } from '../../components/CourseCard';
import styles from '../CourseList.module.scss';

const { Title } = Typography;

interface CourseGridProps {
    title: string;
    tagLabel?: string;
    courses: Course[];
    currentPage: number;
    pageSize: number;
    setCurrentPage: (page: number) => void;
}

export default function CourseGrid({
    title,
    tagLabel,
    courses,
    currentPage,
    pageSize,
    setCurrentPage
}: CourseGridProps) {
    const displayedCourses = courses.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    if (courses.length === 0 && !tagLabel) return null;
    if (courses.length === 0) return <Empty description={`Chưa có ${title.toLowerCase()}`} />;

    return (
        <div className={styles.courseSection}>
            <div className={styles.sectionHeader}>
                <Title level={2} className={styles.sectionTitle}>{title}</Title>
                {tagLabel && <Tag color="error" className={styles.statusTag}>{tagLabel}</Tag>}
            </div>

            <div className={styles.courseGrid}>
                {displayedCourses.map(course => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>

            {courses.length > pageSize && (
                <div className={styles.paginationWrapper}>
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={courses.length}
                        onChange={(page) => setCurrentPage(page)}
                        showSizeChanger={false}
                        itemRender={(_, type, originalElement) => {
                            const totalPages = Math.ceil(courses.length / pageSize);
                            if (type === 'prev') {
                                return (
                                    <div
                                        onClick={() => currentPage === 1 && setCurrentPage(totalPages)}
                                        className={styles.pageItemWrapper}
                                    >
                                        {originalElement}
                                    </div>
                                );
                            }
                            if (type === 'next') {
                                return (
                                    <div
                                        onClick={() => currentPage === totalPages && setCurrentPage(1)}
                                        className={styles.pageItemWrapper}
                                    >
                                        {originalElement}
                                    </div>
                                );
                            }
                            return originalElement;
                        }}
                    />
                </div>
            )}
        </div>
    );
}
