import { useEffect, useState } from 'react';
import { Skeleton, message, Empty, Typography } from 'antd';
import { courseService } from '../../../services/course.service';
import styles from '../CourseList/CourseList.module.scss';

// Sub-components
import CourseGrid from '../CourseList/components/CourseGrid';
import type { Course } from '../components/CourseCard';

const { Title } = Typography;

interface CategoryGroup {
    id: number | string;
    name: string;
    courses: Course[];
}

export default function CategorizedCourses() {
    const [categorizedData, setCategorizedData] = useState<CategoryGroup[]>([]);
    const [loading, setLoading] = useState(true);

    // Pagination states for each category
    const [pageStates, setPageStates] = useState<Record<string, number>>({});
    const pageSize = 4;

    useEffect(() => {
        const fetchAndGroup = async () => {
            try {
                setLoading(true);
                const courses: Course[] = await courseService.getAll();

                // Group by category
                const groups: Record<string, CategoryGroup> = {};

                courses.forEach(course => {
                    const catId = course.category?.name || 'Khác';
                    const catName = course.category?.name || 'Chưa phân loại';

                    if (!groups[catId]) {
                        groups[catId] = {
                            id: catId,
                            name: catName,
                            courses: []
                        };
                    }
                    groups[catId].courses.push(course);
                });

                setCategorizedData(Object.values(groups));

                // Initialize page states
                const initialPages: Record<string, number> = {};
                Object.keys(groups).forEach(id => {
                    initialPages[id] = 1;
                });
                setPageStates(initialPages);

            } catch (error) {
                message.error('Lỗi khi tải danh sách khóa học');
            } finally {
                setLoading(false);
            }
        };
        fetchAndGroup();
    }, []);

    if (loading) {
        return (
            <div className={styles.loaderContainer} style={{ padding: '40px' }}>
                <Skeleton active paragraph={{ rows: 10 }} />
                <Skeleton active paragraph={{ rows: 10 }} style={{ marginTop: '40px' }} />
            </div>
        );
    }

    const setPageForCategory = (catId: string | number, page: number) => {
        setPageStates(prev => ({ ...prev, [catId]: page }));
    };

    return (
        <div className={styles.courseListContainer} style={{ padding: '20px' }}>
            <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                <Title level={1}>Khám phá theo Danh mục</Title>
                <Typography.Text type="secondary">Tìm kiếm khóa học phù hợp với lĩnh vực của bạn</Typography.Text>
            </div>

            {categorizedData.map(group => (
                <CourseGrid
                    key={group.id}
                    title={group.name}
                    courses={group.courses}
                    currentPage={pageStates[group.id] || 1}
                    pageSize={pageSize}
                    setCurrentPage={(page) => setPageForCategory(group.id, page)}
                />
            ))}

            {categorizedData.length === 0 && (
                <Empty description="Chưa có khóa học nào được đăng tải" />
            )}
        </div>
    );
}
