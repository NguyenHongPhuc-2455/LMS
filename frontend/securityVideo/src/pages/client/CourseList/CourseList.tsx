import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Skeleton, message, Empty, Typography, Select } from 'antd';
import { LockOutlined } from '@ant-design/icons';
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
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [levelFilter, setLevelFilter] = useState('ALL');
    const [accessFilter, setAccessFilter] = useState('ALL');
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, sortBy, statusFilter, levelFilter, accessFilter, selectedCategoryIds]);

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
                // Fetch all courses for the search query (ignoring specific categoryId for client-side multi-filter)
                const [allData, myData] = await Promise.all([
                    courseService.getAll(searchQuery),
                    courseService.getMyCourses()
                ]);

                setCourses(allData);
                setRegisteredCourses(myData);

                // Update category name display (optional, could be "Nhiều danh mục")
                if (selectedCategoryIds.length === 1) {
                    const cat = categories.find(c => c.id === selectedCategoryIds[0]);
                    setCategoryName(cat ? cat.name : null);
                } else if (selectedCategoryIds.length > 1) {
                    setCategoryName(`${selectedCategoryIds.length} danh mục đã chọn`);
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
    }, [searchQuery, selectedCategoryIds, categories]);

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

    const getFilteredCourses = () => {
        // Map progress data to courses
        // const progressMap = new Map(registeredCourses.map(rc => [rc.id, rc.progressPercent]));
        const progressMap = new Map(
            Array.isArray(registeredCourses)
                ? registeredCourses.map(rc => [rc.id, rc.progressPercent])
                : []
        );

        let list = courses.map(c => ({
            ...c,
            progressPercent: progressMap.get(c.id) // Attach progress if exists
        }));

        // Status Filter
        if (statusFilter === 'IN_PROGRESS') {
            list = list.filter(c => c.progressPercent !== undefined && (c.progressPercent || 0) < 100);
        } else if (statusFilter === 'COMPLETED') {
            list = list.filter(c => (c.progressPercent || 0) === 100);
        } else if (statusFilter === 'MANDATORY') {
            list = list.filter(c => c.is_mandatory);
        } else if (statusFilter === 'FAVORITE') {
            list = []; // Placeholder for favorites
        }

        // Level Filter
        if (levelFilter !== 'ALL') {
            list = list.filter(c => c.level === levelFilter);
        }

        // Access Filter
        if (accessFilter === 'PUBLIC') {
            list = list.filter(c => !c.is_private);
        } else if (accessFilter === 'PRIVATE') {
            list = list.filter(c => c.is_private);
        }

        // Category Multi-filter
        if (selectedCategoryIds.length > 0) {
            list = list.filter(c => {
                // Assuming c.category_id or c.category.id exists
                // Based on previous code, we need to find how category is structured in Course object
                const courseCatId = (c as any).category_id || (c.category as any)?.id;
                return selectedCategoryIds.includes(courseCatId);
            });
        }

        return sortCourses(list);
    };

    const filteredCourses = getFilteredCourses();
    const displayed = filteredCourses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <div className={styles.courseListContainer}>
            {/* <div className={styles.pageHeader}>
                <Typography.Title level={2} className={styles.headerTitle}>Khóa học</Typography.Title>
                <Typography.Text type="secondary" style={{ fontSize: '18px' }}>
                    Khám phá và chọn lựa những khóa học phù hợp
                </Typography.Text>
            </div> */}

            {/* Unified Filter Bar */}
            <div className={styles.unifiedFilterBar}>
                {/* Group 1: Status */}
                <div className={styles.filterGroup}>
                    <div
                        className={`${styles.filterItem} ${statusFilter === 'ALL' ? styles.active : ''}`}
                        onClick={() => setStatusFilter('ALL')}
                    >
                        Tất cả
                    </div>
                    <div
                        className={`${styles.filterItem} ${statusFilter === 'MANDATORY' ? styles.active : ''}`}
                        onClick={() => setStatusFilter('MANDATORY')}
                        style={statusFilter === 'MANDATORY' ? { color: '#fa541c' } : {}}
                    >
                        <LockOutlined style={{ marginRight: 4 }} /> Bắt buộc
                    </div>
                    <div
                        className={`${styles.filterItem} ${statusFilter === 'IN_PROGRESS' ? styles.active : ''}`}
                        onClick={() => setStatusFilter('IN_PROGRESS')}
                    >
                        Đang học
                    </div>
                    <div
                        className={`${styles.filterItem} ${statusFilter === 'COMPLETED' ? styles.active : ''}`}
                        onClick={() => setStatusFilter('COMPLETED')}
                    >
                        Hoàn thành
                    </div>
                    {/* <div 
                        className={`${styles.filterItem} ${statusFilter === 'FAVORITE' ? styles.active : ''}`}
                        onClick={() => setStatusFilter('FAVORITE')}
                    >
                        Yêu thích
                    </div> */}
                </div>

                <div className={styles.separator} />

                {/* Group 2: Level */}
                <div className={styles.filterGroup}>
                    <div
                        className={`${styles.filterItem} ${levelFilter === 'Cơ bản' ? styles.active : ''}`}
                        onClick={() => setLevelFilter(levelFilter === 'Cơ bản' ? 'ALL' : 'Cơ bản')}
                    >
                        <span className={styles.dot} style={{ background: '#3b82f6' }}></span> Cơ bản
                    </div>
                    <div
                        className={`${styles.filterItem} ${levelFilter === 'Trung cấp' ? styles.active : ''}`}
                        onClick={() => setLevelFilter(levelFilter === 'Trung cấp' ? 'ALL' : 'Trung cấp')}
                    >
                        <span className={styles.dot} style={{ background: '#f59e0b' }}></span> Trung cấp
                    </div>
                    <div
                        className={`${styles.filterItem} ${levelFilter === 'Nâng cao' ? styles.active : ''}`}
                        onClick={() => setLevelFilter(levelFilter === 'Nâng cao' ? 'ALL' : 'Nâng cao')}
                    >
                        <span className={styles.dot} style={{ background: '#ef4444' }}></span> Nâng cao
                    </div>
                </div>

                <div className={styles.separator} />

                {/* Group 3: Mode */}
                <div className={styles.filterGroup}>
                    <div
                        className={`${styles.filterItem} ${accessFilter === 'PUBLIC' ? styles.active : ''}`}
                        onClick={() => setAccessFilter(accessFilter === 'PUBLIC' ? 'ALL' : 'PUBLIC')}
                    >
                        Công khai
                    </div>
                    <div
                        className={`${styles.filterItem} ${accessFilter === 'PRIVATE' ? styles.active : ''}`}
                        onClick={() => setAccessFilter(accessFilter === 'PRIVATE' ? 'ALL' : 'PRIVATE')}
                    >
                        Riêng tư
                    </div>
                </div>

                <div className={styles.sortWrapper}>
                    <CourseFilter
                        categories={categories}
                        selectedCategoryId={categoryId}
                        onCategoryChange={handleCategoryChange}
                        sortBy={sortBy}
                        setSortBy={setSortBy}
                        hideCategory={true}
                    />
                </div>
            </div>

            <div className={styles.categoryFilterRow}>
                <div className={styles.filterLabel}>Danh mục</div>
                <Select
                    mode="multiple"
                    placeholder="Chọn danh mục để lọc..."
                    value={selectedCategoryIds}
                    onChange={(values) => setSelectedCategoryIds(values)}
                    allowClear
                    className={styles.multiCategorySelect}
                    options={categories.map(cat => ({ label: cat.name, value: cat.id }))}
                />
            </div>

            {loading ? (
                <div style={{ marginTop: '40px' }}>
                    <Skeleton active paragraph={{ rows: 10 }} />
                </div>
            ) : (
                <>
                    <CourseGrid
                        title={""} // No title needed here as we use headers above
                        courses={filteredCourses}
                        currentPage={currentPage}
                        pageSize={pageSize}
                        setCurrentPage={setCurrentPage}
                    />

                    {filteredCourses.length === 0 && (
                        <Empty
                            description={
                                statusFilter === 'ALL'
                                    ? "Chưa có khóa học nào được đăng tải"
                                    : "Không tìm thấy khóa học nào phù hợp"
                            }
                            style={{ marginTop: '80px' }}
                        />
                    )}
                </>
            )}
        </div>
    );
}
