import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    App, Skeleton, Row, Col
} from 'antd';
import { type VideoPlayerRef } from '../../../components';

import { courseService } from '../../../services/course.service';
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
            if (!location.hash) {
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
        if (!location.hash) {
            window.scrollTo({ top: 0, behavior: 'auto' });
        }
    }, [activeLesson?.id]);

    useEffect(() => {
        if (location.hash && location.hash.startsWith('#comment-')) {
            const tryScroll = (attempts = 0) => {
                const el = document.getElementById(location.hash.slice(1));
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.classList.add(styles.highlightComment);
                    setTimeout(() => {
                        el.classList.remove(styles.highlightComment);
                    }, 2500);
                } else if (attempts < 15) {
                    setTimeout(() => tryScroll(attempts + 1), 300);
                }
            };
            setTimeout(() => tryScroll(), 500);
        }
    }, [location.hash, activeLesson?.id]);

    const handleNextLesson = () => {
        if (!course || !activeLesson) return;
        fetchDetail();
        const allLessons = course.sections.flatMap(s => s.lessons);
        const currentIndex = allLessons.findIndex(l => l.id === activeLesson.id);
        if (currentIndex === allLessons.length - 1) {
            message.success('Bạn đã hoàn thành toàn bộ khóa học!');
        }
    };

    if (loading) return <div className={styles.learningLoading}><Skeleton active /></div>;
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

