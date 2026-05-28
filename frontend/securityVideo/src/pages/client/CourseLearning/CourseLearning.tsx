import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    App, Skeleton, Row, Col
} from 'antd';
import { type VideoPlayerRef } from '../../../components';

import { courseService } from '../../../services/course.service';
import { statsService } from '../../../services/stats.service';
import { useTabFocusWarning } from '../../../hooks/useTabFocusWarning';

// New specialized components
import LearningContent from './components/LearningContent';
import LearningSidebar from './components/LearningSidebar';

import styles from './CourseLearning.module.scss';

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

export default function CourseLearning() {
    const { message } = App.useApp();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { hash } = location;
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

    // Tạm thời tắt tính năng chống chuyển tab theo yêu cầu người dùng
    useTabFocusWarning(
        'Cảnh báo tập trung!',
        'Hệ thống phát hiện bạn vừa rời khỏi trình duyệt. Vui lòng tập trung hoàn thành bài học.',
        false, // isVideoPlaying -> false
        () => {
            if (activeLesson?.type === 'VIDEO') {
                videoPlayerRef.current?.reset();
            }
        }
    );

    const fetchDetail = async () => {
        try {
            const data = await courseService.getById(id!);
            setCourse(data);

            if (!activeLesson) {
                const allLessons: Lesson[] = data.sections.flatMap((s: any) => s.lessons);
                if (initialLessonId) {
                    const target = allLessons.find(l => l.id === parseInt(initialLessonId));
                    if (target) {
                        setActiveLesson(target);
                        return;
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
            if (!hash) {
                window.scrollTo(0, 0);
            }
        }
    }, [id]);

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
        if (!hash) {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
        // Đồng bộ URL với bài học hiện tại để tránh việc fetchDetail làm nhảy bài
        if (activeLesson?.id && initialLessonId !== activeLesson.id.toString()) {
            navigate(`/course/${id}/learning?lessonId=${activeLesson.id}`, { replace: true });
        }
    }, [activeLesson?.id]);

    useEffect(() => {
        const timeoutIds: any[] = [];

        if (hash && hash.startsWith('#comment-')) {
            const tryScroll = (attempts = 0) => {
                const el = document.getElementById(hash.slice(1));
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add(styles.highlightComment);
                    const tId1 = setTimeout(() => {
                        el.classList.remove(styles.highlightComment);
                    }, 2500);
                    timeoutIds.push(tId1);
                } else if (attempts < 15) {
                    const tId2 = setTimeout(() => tryScroll(attempts + 1), 300);
                    timeoutIds.push(tId2);
                }
            };
            const tId3 = setTimeout(() => tryScroll(), 500);
            timeoutIds.push(tId3);
        }

        return () => {
            timeoutIds.forEach(id => clearTimeout(id));
        };
    }, [hash, activeLesson?.id]);

    // Heartbeat tracking for learning time (Optimized for performance)
    useEffect(() => {
        if (!activeLesson || !id) return;

        // Gửi xung khởi động (1 giây) ngay khi bắt đầu vào bài học 
        // để đảm bảo streak được kích hoạt ngay lập tức
        statsService.trackLearningTime({
            courseId: parseInt(id),
            lessonId: activeLesson.id,
            duration: 1
        }).catch(err => console.error('Failed to send initial learning pulse:', err));

        const TRACK_INTERVAL = 60000; // Tối ưu: 60 giây (Thay vì 30s) để giảm tải 50% cho Database
        const timer = setInterval(() => {
            // Chỉ bắt đầu track nếu video đang phát, ngừng gửi API nếu user tạm dừng video
            if (activeLesson.type === 'VIDEO' && !isVideoPlaying) return;

            statsService.trackLearningTime({
                courseId: parseInt(id),
                lessonId: activeLesson.id,
                duration: 60 // Ghi nhận 60 giây
            }).catch(err => console.error('Failed to track learning time:', err));
        }, TRACK_INTERVAL);

        return () => clearInterval(timer);
    }, [activeLesson?.id, id, isVideoPlaying]);

    const handleNextLesson = () => {
        if (!course || !activeLesson) return;

        // 1. Thông báo hoàn thành bài học
        message.success({
            content: 'Chúc mừng! Bạn đã hoàn thành bài học và bài tiếp theo đã được mở khóa.',
            duration: 4,
            key: 'lesson-complete'
        });

        // 2. Tải lại dữ liệu bài học để cập nhật trạng thái tích xanh và mở khóa trên Sidebar
        fetchDetail();
    };

    const handleVideoError = (error: any) => {
        const httpStatus = error?.data?.[1];
        if (httpStatus === 404 || httpStatus === 500) {
            console.error('❌ Lỗi tải video từ server:', error);
            message.error({ content: 'Video không được tìm thấy trên hệ thống lưu trữ!', key: 'video-refresh', duration: 4 });
            return;
        }

        // Tự động làm mới Token bằng cách gọi lại API chi tiết khóa học.
        // Backend sẽ cấp lại URL có Token mới nhất dựa trên IP hiện tại.
        console.log('🔄 Đang làm mới Token video để phục hồi kết nối...');
        message.loading({ content: 'Phát hiện thay đổi mạng, đang khôi phục video...', key: 'video-refresh' });
        fetchDetail().then(() => {
            message.success({ content: 'Khôi phục thành công!', key: 'video-refresh', duration: 2 });
        });
    };

    if (loading) {
        return (
            <div className={styles.learningContainer}>
                <Row gutter={0}>
                    <Col lg={showSidebar ? 16 : 24} md={24} className={styles.mainColumn}>
                        {/* Header Actions Skeleton */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                            <Skeleton.Button active size="small" style={{ width: 120 }} />
                            <Skeleton.Button active size="small" style={{ width: 150 }} />
                        </div>
                        {/* Video Player 16:9 Aspect Ratio Fixed Size Placeholder */}
                        <div 
                            style={{ 
                                width: '100%', 
                                aspectRatio: '16/9', 
                                background: '#f1f5f9', 
                                borderRadius: '5px', 
                                overflow: 'hidden',
                                marginBottom: 24,
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                border: '1px solid #e2e8f0',
                                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.05)'
                            }}
                        >
                            <Skeleton.Node active style={{ width: '100%', height: '100%', borderRadius: '5px' }}>
                                <span style={{ opacity: 0.1 }}>RITAVÕ PLAYER</span>
                            </Skeleton.Node>
                        </div>
                        {/* Title and Content Skeletons */}
                        <div style={{ padding: '0 8px' }}>
                            <Skeleton active paragraph={{ rows: 3 }} />
                        </div>
                    </Col>

                    {showSidebar && (
                        <Col lg={8} md={24} className={styles.sidebarColumn}>
                            {/* Sidebar Header Skeleton */}
                            <div style={{ padding: 24, borderBottom: '1px solid #e2e8f0' }}>
                                <Skeleton active paragraph={{ rows: 1 }} />
                            </div>
                            {/* Sidebar Scroll Area Skeleton */}
                            <div style={{ padding: 24 }}>
                                <Skeleton active paragraph={{ rows: 8 }} />
                            </div>
                        </Col>
                    )}
                </Row>
            </div>
        );
    }
    if (!course) return <div>Không tìm thấy dữ liệu</div>;

    return (
        <div className={styles.learningContainer}>
            <Row gutter={0}>
                <Col lg={showSidebar ? 16 : 24} md={24} className={styles.mainColumn}>
                    <LearningContent
                        course={course}
                        activeLesson={activeLesson}
                        showSidebar={showSidebar}
                        setShowSidebar={setShowSidebar}
                        isExpanded={isExpanded}
                        setIsExpanded={setIsExpanded}
                        videoPlayerRef={videoPlayerRef}
                        handleNextLesson={handleNextLesson}
                        setIsVideoPlaying={setIsVideoPlaying}
                        navigate={navigate}
                        id={id!}
                        user={user}
                        onError={handleVideoError}
                    />
                </Col>

                {showSidebar && (
                    <Col lg={8} md={24} className={styles.sidebarColumn}>
                        <LearningSidebar
                            course={course}
                            activeLesson={activeLesson}
                            setActiveLesson={setActiveLesson}
                            setShowSidebar={setShowSidebar}
                            message={message}
                        />
                    </Col>
                )}
            </Row>
        </div>
    );
}

