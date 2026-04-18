import { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Typography, Button, Empty, Skeleton, Tag, Space } from 'antd';
import { PlayCircleOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../../api';
import './MyCourses.scss';

const { Title, Text } = Typography;

export default function MyCourses() {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchMyCourses = async () => {
        try {
            const res = await api.get('/courses/my-courses');
            setCourses(res.data);
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
            <div className="my-courses-loading">
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    return (
        <div className="my-courses-container">
            <div className="my-courses-header">
                <Title level={2} className="header-title">Khóa học của tôi</Title>
                <Text type="secondary">Quản lý tiến độ và tiếp tục hành trình rèn luyện kỹ năng của bạn.</Text>
            </div>

            {courses.length === 0 ? (
                <Card bordered={false} className="glass-card empty-courses-card">
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
                <Row gutter={[24, 24]}>
                    {courses.map(course => (
                        <Col xs={24} sm={12} lg={8} xl={6} key={course.id}>
                            <Card
                                hoverable
                                cover={
                                    <div className="course-card-cover">
                                        <img
                                            alt={course.title}
                                            src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'}
                                            className="course-thumb"
                                        />
                                        <div className="status-tag-wrapper">
                                            <Tag color={course.progressPercent === 100 ? 'success' : 'processing'} className="status-tag">
                                                {course.progressPercent === 100 ? 'HOÀN THÀNH' : 'ĐANG HỌC'}
                                            </Tag>
                                        </div>
                                    </div>
                                }
                                className="progress-course-card"
                                onClick={() => navigate(`/course/${course.id}/learning${course.nextLessonId ? `?lessonId=${course.nextLessonId}` : ''}`)}
                            >
                                <div className="course-card-title-wrapper">
                                    <Title level={5} className="course-card-title line-clamp-2">
                                        {course.title}
                                    </Title>
                                </div>

                                <div className="course-progress-section">
                                    <div className="progress-info">
                                        <Text className="progress-label">Tiến độ</Text>
                                        <Text strong className="progress-percent">{course.progressPercent}%</Text>
                                    </div>
                                    <Progress
                                        percent={course.progressPercent}
                                        showInfo={false}
                                        strokeColor={{ '0%': '#6366f1', '100%': '#a855f7' }}
                                        trailColor="#f1f5f9"
                                        strokeWidth={6}
                                    />
                                </div>

                                <div className="course-card-footer">
                                    <Space size={12} className="stats-space">
                                        <span><BookOutlined /> {course.completedLessons}/{course.totalLessons} bài</span>
                                    </Space>
                                    <Text type="secondary" className="date-text">
                                        <ClockCircleOutlined /> {new Date(course.enrolledAt).toLocaleDateString('vi-VN')}
                                    </Text>
                                </div>

                                <Button
                                    type="primary"
                                    block
                                    icon={<PlayCircleOutlined />}
                                    className={`continue-btn ${course.progressPercent === 100 ? 'completed' : ''}`}
                                >
                                    {course.progressPercent === 100 ? 'Xem lại bài học' : 'Tiếp tục học'}
                                </Button>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}
        </div>
    );
}

