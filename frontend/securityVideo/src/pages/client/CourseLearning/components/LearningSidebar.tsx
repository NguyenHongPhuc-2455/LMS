import { Typography, Button, Collapse, Tag } from 'antd';
import {
    MenuFoldOutlined, CheckCircleOutlined, LockOutlined,
    PlayCircleOutlined, FileTextOutlined, QuestionCircleOutlined
} from '@ant-design/icons';
import styles from '../CourseLearning.module.scss';

const { Title, Text } = Typography;

interface LearningSidebarProps {
    course: any;
    activeLesson: any;
    setActiveLesson: (lesson: any) => void;
    setShowSidebar: (show: boolean) => void;
    message: any;
}

export default function LearningSidebar({
    course,
    activeLesson,
    setActiveLesson,
    setShowSidebar,
    message
}: LearningSidebarProps) {
    const renderLessonIcon = (lesson: any, isLockedByProgress: boolean) => {
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

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className={styles.sidebarHeader}>
                <div>
                    <Title level={4} className={styles.sidebarTitle}>Nội dung khóa học</Title>
                    <Text className={styles.sidebarSubtitle}>
                        {course.sections.length} chương • {course.sections.reduce((a: any, b: any) => a + b.lessons.length, 0)} bài giảng
                    </Text>
                </div>
                <Button
                    type="text"
                    icon={<MenuFoldOutlined />}
                    onClick={() => setShowSidebar(false)}
                    style={{ color: '#94a3b8', fontSize: '18px' }}
                />
            </div>

            <div className={styles.sidebarScrollArea}>
                <Collapse
                    ghost
                    expandIconPlacement="end"
                    items={course.sections.map((section: any) => ({
                        key: section.id,
                        label: <Text strong className={styles.sectionLabel}>{section.title}</Text>,
                        className: styles.sectionCollapseItem,
                        children: (
                            <div className={styles.lessonList}>
                                {section.lessons.map((lesson: any) => {
                                    const allLessons = course.sections.flatMap((s: any) => s.lessons);
                                    const overallIndex = allLessons.findIndex((l: any) => l.id === lesson.id);
                                    const previousLesson = overallIndex > 0 ? allLessons[overallIndex - 1] : null;
                                    const isLockedByProgress = previousLesson ? !previousLesson.isCompleted : false;
                                    const canView = course.hasAccess || lesson.is_free;

                                    return (
                                        <div
                                            key={lesson.id}
                                            className={`${styles.lessonItem} ${activeLesson?.id === lesson.id ? styles.active : ''} ${isLockedByProgress ? styles.locked : ''}`}
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
                                            <div style={{ flex: 1 }}>
                                                <Text className={`${styles.lessonTitleText} ${activeLesson?.id === lesson.id ? styles.active : (isLockedByProgress ? styles.locked : styles.default)}`}>
                                                    {lesson.title}
                                                </Text>
                                                {lesson.duration > 0 && (
                                                    <div className={styles.lessonDurationText}>
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
        </div>
    );
}
