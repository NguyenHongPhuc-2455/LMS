import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    PlayCircleOutlined, LockOutlined, CheckCircleOutlined,
    LeftOutlined, ShoppingCartOutlined,
    FileTextOutlined, QuestionCircleOutlined,
    DownloadOutlined, DownOutlined, UpOutlined,
    MenuFoldOutlined, MenuUnfoldOutlined
} from '@ant-design/icons';
import {
    Collapse, App, Typography, Button,
    Tag, Skeleton, Divider, Row, Col
} from 'antd';
import { VideoPlayer, VideoJsPlayer, CommentSection, QuizPlayer, type VideoPlayerRef } from '../../../components';

import api from '../../../api';
import { useTabFocusWarning } from '../../../hooks/useTabFocusWarning';
import './CourseLearning.scss';

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
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;

    const videoPlayerRef = useRef<VideoPlayerRef>(null);

    // Kích hoạt cảnh báo chuyển Tab & Reset video nếu vi phạm lần 2
    useTabFocusWarning(
        'Cảnh báo tập trung!',
        'Hệ thống phát hiện bạn vừa rời khỏi trình duyệt. Vui lòng tập trung hoàn thành bài học.',
        isVideoPlaying,
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
                    el.classList.add('highlight-comment');
                    setTimeout(() => {
                        el.classList.remove('highlight-comment');
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

    if (loading) return <div className="learning-loading"><Skeleton active /></div>;
    if (!course) return <div>Không tìm thấy dữ liệu</div>;

    return (
        <div className="learning-container">
            <Row gutter={0}>
                <Col lg={showSidebar ? 16 : 24} md={24} className="main-column">
                    <div className={`content-wrapper ${showSidebar ? 'sidebar-visible' : 'sidebar-hidden'}`}>
                        <div className="header-actions">
                            <Button
                                icon={<LeftOutlined />}
                                onClick={() => navigate(`/course/${id}`)}
                                className="back-btn"
                            >
                                Quay lại trang chi tiết
                            </Button>

                            {!showSidebar && (
                                <Button
                                    icon={<MenuUnfoldOutlined />}
                                    onClick={() => setShowSidebar(true)}
                                    className="show-sidebar-btn"
                                >
                                    Hiện thanh bên
                                </Button>
                            )}
                        </div>

                        <div className="video-section">
                            {activeLesson && activeLesson.type === 'QUIZ' ? (
                                <QuizPlayer
                                    lessonId={activeLesson.id}
                                    onCompleted={() => {
                                        fetchDetail(); // Refresh progress
                                    }}
                                />
                            ) : activeLesson && activeLesson.type === 'VIDEO' && (course.hasAccess || activeLesson.is_free) ? (
                                activeLesson.video_url ? (
                                    activeLesson.video_url.includes('.m3u8') ? (
                                        <VideoPlayer
                                            ref={videoPlayerRef}
                                            src={`http://localhost:5000${activeLesson.video_url}`}
                                            lessonId={activeLesson.id}
                                            onEnded={handleNextLesson}
                                            onPlay={() => setIsVideoPlaying(true)}
                                            onPause={() => setIsVideoPlaying(false)}
                                        />
                                    ) : (
                                        <VideoJsPlayer
                                            ref={videoPlayerRef as any}
                                            src={activeLesson.video_url}
                                            lessonId={activeLesson.id}
                                            onEnded={handleNextLesson}
                                            onPlay={() => setIsVideoPlaying(true)}
                                            onPause={() => setIsVideoPlaying(false)}
                                            isCompletedInit={activeLesson.isCompleted}
                                        />
                                    )
                                ) : (
                                    <div className="video-processing">
                                        <Skeleton.Node active className="skeleton-square" />
                                        <Title level={4} className="processing-title">Video đang được xử lý băm bảo mật...</Title>
                                        <Text className="processing-text">Vui lòng quay lại sau vài phút</Text>
                                    </div>
                                )
                            ) : (
                                <div className="locked-section">
                                    <LockOutlined className="locked-icon" />
                                    <Title level={3} className="locked-title">Nội dung đã bị khóa</Title>
                                    <Text className="locked-desc">Vui lòng mua khóa học để mở khóa toàn bộ bài giảng</Text>
                                    {!course.hasAccess && (
                                        <Button
                                            type="primary"
                                            size="large"
                                            icon={<ShoppingCartOutlined />}
                                            className="buy-btn"
                                            onClick={handleBuy}
                                        >
                                            Đăng ký học ngay - {parseFloat(course.price) === 0 ? 'MIỄN PHÍ' : `${Number(course.price).toLocaleString()}đ`}
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>

                        <Title level={2} className="course-main-title">{activeLesson?.title || course.title}</Title>

                        {/* Hiển thị nội dung văn bản của bài học */}
                        {activeLesson?.content && (
                            <div className="lesson-content-card">
                                <Title level={4}>Hướng dẫn & Nội dung</Title>
                                <div className="relative-pos">
                                    <div className={`content-scroll-area ${isExpanded ? '' : 'collapsed'}`}>
                                        <Paragraph className="content-paragraph">
                                            {activeLesson.content}
                                        </Paragraph>

                                        {!isExpanded && (
                                            <div className="gradient-overlay" />
                                        )}
                                    </div>

                                    <Button
                                        type="link"
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="expand-btn"
                                    >
                                        {isExpanded ? (
                                            <>Thu gọn <UpOutlined className="icon-small-btn" /></>
                                        ) : (
                                            <>Xem thêm <DownOutlined className="icon-small-btn" /></>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Hiển thị tài liệu đính kèm (PDF) */}
                        {activeLesson?.attachment_url && (
                            <div className="attachment-card">
                                <div className="attachment-info">
                                    <div className="attachment-icon-wrapper">
                                        <FileTextOutlined className="attachment-icon" />
                                    </div>
                                    <div>
                                        <Text strong className="attachment-title">Tài liệu đính kèm</Text>
                                        <Text type="secondary" className="attachment-subtitle">{activeLesson.attachment_name || 'Tai_lieu_bai_hoc.pdf'}</Text>
                                    </div>
                                </div>
                                <Button
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    href={`http://localhost:5000${activeLesson.attachment_url}`}
                                    target="_blank"
                                    download
                                    className="download-btn"
                                >
                                    Tải về PDF
                                </Button>
                            </div>
                        )}

                        <Divider className="divider-slate" />

                        {activeLesson && (
                            <CommentSection
                                lessonId={activeLesson.id}
                                currentUser={user}
                            />
                        )}

                        <Divider className="divider-margin-lg" />
                    </div>
                </Col>

                {showSidebar && (
                    <Col lg={8} md={24} className="sidebar-column">
                        <div className="sidebar-header">
                            <div>
                                <Title level={4} className="sidebar-title">Nội dung khóa học</Title>
                                <Text className="sidebar-subtitle">
                                    {course.sections.length} chương • {course.sections.reduce((a, b) => a + b.lessons.length, 0)} bài giảng
                                </Text>
                            </div>
                            <Button
                                type="text"
                                icon={<MenuFoldOutlined />}
                                onClick={() => setShowSidebar(false)}
                                className="btn-gray-icon"
                            />
                        </div>

                        <div className="sidebar-scroll-area">
                            <Collapse
                                ghost
                                expandIconPlacement="end"
                                items={course.sections.map(section => ({
                                    key: section.id,
                                    label: <Text strong className="section-label">{section.title}</Text>,
                                    className: "section-collapse-item",
                                    children: (
                                        <div className="lesson-list">
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
                                                    >
                                                        {renderLessonIcon(lesson, isLockedByProgress)}
                                                        <div className="flex-1">
                                                            <Text className={`lesson-title-text ${activeLesson?.id === lesson.id ? 'active' : (isLockedByProgress ? 'locked' : 'default')}`}>
                                                                {lesson.title}
                                                            </Text>
                                                            {lesson.duration > 0 && (
                                                                <div className="lesson-duration-text">
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
        </div>
    );
}

