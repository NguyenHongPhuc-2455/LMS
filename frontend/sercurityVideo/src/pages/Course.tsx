import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    PlayCircleOutlined, LockOutlined, CheckCircleOutlined,
    LeftOutlined, ShoppingCartOutlined, BookOutlined,
    FileTextOutlined, QuestionCircleOutlined, UserOutlined
} from '@ant-design/icons';
import {
    Layout, Collapse, List, Typography, Button,
    Tag, Space, message, Skeleton, Divider, Avatar
} from 'antd';
import VideoPlayer from '../components/VideoPlayer';
import api from '../api';

const { Content, Sider } = Layout;
const { Title, Text, Paragraph } = Typography;

interface Lesson {
    id: number;
    title: string;
    type: 'VIDEO' | 'DOCUMENT' | 'QUIZ';
    video_url: string;
    is_free: boolean;
    duration: number;
}

interface Section {
    id: number;
    title: string;
    lessons: Lesson[];
}

interface Course {
    id: number;
    title: string;
    description: string;
    price: string;
    hasAccess: boolean;
    sections: Section[];
    instructor: { full_name: string; bio: string; avatar: string };
}

export default function Course() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

    const fetchDetail = async () => {
        try {
            const res = await api.get(`/courses/${id}`);
            const data = res.data;
            setCourse(data);

            // Tự động chọn bài đầu tiên được phép xem
            if (data.sections.length > 0) {
                const firstLesson = data.sections[0].lessons[0];
                if (firstLesson) setActiveLesson(firstLesson);
            }
        } catch (error: any) {
            message.error('Lỗi khi tải nội dung khóa học');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleBuy = async () => {
        try {
            const res = await api.post('/payments/buy', { courseId: id });
            message.success(res.data.message);
            fetchDetail(); // Reload để lấy quyền truy cập
        } catch (error: any) {
            message.error(error.response?.data?.error || 'Lỗi thanh toán');
        }
    };

    const renderLessonIcon = (lesson: Lesson) => {
        if (!course?.hasAccess && !lesson.is_free) return <LockOutlined style={{ color: '#ff4d4f' }} />;
        switch (lesson.type) {
            case 'VIDEO': return <PlayCircleOutlined style={{ color: '#1890ff' }} />;
            case 'DOCUMENT': return <FileTextOutlined style={{ color: '#52c41a' }} />;
            case 'QUIZ': return <QuestionCircleOutlined style={{ color: '#faad14' }} />;
            default: return <PlayCircleOutlined />;
        }
    };

    if (loading) return <div style={{ padding: 50 }}><Skeleton active /></div>;
    if (!course) return <div>Không tìm thấy dữ liệu</div>;

    return (
        <Layout style={{ minHeight: '100vh', background: 'var(--bg-color)' }}>
            <Content style={{ padding: '24px', overflowY: 'auto' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <Button
                        icon={<LeftOutlined />}
                        onClick={() => navigate('/')}
                        style={{ marginBottom: 20, background: 'transparent', color: 'black' }}
                    >
                        Quay lại trang chủ
                    </Button>

                    <div className="glass-card" style={{ padding: '0', overflow: 'hidden', marginBottom: 24 }}>
                        {activeLesson && activeLesson.type === 'VIDEO' && (course.hasAccess || activeLesson.is_free) ? (
                            activeLesson.video_url ? (
                                <VideoPlayer
                                    src={activeLesson.video_url.startsWith('http') ? activeLesson.video_url : `http://localhost:5000${activeLesson.video_url}`}
                                    lessonId={activeLesson.id}
                                />
                            ) : (
                                <div style={{ height: '450px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#000', color: '#fff' }}>
                                    <Skeleton.Node active style={{ width: 100, height: 100 }} />
                                    <Title level={4} style={{ color: 'white', marginTop: 20 }}>Video đang được xử lý băm bảo mật...</Title>
                                    <Text style={{ color: 'var(--text-muted)' }}>Vui lòng quay lại sau vài phút</Text>
                                </div>
                            )
                        ) : (
                            <div style={{ height: '450px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
                                <LockOutlined style={{ fontSize: '64px', color: '#ff4d4f', marginBottom: 20 }} />
                                <Title level={3} style={{ color: 'white' }}>Nội dung đã bị khóa</Title>
                                <Text style={{ color: 'var(--text-muted)' }}>Vui lòng mua khóa học để mở khóa toàn bộ bài giảng</Text>
                                {!course.hasAccess && (
                                    <Button
                                        type="primary"
                                        size="large"
                                        icon={<ShoppingCartOutlined />}
                                        style={{ marginTop: 20, height: 50, padding: '0 40px' }}
                                        onClick={handleBuy}
                                    >
                                        Đăng ký học ngay - {parseFloat(course.price) === 0 ? 'MIỄN PHÍ' : `${Number(course.price).toLocaleString()}đ`}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>

                    <Title level={2} style={{ color: '#1e293b' }}>{activeLesson?.title || course.title}</Title>
                    <Paragraph style={{ color: '#475569', fontSize: '16px' }}>{course.description}</Paragraph>

                    <Divider style={{ borderColor: '#e2e8f0' }} />

                    <div className="glass-card" style={{ padding: '24px' }}>
                        <Space align="start">
                            <Avatar size={64} icon={<UserOutlined />} src={course.instructor.avatar} />
                            <div>
                                <Title level={4} style={{ color: '#1e293b', margin: 0 }}>Giảng viên: {course.instructor.full_name}</Title>
                                <Text style={{ color: '#64748b' }}>{course.instructor.bio || 'Chuyên gia đào tạo hàng đầu hệ thống.'}</Text>
                            </div>
                        </Space>
                    </div>
                </div>
            </Content>

            <Sider width={380} style={{ background: 'var(--surface-color)', borderLeft: '1px solid var(--border-color)' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--border-color)' }}>
                    <Title level={4} style={{ color: '#1e293b', margin: 0 }}>Nội dung khóa học</Title>
                    <Text style={{ color: '#64748b', fontSize: '12px' }}>
                        {course.sections.length} chương • {course.sections.reduce((a, b) => a + b.lessons.length, 0)} bài giảng
                    </Text>
                </div>

                <Collapse
                    ghost
                    expandIconPlacement="end"
                    items={course.sections.map(section => ({
                        key: section.id,
                        label: <Text strong style={{ color: '#1e293b' }}>{section.title}</Text>,
                        style: { borderBottom: '1px solid #e2e8f0' },
                        children: (
                            <List
                                dataSource={section.lessons}
                                renderItem={lesson => (
                                    <List.Item
                                        className={`lesson-item ${activeLesson?.id === lesson.id ? 'active' : ''}`}
                                        onClick={() => {
                                            if (course.hasAccess || lesson.is_free) setActiveLesson(lesson);
                                            else message.warning('Bài học này yêu cầu mua khóa học');
                                        }}
                                        style={{
                                            padding: '12px 16px',
                                            cursor: 'pointer',
                                            borderRadius: '8px',
                                            margin: '4px 0',
                                            transition: '0.2s',
                                            background: activeLesson?.id === lesson.id ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                            display: 'flex',
                                            justifyContent: 'flex-start',
                                            gap: '12px',
                                            border: 'none'
                                        }}
                                    >
                                        {renderLessonIcon(lesson)}
                                        <div style={{ flex: 1 }}>
                                            <Text style={{ color: activeLesson?.id === lesson.id ? '#a855f7' : '#cbd5e1', fontSize: '13px' }}>
                                                {lesson.title}
                                            </Text>
                                            {lesson.duration > 0 && (
                                                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                    {Math.floor(lesson.duration / 60)} phút
                                                </div>
                                            )}
                                        </div>
                                        {lesson.is_free && !course.hasAccess && <Tag color="green">Học thử</Tag>}
                                    </List.Item>
                                )}
                            />
                        )
                    }))}
                />
            </Sider>

            <style>{`
                .lesson-item:hover {
                    background: #f1f5f9 !important;
                }
                .lesson-item.active {
                    background: #f0f7ff !important;
                }
                .ant-collapse-header {
                    padding: 16px 24px !important;
                    background: #f8fafc !important;
                }
                .ant-collapse-content-box {
                    padding: 0 12px 12px 12px !important;
                    background: #ffffff !important;
                }
            `}</style>
        </Layout>
    );
}
