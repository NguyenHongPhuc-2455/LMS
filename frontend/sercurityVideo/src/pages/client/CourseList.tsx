import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    BookOutlined, ClockCircleOutlined,
    RocketOutlined, FilterOutlined, TagOutlined
} from '@ant-design/icons';
import { Card, Badge, Typography, Button, Space, message, Skeleton, Empty } from 'antd';
import api from '../../api';

const { Title, Text, Paragraph } = Typography;

interface Course {
    id: number;
    title: string;
    description: string;
    price: string;
    level: string;
    thumbnail: string;
    category?: { name: string };
    instructor?: { full_name: string; username: string };
    _count?: { sections: number };
}

export default function CourseList() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/courses${searchQuery ? `?search=${searchQuery}` : ''}`);
                setCourses(res.data);
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
            <div style={{ padding: '60px 40px' }}>
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    const freeCourses = courses.filter(c => parseFloat(c.price) === 0);
    const proCourses = courses.filter(c => parseFloat(c.price) > 0);

    return (
        <div style={{ padding: '10px 3%', minHeight: '100vh' }}>
            {/* Mục Khóa học Pro */}
            {proCourses.length > 0 && (
                <div style={{ marginBottom: 48 }}>
                    <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 12 }}>
                        <Title level={2} style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>
                            Khóa học Pro
                        </Title>
                        <Badge count="Mới" style={{ backgroundColor: '#f59e0b' }} />
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '20px'
                    }}>
                        {proCourses.map(course => (
                            <CourseCard key={course.id} course={course} navigate={navigate} />
                        ))}
                    </div>
                </div>
            )}

            {/* Mục Khóa học Miễn phí */}
            {freeCourses.length > 0 && (
                <div style={{ marginBottom: 48 }}>
                    <div style={{ marginBottom: 24 }}>
                        <Title level={2} style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>
                            Khóa học miễn phí
                        </Title>
                    </div>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr)',
                        gap: '20px'
                    }}>
                        {freeCourses.map(course => (
                            <CourseCard key={course.id} course={course} navigate={navigate} />
                        ))}
                    </div>
                </div>
            )}

            {courses.length === 0 && (
                <Empty description="Chưa có khóa học nào được đăng tải" />
            )}
        </div>
    );
}

// Tách Card thành component con để tái sử dụng
function CourseCard({ course, navigate }: { course: Course, navigate: any }) {
    return (
        <Card
            hoverable
            className="glass-card course-hover-card"
            style={{ overflow: 'hidden', border: 'none', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            styles={{ body: { padding: '16px' } }}
            cover={
                <div style={{ height: 140, background: 'linear-gradient(135deg, #0061ff 0%, #60a5fa 100%)', position: 'relative' }}>
                    {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'white', fontSize: '32px' }}>
                            <BookOutlined />
                        </div>
                    )}
                </div>
            }
            onClick={() => navigate(`/course/${course.id}`)}
        >
            <div style={{ marginBottom: 12 }}>
                <Badge status="processing" text={<Text style={{ color: '#6366f1', fontWeight: 600, fontSize: '11px' }}>{course.level?.toUpperCase() || 'OFFICIAL'}</Text>} />
                <Title level={5} style={{ marginTop: 4, marginBottom: 4, color: '#1e293b', fontSize: '16px' }}>{course.title}</Title>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space direction="vertical" size={0}>
                    <Text style={{ color: '#94a3b8', fontSize: '11px' }}>Người tạo</Text>
                    <Text strong style={{ color: '#64748b', fontSize: '13px' }}>{course.instructor?.full_name || 'Hệ thống'}</Text>
                </Space>
                <div style={{ textAlign: 'right' }}>
                    <Text style={{ fontSize: '15px', fontWeight: 800, color: parseFloat(course.price) === 0 ? '#28a745' : '#1e293b' }}>
                        {parseFloat(course.price) === 0 ? 'MIỄN PHÍ' : `${Number(course.price).toLocaleString()}đ`}
                    </Text>
                </div>
            </div>

            <hr style={{ margin: '12px 0', border: '0.1px solid #f1f5f9' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: '11px' }}>
                <Space size={4}><ClockCircleOutlined /> Lộ trình</Space>
                <Space size={4}><RocketOutlined /> {course._count?.sections || 0} chương</Space>
            </div>

            <style>{`
                .course-hover-card {
                    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
                }
                .course-hover-card:hover {
                    transform: translateY(-8px) scale(1.02);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important;
                }
                .course-hover-card .ant-card-cover img {
                    transition: transform 0.5s ease;
                }
                .course-hover-card:hover .ant-card-cover img {
                    transform: scale(1.1);
                }
            `}</style>
        </Card>
    );
}
