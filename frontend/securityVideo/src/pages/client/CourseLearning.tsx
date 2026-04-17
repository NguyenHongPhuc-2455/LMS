import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    PlayCircleOutlined, LockOutlined, CheckCircleOutlined,
    LeftOutlined, ShoppingCartOutlined,
    FileTextOutlined, QuestionCircleOutlined, UserOutlined,
    DownloadOutlined, DownOutlined, UpOutlined,
    MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons';
import {
    Collapse, App, Typography, Button,
    Tag, Skeleton, Divider, Avatar, Row, Col
} from 'antd';
import VideoPlayer from '../../components/VideoPlayer';
import CommentSection from '../../components/CommentSection';
import QuizPlayer from '../../components/QuizPlayer';
import type { VideoPlayerRef } from '../../components/VideoPlayer';
import api from '../../api';
import { useTabFocusWarning } from '../../hooks/useTabFocusWarning';

const { Title, Text, Paragraph } = Typography;

interface Lesson {
    id: number;
    title: string;
    type: 'VIDEO' | 'DOCUMENT' | 'QUIZ';
    video_url: string;
    is_free: boolean;
    duration: number;
    isCompleted?: boolean;
    attachment_url?: string;
    attachment_name?: string;
    content?: string;
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
    instructor: { full_name: string; bio: string; avatar: string; avatar_url?: string };
}

export default function Course() {
    const { message } = App.useApp();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const initialLessonId = searchParams.get('lessonId');

    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const videoPlayerRef = useRef<VideoPlayerRef>(null);

    // Kích hoạt cảnh báo chuyển Tab & Reset video nếu vi phạm lần 2
    useTabFocusWarning(
        'Cảnh báo tập trung!',
        'Hệ thống phát hiện bạn vừa rời khỏi trình duyệt. Vui lòng tập trung hoàn thành bài học.',
        () => {
            if (activeLesson?.type === 'VIDEO') {
                videoPlayerRef.current?.reset();
            }
        }
    );

    const fetchDetail = async () => {
        try {
            const res = await api.get(`/courses/${id}`);
            const data = res.data;
            setCourse(data);

            // Nếu có lessonId từ URL, ưu tiên chọn bài đó
            if (!activeLesson) {
                const allLessons: Lesson[] = data.sections.flatMap((s: any) => s.lessons);

                if (initialLessonId) {
                    const target = allLessons.find(l => l.id === parseInt(initialLessonId));
                    if (target) {
                        setActiveLesson(target);
                        return; // Đã tìm thấy bài cụ thể
                    }
                }

                if (data.sections.length > 0) {
                    const firstLesson = data.sections[0].lessons[0];
                    if (firstLesson) setActiveLesson(firstLesson);
                }
            } else {
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
        if (id) {
            fetchDetail();
            // Chỉ scroll lên đầu nếu không có hash (không phải từ thông báo)
            if (!location.hash) {
                window.scrollTo(0, 0);
            }
        }
    }, [id]);

    // Khi lessonId thay đổi từ URL (ví dụ: từ thông báo), chọn bài đó
    useEffect(() => {
        if (initialLessonId && course) {
            const allLessons: Lesson[] = course.sections.flatMap((s: any) => s.lessons);
            const target = allLessons.find(l => l.id === parseInt(initialLessonId));
            if (target && target.id !== activeLesson?.id) {
                setActiveLesson(target);
            }
        }
    }, [initialLessonId, course]);

    useEffect(() => {
        if (!location.hash) {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [activeLesson?.id]);

    // Scroll tới bình luận khi có hash #comment-xxx
    useEffect(() => {
        if (location.hash && location.hash.startsWith('#comment-')) {
            const tryScroll = (attempts = 0) => {
                const el = document.getElementById(location.hash.slice(1));
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.transition = 'background 0.3s ease';
                    el.style.background = '#fef9c3';
                    setTimeout(() => {
                        el.style.background = '';
                    }, 2500);
                } else if (attempts < 15) {
                    setTimeout(() => tryScroll(attempts + 1), 300);
                }
            };
            // Đợi comments load xong
            setTimeout(() => tryScroll(), 500);
        }
    }, [location.hash, activeLesson?.id]);

    const handleBuy = async () => {
        try {
            message.loading({ content: 'Đang kết nối tới cổng thanh toán VNPay...', key: 'payment' });
            const res = await api.post('/payments/create-vnpay-url', { courseId: id });
            if (res.data.payUrl) {
                window.location.href = res.data.payUrl;
            }
        } catch (error: any) {
            message.error({ content: error.response?.data?.error || 'Lỗi khởi tạo thanh toán', key: 'payment' });
        }
    };

    const handleNextLesson = () => {
        if (!course || !activeLesson) return;
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
        <div style={{ background: '#f8fafc', minHeight: '100vh', margin: '-24px -40px' }}>
            <Row gutter={0}>
                <Col lg={showSidebar ? 16 : 24} md={24} style={{ padding: '24px', minHeight: '100vh', background: '#f8fafc', transition: 'all 0.3s ease' }}>
                    <div style={{ maxWidth: showSidebar ? '1000px' : '100%', margin: '0 auto', transition: 'max-width 0.3s ease' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <Button
                                icon={<LeftOutlined />}
                                onClick={() => navigate(`/course/${id}`)}
                                style={{ background: 'transparent', color: 'black', border: 'none' }}
                            >
                                Quay lại trang chi tiết
                            </Button>

                            {!showSidebar && (
                                <Button
                                    icon={<MenuUnfoldOutlined />}
                                    onClick={() => setShowSidebar(true)}
                                    style={{
                                        borderRadius: '8px',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px'
                                    }}
                                >
                                    Hiện thanh bên
                                </Button>
                            )}
                        </div>

                        <div className="glass-card" style={{ padding: '0', overflow: 'hidden', marginBottom: 24, background: '#000', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                            {activeLesson && activeLesson.type === 'QUIZ' ? (
                                <QuizPlayer
                                    lessonId={activeLesson.id}
                                    onCompleted={() => {
                                        fetchDetail(); // Refresh progress
                                    }}
                                />
                            ) : activeLesson && activeLesson.type === 'VIDEO' && (course.hasAccess || activeLesson.is_free) ? (
                                activeLesson.video_url ? (
                                    <VideoPlayer
                                        ref={videoPlayerRef}
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

                        {/* Hiển thị nội dung văn bản của bài học */}
                        {activeLesson?.content && (
                            <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0', marginBottom: '24px' }}>
                                <Title level={4}>Hướng dẫn & Nội dung</Title>
                                <div style={{ position: 'relative' }}>
                                    <div style={{
                                        maxHeight: isExpanded ? 'none' : '100px',
                                        overflow: 'hidden',
                                        transition: 'max-height 0.3s ease-out',
                                        position: 'relative'
                                    }}>
                                        <Paragraph style={{ whiteSpace: 'pre-wrap', color: '#334155', margin: 0 }}>
                                            {activeLesson.content}
                                        </Paragraph>

                                        {!isExpanded && (
                                            <div style={{
                                                position: 'absolute',
                                                bottom: 0,
                                                left: 0,
                                                right: 0,
                                                height: '60px',
                                                background: 'linear-gradient(transparent, #ffffff)',
                                                pointerEvents: 'none'
                                            }} />
                                        )}
                                    </div>

                                    <Button
                                        type="link"
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        style={{ padding: '0 0', marginTop: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                        {isExpanded ? (
                                            <>Thu gọn <UpOutlined style={{ fontSize: 12 }} /></>
                                        ) : (
                                            <>Xem thêm <DownOutlined style={{ fontSize: 12 }} /></>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Hiển thị tài liệu đính kèm (PDF) */}
                        {activeLesson?.attachment_url && (
                            <div style={{
                                background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                                borderRadius: '16px',
                                padding: '20px',
                                border: '1px solid #bae6fd',
                                marginBottom: '24px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ width: '40px', height: '40px', background: '#fff', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                                        <FileTextOutlined style={{ fontSize: '20px', color: '#0284c7' }} />
                                    </div>
                                    <div>
                                        <Text strong style={{ display: 'block', color: '#0369a1' }}>Tài liệu đính kèm</Text>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>{activeLesson.attachment_name || 'Tai_lieu_bai_hoc.pdf'}</Text>
                                    </div>
                                </div>
                                <Button
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    href={`http://localhost:5000${activeLesson.attachment_url}`}
                                    target="_blank"
                                    download
                                    style={{ background: '#0284c7', borderColor: '#0284c7' }}
                                >
                                    Tải về PDF
                                </Button>
                            </div>
                        )}

                        {/* <Paragraph style={{ color: '#475569', fontSize: '16px' }}>{course.description}</Paragraph> */}

                        <Divider style={{ borderColor: '#e2e8f0' }} />

                        {activeLesson && (
                            <CommentSection
                                lessonId={activeLesson.id}
                                currentUser={user}
                            />
                        )}

                        <Divider style={{ margin: '40px 0' }} />

                        {/* <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', border: '1px solid #e2e8f0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <Avatar size={64} icon={<UserOutlined />} src={course.instructor.avatar} style={{ background: '#6366f1' }} />
                                <div>
                                    <Title level={4} style={{ margin: 0 }}>Giảng viên: {course.instructor.full_name}</Title>
                                    <Text type="secondary">{course.instructor.bio || 'Chuyên gia đào tạo hàng đầu hệ thống.'}</Text>
                                </div>
                            </div>
                        </div> */}
                    </div>
                </Col>

                {showSidebar && (
                    <Col lg={8} md={24} style={{
                        background: '#fff',
                        borderLeft: '1px solid #e2e8f0',
                        height: 'calc(100vh - 64px)',
                        position: 'sticky',
                        top: '64px',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'all 0.3s ease'
                    }}>
                        <div style={{
                            padding: '24px',
                            borderBottom: '1px solid #e2e8f0',
                            background: '#fff',
                            zIndex: 5,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            flexShrink: 0
                        }}>
                            <div>
                                <Title level={4} style={{ color: '#0f172a', margin: 0 }}>Nội dung khóa học</Title>
                                <Text style={{ color: '#64748b', fontSize: '12px' }}>
                                    {course.sections.length} chương • {course.sections.reduce((a, b) => a + b.lessons.length, 0)} bài giảng
                                </Text>
                            </div>
                            <Button
                                type="text"
                                icon={<MenuFoldOutlined />}
                                onClick={() => setShowSidebar(false)}
                                style={{ color: '#64748b' }}
                            />
                        </div>

                        <div style={{ flexGrow: 1, overflowY: 'auto', paddingBottom: 100 }}>
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
                                                                    {Math.floor(lesson.duration / 60).toString().padStart(2, '0')}:{(lesson.duration % 60).toString().padStart(2, '0')}
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
                        </div>
                    </Col>
                )}
            </Row>

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
        </div>
    );
}
