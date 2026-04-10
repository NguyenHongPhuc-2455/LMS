import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BookOutlined, UserOutlined, ClockCircleOutlined,
    RocketOutlined, FilterOutlined, TagOutlined
} from '@ant-design/icons';
import { Card, Tag, Badge, Typography, Button, Space, message, Skeleton, Empty } from 'antd';
import api from '../api';

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
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const res = await api.get('/courses');
                setCourses(res.data);
            } catch (error) {
                message.error('Lỗi khi tải danh sách khóa học');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    if (loading) {
        return (
            <div style={{ padding: '60px 40px' }}>
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    return (
        <div style={{ padding: '40px 5%', minHeight: '100vh' }}>
            <div style={{ marginBottom: 48, textAlign: 'center' }}>
                <Title className="premium-title" style={{ fontSize: '42px', marginBottom: 12 }}>
                    Thư Viện Bài Giảng Đặc Biệt
                </Title>
                <Text style={{ color: 'var(--text-muted)', fontSize: '18px' }}>
                    Nâng tầm kiến thức với lộ trình bài bản và bảo mật tuyệt đối
                </Text>
            </div>

            {courses.length === 0 ? (
                <Empty description="Chưa có khóa học nào được đăng tải" />
            ) : (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                    gap: '32px'
                }}>
                    {courses.map(course => (
                        <Card
                            key={course.id}
                            hoverable
                            className="glass-card"
                            style={{ overflow: 'hidden', border: 'none' }}
                            cover={
                                <div style={{ height: 180, background: 'linear-gradient(135deg, #0061ff 0%, #60a5fa 100%)', position: 'relative' }}>
                                    {course.thumbnail ? (
                                        <img src={course.thumbnail} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'white', fontSize: '40px' }}>
                                            <BookOutlined />
                                        </div>
                                    )}
                                    <div style={{ position: 'absolute', top: 12, right: 12 }}>
                                        <Tag color="blue" style={{ borderRadius: 6, padding: '2px 8px' }}>
                                            {course.category?.name || 'Chung'}
                                        </Tag>
                                    </div>
                                </div>
                            }
                            onClick={() => navigate(`/course/${course.id}`)}
                        >
                            <div style={{ marginBottom: 16 }}>
                                <Badge status="processing" text={<Text style={{ color: 'var(--primary-color)', fontWeight: 600, fontSize: '12px' }}>{course.level?.toUpperCase() || 'OFFICIAL'}</Text>} />
                                <Title level={4} style={{ marginTop: 8, marginBottom: 8, color: 'var(--text-main)' }}>{course.title}</Title>
                                <Paragraph ellipsis={{ rows: 2 }} style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                                    {course.description}
                                </Paragraph>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
                                <Space orientation="vertical" size={0}>
                                    <Text style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Giảng viên</Text>
                                    <Space size={4}>
                                        <UserOutlined style={{ fontSize: '12px' }} />
                                        <Text strong style={{ color: 'var(--text-main)' }}>{course.instructor?.full_name || course.instructor?.username || 'Hệ thống'}</Text>
                                    </Space>
                                </Space>
                                <div style={{ textAlign: 'right' }}>
                                    <Text style={{ fontSize: '20px', fontWeight: 800, color: '#28a745' }}>
                                        {parseFloat(course.price) === 0 ? 'MIỄN PHÍ' : `${Number(course.price).toLocaleString()}đ`}
                                    </Text>
                                </div>
                            </div>

                            <hr style={{ margin: '16px 0', border: '0.1px solid var(--border-color)' }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
                                <Space><ClockCircleOutlined /> Lộ trình bài bản</Space>
                                <Space><RocketOutlined /> {course._count?.sections || 0} chương học</Space>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
