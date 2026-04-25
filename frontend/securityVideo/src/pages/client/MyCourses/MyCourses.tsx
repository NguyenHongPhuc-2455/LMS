import { useEffect, useState } from 'react';
import { Card, Progress, Typography, Button, Empty, Skeleton, Tag, Space } from 'antd';
import { PlayCircleOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/course.service';
import styles from './MyCourses.module.scss';

const { Title, Text } = Typography;

export default function MyCourses() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchMyCourses = async () => {
        try {
            const data = await courseService.getMyCourses();
            setCourses(data);

        } catch (error) {
            console.error('Lỗi fetch khóa học:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCourses();
    }, []);

    if (loading) {
        return (
            <div className={styles.myCoursesLoading}>
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    return (
        <div className={styles.myCoursesContainer}>
            <div className={styles.myCoursesHeader}>
                <Title level={2} className={styles.headerTitle}>Khóa học của tôi</Title>
                <Text type="secondary">Quản lý tiến độ và tiếp tục hành trình rèn luyện kỹ năng của bạn.</Text>
            </div>

            {courses.length === 0 ? (
                <Card bordered={false} className={`glass-card ${styles.emptyCoursesCard}`}>
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <Space direction="vertical">
                                <Text type="secondary">Bạn chưa tham gia khóa học nào.</Text>
                                <Button type="primary" onClick={() => navigate('/all-courses')}>Khám phá khóa học ngay</Button>
                            </Space>
                        }
                    />
                </Card>
            ) : (
                <div className={styles.coursesGrid}>
                    {courses.map(course => (
                        <div key={course.id}>
                            <Card
                                hoverable
                                cover={
                                    <div className={styles.courseCardCover}>
                                        <img
                                            alt={course.title}
                                            src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'}
                                            className={styles.courseThumb}
                                        />
                                        <div className={styles.statusTagWrapper}>
                                            <Tag color={course.progressPercent === 100 ? 'success' : 'processing'} className={styles.statusTag}>
                                                {course.progressPercent === 100 ? 'HOÀN THÀNH' : 'ĐANG HỌC'}
                                            </Tag>
                                        </div>
                                    </div>
                                }
                                className={styles.progressCourseCard}
                                onClick={() => navigate(`/course/${course.id}/learning${course.nextLessonId ? `?lessonId=${course.nextLessonId}` : ''}`)}
                            >
                                <div className={styles.courseCardTitleWrapper}>
                                    <Title level={5} className={`${styles.courseCardTitle} line-clamp-2`}>
                                        {course.title}
                                    </Title>
                                </div>

                                <div className={styles.courseProgressSection}>
                                    <div className={styles.progressInfo}>
                                        <Text className={styles.progressLabel}>Tiến độ</Text>
                                        <Text strong className={styles.progressPercent}>{course.progressPercent}%</Text>
                                    </div>
                                    <Progress
                                        percent={course.progressPercent}
                                        showInfo={false}
                                        strokeColor={{ '0%': '#C72127', '100%': '#991b1b' }}
                                        trailColor="#f1f5f9"
                                        strokeWidth={6}
                                    />
                                </div>

                                <div className={styles.courseCardFooter}>
                                    <Space size={12} className={styles.statsSpace}>
                                        <span><BookOutlined /> {course.completedLessons}/{course.totalLessons} bài</span>
                                    </Space>
                                    <Text type="secondary" className={styles.dateText}>
                                        <ClockCircleOutlined /> {new Date(course.enrolledAt).toLocaleDateString('vi-VN')}
                                    </Text>
                                </div>

                                <Button
                                    type="primary"
                                    block
                                    icon={<PlayCircleOutlined />}
                                    className={`${styles.continueBtn} ${course.progressPercent === 100 ? styles.completed : ''}`}
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
            )}
        </div>
    );
}

