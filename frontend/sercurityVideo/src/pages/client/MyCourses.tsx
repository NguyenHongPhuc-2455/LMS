import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Empty, Badge, Space, App } from 'antd';
import { BookOutlined, ClockCircleOutlined, RocketOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title, Text } = Typography;

interface Course {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    price: string;
    level: string;
    instructor: { full_name: string };
    _count?: { sections: number };
}

export default function MyCourses() {
    const { message } = App.useApp();
    const navigate = useNavigate();
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchMyCourses = async () => {
        try {
            const res = await api.get('/courses/my-courses');
            setCourses(res.data);
        } catch (error) {
            message.error('Lỗi khi tải danh sách khóa học của bạn');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMyCourses();
    }, []);

    return (
        <div style={{ padding: '20px 0' }}>
            <Title level={2} style={{ marginBottom: 8, color: '#0f172a' }}>Khóa học của tôi</Title>
            <Text style={{ color: '#64748b', display: 'block', marginBottom: 32 }}>
                Bạn đã đăng ký {courses.length} khóa học. Chúc bạn học tập tốt!
            </Text>

            {loading ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {[1, 2, 3, 4].map(i => <Card key={i} loading={true} />)}
                </div>
            ) : courses.length === 0 ? (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description="Bạn chưa đăng ký khóa học nào"
                    style={{ marginTop: 60 }}
                />
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '24px'
                }}>
                    {courses.map(course => (
                        <Card
                            key={course.id}
                            hoverable
                            className="glass-card"
                            style={{ overflow: 'hidden', border: 'none', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                            styles={{ body: { padding: '16px' } }}
                            cover={
                                <div style={{ height: 160, background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', position: 'relative' }}>
                                    {course.thumbnail ? (
                                        <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'white', fontSize: '48px' }}>
                                            <BookOutlined />
                                        </div>
                                    )}
                                </div>
                            }
                            onClick={() => navigate(`/course/${course.id}/learning`)}
                        >
                            <div style={{ marginBottom: 16 }}>
                                <Badge
                                    status="processing"
                                    color="#6366f1"
                                    text={<Text style={{ color: '#6366f1', fontWeight: 700, fontSize: '11px' }}>{course.level?.toUpperCase() || 'OFFICIAL'}</Text>}
                                />
                                <Title level={5} style={{ marginTop: 8, marginBottom: 0, color: '#1e293b', fontSize: '16px', lineHeight: 1.4 }}>
                                    {course.title}
                                </Title>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                <Space direction="vertical" size={2}>
                                    <Text style={{ color: '#94a3b8', fontSize: '11px' }}>Người tạo</Text>
                                    <Text strong style={{ color: '#475569', fontSize: '13px' }}>{course.instructor?.full_name || 'Hệ thống'}</Text>
                                </Space>
                            </div>

                            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '12px' }}>
                                <Space size={6}><ClockCircleOutlined style={{ fontSize: '14px' }} /> Tiếp tục học</Space>
                                <Space size={6}><RocketOutlined style={{ fontSize: '14px' }} /> {course._count?.sections || 0} chương</Space>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
