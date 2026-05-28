import { Divider } from 'antd';
import {
    LeftOutlined, MenuUnfoldOutlined
} from '@ant-design/icons';
import { CommentSection } from '../../../../components';
import styles from '../CourseLearning.module.scss';
import { Button } from 'antd';

// Sub-components
import LessonPlayer from './LessonPlayer';
import LessonInfo from './LessonInfo';
import LessonAttachment from './LessonAttachment';

interface LearningContentProps {
    course: any;
    activeLesson: any;
    showSidebar: boolean;
    setShowSidebar: (show: boolean) => void;
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
    videoPlayerRef: any;
    handleNextLesson: () => void;
    setIsVideoPlaying: (playing: boolean) => void;
    navigate: any;
    id: string;
    user: any;
    onError?: (error?: any) => void;
}

export default function LearningContent({
    course,
    activeLesson,
    showSidebar,
    setShowSidebar,
    isExpanded,
    setIsExpanded,
    videoPlayerRef,
    handleNextLesson,
    setIsVideoPlaying,
    navigate,
    id,
    user,
    onError
}: LearningContentProps) {
    return (
        <div className={`${styles.contentWrapper} ${showSidebar ? styles.sidebarVisible : styles.sidebarHidden}`}>
            <div className={styles.headerActions}>
                <Button
                    icon={<LeftOutlined />}
                    onClick={() => navigate(`/course/${id}`)}
                    className={styles.backBtn}
                >
                    Quay lại
                </Button>

                {!showSidebar && (
                    <Button
                        icon={<MenuUnfoldOutlined />}
                        onClick={() => setShowSidebar(true)}
                        className={styles.showSidebarBtn}
                    >
                        Hiện thanh bên
                    </Button>
                )}
            </div>

            <div className={styles.videoSection}>
                <LessonPlayer
                    course={course}
                    activeLesson={activeLesson}
                    videoPlayerRef={videoPlayerRef}
                    handleNextLesson={handleNextLesson}
                    setIsVideoPlaying={setIsVideoPlaying}
                    onError={onError}
                />
            </div>

            <LessonInfo
                title={activeLesson?.title || course.title}
                content={activeLesson?.content}
                isExpanded={isExpanded}
                setIsExpanded={setIsExpanded}
                type={activeLesson?.type}
            />

            <LessonAttachment
                url={activeLesson?.attachment_url}
                name={activeLesson?.attachment_name}
            />

            <Divider className={styles.dividerSlate} />

            {activeLesson && (
                <CommentSection
                    lessonId={activeLesson.id}
                    currentUser={user}
                />
            )}

            <Divider style={{ margin: '48px 0' }} />
        </div>
    );
}

