import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    PlayCircleOutlined, LockOutlined, CheckCircleOutlined,
    LeftOutlined, ShoppingCartOutlined,
    FileTextOutlined, QuestionCircleOutlined, UserOutlined
} from '@ant-design/icons';
import {
    Layout, Collapse, App, Typography, Button,
    Tag, Skeleton, Divider, Avatar
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
    isCompleted?: boolean;
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
    const { message } = App.useApp();
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

            // Chỉ tự động chọn bài đầu tiên nếu chưa có bài nào được chọn
            if (!activeLesson) {
                if (data.sections.length > 0) {
                    const firstLesson = data.sections[0].lessons[0];
                    if (firstLesson) setActiveLesson(firstLesson);
                }
            } else {
                // Nếu đã chọn bài, tìm lại bài đó trong list mới để đồng bộ trạng thái (isCompleted, isLocked...)
                const allLessons: Lesson[] = data.sections.flatMap((s: any) => s.lessons);
                const currentInNewData = allLessons.find(l => l.id === activeLesson.id);
                if (currentInNewData) setActiveLesson(currentInNewData);
            }
        } catch (error: any) {
            message.error('Lỗi khi tải nội dung khóa học');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchDetail();
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

    const handleNextLesson = () => {
        if (!course || !activeLesson) return;

        // Tải lại dữ liệu để cập nhật trạng thái hoàn thành (isCompleted) và mở khóa bài tiếp theo trên UI
        fetchDetail();

        const allLessons = course.sections.flatMap(s => s.lessons);
        const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);

        if (currentIndex === allLessons.length - 1) {
            message.success('Bạn đã hoàn thành toàn bộ khóa học!');
        }
    };

    const renderLessonIcon = (lesson: Lesson, isLockedByProgress: boolean) => {
        if (lesson.isCompleted) return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
        if (isLockedByProgress) return <LockOutlined style={{ color: '#94a3b8' }} />;
        if (!course?.hasAccess && !lesson.is_free) return <LockOutlined style={{ color: '#ff4d4f' }} />;
        switch (lesson.type) {
            case 'VIDEO': return <PlayCircleOutlined style={{ color: '#6366f1' }} />;
            case 'DOCUMENT': return <FileTextOutlined style={{ color: '#52c41a' }} />;
            case 'QUIZ': return <QuestionCircleOutlined style={{ color: '#faad14' }} />;
            default: return <PlayCircleOutlined />;
        }
    };

    if (loading) return <div style={{ padding: 50 }}><Skeleton active /></div>;
    if (!course) return <div>Không tìm thấy dữ liệu</div>;

    return (
        <Layout style={{ minHeight: '100vh', background: '#f8fafc' }}>
            <Content style={{ padding: '24px', overflowY: 'auto' }}>
                <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                    <Button
                        icon={<LeftOutlined />}
                        onClick={() => navigate('/')}
                        style={{ marginBottom: 20, background: 'transparent', color: 'black' }}
                    >
                        Quay lại trang chủ
                    </Button>

                    <div className="glass-card" style={{ padding: '0', overflow: 'hidden', marginBottom: 24, background: '#000', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                        {activeLesson && activeLesson.type === 'VIDEO' && (course.hasAccess || activeLesson.is_free) ? (
                            activeLesson.video_url ? (
                                <VideoPlayer
                                    src={activeLesson.video_url.startsWith('http') ? activeLesson.video_url : `http://localhost:5000${activeLesson.video_url}`}
                                    lessonId={activeLesson.id}
                                    onEnded={handleNextLesson}
                                />
                            ) : (
                                <div style={{ height: '450px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#000', color: '#fff' }}>
                                    <Skeleton.Node active style={{ width: 100, height: 100 }} />
                                    <Title level={4} style={{ color: 'white', marginTop: 20 }}>Video đang được xử lý băm bảo mật...</Title>
                                    <Text style={{ color: '#94a3b8' }}>Vui lòng quay lại sau vài phút</Text>
                                </div>
                            )
                        ) : (
                            <div style={{ height: '450px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#000' }}>
                                <LockOutlined style={{ fontSize: '64px', color: '#ff4d4f', marginBottom: 20 }} />
                                <Title level={3} style={{ color: 'white' }}>Nội dung đã bị khóa</Title>
                                <Text style={{ color: '#94a3b8' }}>Vui lòng mua khóa học để mở khóa toàn bộ bài giảng</Text>
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

                    <Title level={2} style={{ color: '#0f172a' }}>{activeLesson?.title || course.title}</Title>
                    <Paragraph style={{ color: '#475569', fontSize: '16px' }}>{course.description}</Paragraph>

                    <Divider style={{ borderColor: '#e2e8f0' }} />

                    <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <Avatar size={64} icon={<UserOutlined />} src={course.instructor.avatar} style={{ background: '#6366f1' }} />
                            <div>
                                <Title level={4} style={{ margin: 0 }}>Giảng viên: {course.instructor.full_name}</Title>
                                <Text type="secondary">{course.instructor.bio || 'Chuyên gia đào tạo hàng đầu hệ thống.'}</Text>
                            </div>
                        </div>
                    </div>
                </div>
            </Content>

            <Sider width={380} style={{ background: '#fff', borderLeft: '1px solid #e2e8f0' }}>
                <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
                    <Title level={4} style={{ color: '#0f172a', margin: 0 }}>Nội dung khóa học</Title>
                    <Text style={{ color: '#64748b', fontSize: '12px' }}>
                        {course.sections.length} chương • {course.sections.reduce((a, b) => a + b.lessons.length, 0)} bài giảng
                    </Text>
                </div>

                <Collapse
                    ghost
                    expandIconPlacement="end"
                    items={course.sections.map(section => ({
                        key: section.id,
                        label: <Text strong style={{ color: '#0f172a' }}>{section.title}</Text>,
                        style: { borderBottom: '1px solid #e2e8f0' },
                        children: (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {section.lessons.map((lesson) => {
                                    const allLessons = course.sections.flatMap(s => s.lessons);
                                    const overallIndex = allLessons.findIndex(l => l.id === lesson.id);
                                    const previousLesson = overallIndex > 0 ? allLessons[overallIndex - 1] : null;
                                    const isLockedByProgress = previousLesson ? !previousLesson.isCompleted : false;
                                    const canView = course.hasAccess || lesson.is_free;

                                    return (
                                        <div
                                            key={lesson.id}
                                            className={`lesson-item ${activeLesson?.id === lesson.id ? 'active' : ''} ${isLockedByProgress ? 'locked' : ''}`}
                                            onClick={() => {
                                                if (isLockedByProgress) {
                                                    message.info('Vui lòng hoàn thành bài học trước đó để mở khóa bài này');
                                                    return;
                                                }
                                                if (canView) setActiveLesson(lesson);
                                                else message.warning('Bài học này yêu cầu mua khóa học');
                                            }}
                                            style={{
                                                padding: '12px 16px',
                                                cursor: isLockedByProgress ? 'not-allowed' : 'pointer',
                                                borderRadius: '8px',
                                                margin: '4px 0',
                                                transition: '0.2s',
                                                background: activeLesson?.id === lesson.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent',
                                                display: 'flex',
                                                justifyContent: 'flex-start',
                                                alignItems: 'center',
                                                gap: '12px',
                                                opacity: isLockedByProgress ? 0.6 : 1
                                            }}
                                        >
                                            {renderLessonIcon(lesson, isLockedByProgress)}
                                            <div style={{ flex: 1 }}>
                                                <Text style={{
                                                    color: activeLesson?.id === lesson.id ? '#6366f1' : (isLockedByProgress ? '#94a3b8' : '#0f172a'),
                                                    fontSize: '13px',
                                                    fontWeight: activeLesson?.id === lesson.id ? 600 : 400
                                                }}>
                                                    {lesson.title}
                                                </Text>
                                                {lesson.duration > 0 && (
                                                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                                                        {Math.floor(lesson.duration / 60)} phút
                                                    </div>
                                                )}
                                            </div>
                                            {lesson.is_free && !course.hasAccess && <Tag color="green">Học thử</Tag>}
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    }))}
                />
            </Sider>

            <style>{`
                .lesson-item:hover:not(.locked) {
                    background: #f8fafc !important;
                }
                .lesson-item.active {
                    background: rgba(99, 102, 241, 0.1) !important;
                }
                .ant-collapse-header {
                    padding: 16px 24px !important;
                    background: #f8fafc !important;
                }
                .ant-collapse-content-box {
                    padding: 4px 12px 12px 12px !important;
                    background: #ffffff !important;
                }
            `}</style>
        </Layout>
    );
}
