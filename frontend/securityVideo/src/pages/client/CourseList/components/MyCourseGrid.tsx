import { Typography, Card, Progress, Tag, Button, Space, Pagination } from 'antd';
import { PlayCircleOutlined, BookOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from '../CourseList.module.scss';
import myStyles from '../../MyCourses/MyCourses.module.scss';

const { Title, Text } = Typography;

interface MyCourseGridProps {
    title: string;
    courses: any[];
    currentPage: number;
    pageSize: number;
    setCurrentPage: (page: number) => void;
}

export default function MyCourseGrid({
    title,
    courses,
    currentPage,
    pageSize,
    setCurrentPage
}: MyCourseGridProps) {
    const navigate = useNavigate();

    const displayedCourses = courses.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    if (courses.length === 0) return null;

    return (
        <div className={styles.courseSection}>
            <div className={styles.sectionHeader}>
                <Title level={2} className={styles.sectionTitle}>{title}</Title>
            </div>

            <div className={styles.courseGrid}>
                {displayedCourses.map(course => (
                    <div key={course.id}>
                        <Card
                            hoverable
                            cover={
                                <div className={myStyles.courseCardCover}>
                                    <img
                                        alt={course.title}
                                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'}
                                        className={myStyles.courseThumb}
                                    />
                                    <div className={myStyles.statusTagWrapper}>
                                        <Tag color={course.progressPercent === 100 ? 'success' : 'processing'} className={myStyles.statusTag}>
                                            {course.progressPercent === 100 ? 'HOÀN THÀNH' : 'ĐANG HỌC'}
                                        </Tag>
                                    </div>
                                </div>
                            }
                            className={myStyles.progressCourseCard}
                            onClick={() => navigate(`/course/${course.id}/learning${course.nextLessonId ? `?lessonId=${course.nextLessonId}` : ''}`)}
                        >
                            <div className={myStyles.courseCardTitleWrapper}>
                                <Title level={5} className={`${myStyles.courseCardTitle} line-clamp-2`}>
                                    {course.title}
                                </Title>
                            </div>

                            <div className={myStyles.courseProgressSection}>
                                <div className={myStyles.progressInfo}>
                                    <Text className={myStyles.progressLabel}>Tiến độ</Text>
                                    <Text strong className={myStyles.progressPercent}>{course.progressPercent}%</Text>
                                </div>
                                <Progress
                                    percent={course.progressPercent}
                                    showInfo={false}
                                    strokeColor={{ '0%': '#C72127', '100%': '#991b1b' }}
                                    trailColor="#f1f5f9"
                                    strokeWidth={6}
                                />
                            </div>

                            <div className={myStyles.courseCardFooter}>
                                <Space size={12} className={myStyles.statsSpace}>
                                    <span><BookOutlined /> {course.completedLessons}/{course.totalLessons} bài</span>
                                </Space>
                                <Text type="secondary" className={myStyles.dateText}>
                                    <ClockCircleOutlined /> {new Date(course.enrolledAt).toLocaleDateString('vi-VN')}
                                </Text>
                            </div>

                            <Button
                                type="primary"
                                block
                                icon={<PlayCircleOutlined />}
                                className={`${myStyles.continueBtn} ${course.progressPercent === 100 ? myStyles.completed : ''}`}
                                style={{
                                    background: course.progressPercent === 100 ? '#10b981' : '#C72127',
                                    borderColor: course.progressPercent === 100 ? '#10b981' : '#C72127',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {course.progressPercent === 100 ? 'Xem lại bài học' : 'Tiếp tục học'}
                            </Button>
                        </Card>
                    </div>
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
