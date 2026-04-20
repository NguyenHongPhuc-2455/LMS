import { Typography, Skeleton } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { VideoPlayer, VideoJsPlayer, QuizPlayer } from '../../../../components';
import styles from '../CourseLearning.module.scss';

const { Title, Text } = Typography;

interface LessonPlayerProps {
    course: any;
    activeLesson: any;
    videoPlayerRef: any;
    handleNextLesson: () => void;
    setIsVideoPlaying: (playing: boolean) => void;
}

export default function LessonPlayer({
    course,
    activeLesson,
    videoPlayerRef,
    handleNextLesson,
    setIsVideoPlaying
}: LessonPlayerProps) {
    if (!activeLesson) return null;

    if (activeLesson.type === 'QUIZ') {
        return (
            <QuizPlayer
                lessonId={activeLesson.id}
                onCompleted={handleNextLesson}
            />
        );
    }

    if (activeLesson.type === 'VIDEO' && (course.hasAccess || activeLesson.is_free)) {
        if (!activeLesson.video_url) {
            return (
                <div className={styles.videoProcessing}>
                    <Skeleton.Node active className={styles.skeletonSquare} />
                    <Title level={4} className={styles.processingTitle}>Video đang được xử lý băm bảo mật...</Title>
                    <Text className={styles.processingText}>Vui lòng quay lại sau vài phút</Text>
                </div>
            );
        }

        if (activeLesson.video_url.includes('.m3u8')) {
            return (
                <VideoPlayer
                    ref={videoPlayerRef}
                    src={`http://localhost:5000${activeLesson.video_url}`}
                    lessonId={activeLesson.id}
                    onEnded={handleNextLesson}
                    onPlay={() => setIsVideoPlaying(true)}
                    onPause={() => setIsVideoPlaying(false)}
                />
            );
        }

        return (
            <VideoJsPlayer
                ref={videoPlayerRef as any}
                src={activeLesson.video_url}
                lessonId={activeLesson.id}
                onEnded={handleNextLesson}
                onPlay={() => setIsVideoPlaying(true)}
                onPause={() => setIsVideoPlaying(false)}
                isCompletedInit={activeLesson.isCompleted}
            />
        );
    }

    return (
        <div className={styles.lockedSection}>
            <LockOutlined className={styles.lockedIcon} />
            <Title level={3} className={styles.lockedTitle}>Nội dung đã bị khóa</Title>
            <Text className={styles.lockedDesc}>Vui lòng liên hệ quản trị viên để mở khóa toàn bộ bài giảng</Text>
        </div>
    );
}
