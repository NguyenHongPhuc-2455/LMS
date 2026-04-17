import { useEffect, useState } from 'react';
import { Card, Row, Col, Progress, Typography, Button, Empty, Skeleton, Tag, Space } from 'antd';
import { PlayCircleOutlined, ClockCircleOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

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
            <div style={{ padding: '40px' }}>
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    return (
        <div style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', minHeight: '80vh' }}>
            <div style={{ marginBottom: '40px' }}>
                <Title level={2} style={{ color: '#0f172a', marginBottom: '8px' }}>Khóa học của tôi</Title>
                <Text type="secondary">Quản lý tiến độ và tiếp tục hành trình rèn luyện kỹ năng của bạn.</Text>
            </div>

            {courses.length === 0 ? (
                <Card style={{ textAlign: 'center', padding: '60px 0', borderRadius: '20px' }} bordered={false} className="glass-card">
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
                                    <div style={{ height: '160px', overflow: 'hidden', position: 'relative' }}>
                                        <img
                                            alt={course.title}
                                            src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80'}
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                        <div style={{ position: 'absolute', top: 12, right: 12 }}>
                                            <Tag color={course.progressPercent === 100 ? 'success' : 'processing'} style={{ borderRadius: '6px', fontWeight: 600 }}>
                                                {course.progressPercent === 100 ? 'HOÀN THÀNH' : 'ĐANG HỌC'}
                                            </Tag>
                                        </div>
                                    </div>
                                }
                                bodyStyle={{ padding: '20px' }}
                                style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid #f1f5f9' }}
                                className="progress-course-card"
                                onClick={() => navigate(`/course/${course.id}/learning${course.nextLessonId ? `?lessonId=${course.nextLessonId}` : ''}`)}
                            >
                                <div style={{ height: '48px', overflow: 'hidden', marginBottom: '12px' }}>
                                    <Title level={5} style={{ margin: 0, lineHeight: 1.4 }} className="line-clamp-2">
                                        {course.title}
                                    </Title>
                                </div>

                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <Text style={{ fontSize: '13px', color: '#64748b' }}>Tiến độ</Text>
                                        <Text strong style={{ fontSize: '13px', color: '#6366f1' }}>{course.progressPercent}%</Text>
                                    </div>
                                    <Progress
                                        percent={course.progressPercent}
                                        showInfo={false}
                                        strokeColor={{ '0%': '#6366f1', '100%': '#a855f7' }}
                                        trailColor="#f1f5f9"
                                        strokeWidth={6}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <Space size={12} style={{ color: '#64748b', fontSize: '12px' }}>
                                        <span><BookOutlined /> {course.completedLessons}/{course.totalLessons} bài</span>
                                    </Space>
                                    <Text type="secondary" style={{ fontSize: '11px' }}>
                                        <ClockCircleOutlined /> {new Date(course.enrolledAt).toLocaleDateString('vi-VN')}
                                    </Text>
                                </div>

                                <Button
                                    type="primary"
                                    block
                                    icon={<PlayCircleOutlined />}
                                    style={{
                                        borderRadius: '10px',
                                        height: '40px',
                                        fontWeight: 600,
                                        background: course.progressPercent === 100 ? '#10b981' : '#6366f1',
                                        borderColor: course.progressPercent === 100 ? '#10b981' : '#6366f1'
                                    }}
                                >
                                    {course.progressPercent === 100 ? 'Xem lại bài học' : 'Tiếp tục học'}
                                </Button>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            <style>{`
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                .progress-course-card {
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                .progress-course-card:hover {
                    transform: translateY(-8px);
                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04) !important;
                }
            `}</style>
        </div>
    );
}
