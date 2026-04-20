import { Card, Avatar, Typography, Tag, Space, message } from 'antd';
import { BookOutlined, CheckCircleOutlined, LockOutlined, RocketOutlined } from '@ant-design/icons';
import styles from '../ProgramDetail.module.scss';

const { Text } = Typography;

interface ProgramCourseCardProps {
    pc: any;
    index: number;
    program: any;
    navigate: (path: string) => void;
}

export default function ProgramCourseCard({
    pc,
    index,
    program,
    navigate
}: ProgramCourseCardProps) {
    const c = pc.course;
    const isLocked = pc.isLocked;
    const isFinished = pc.isFinished;
    const progress = pc.progressPercent || 0;

    return (
        <Card
            hoverable={program.isEnrolled && !isLocked}
            className={`${styles.courseCardItem} ${isLocked ? styles.locked : ''} ${isFinished ? styles.finished : ''}`}
            style={{
                cursor: (program.isEnrolled && !isLocked) ? 'pointer' : 'default',
            }}
            onClick={() => {
                if (program.isEnrolled) {
                    if (isLocked) {
                        message.warning('Bạn cần hoàn thành khóa học trước đó để mở khóa nội dung này.');
                    } else {
                        navigate(`/course/${c.id}`);
                    }
                }
            }}
        >
            <div className={styles.courseCardContent}>
                <div className={styles.orderCircle} style={{ backgroundColor: isLocked ? '#94a3b8' : isFinished ? '#22c55e' : undefined }}>
                    {isFinished ? <CheckCircleOutlined /> : index + 1}
                </div>
                <Avatar
                    src={c.thumbnail}
                    shape="square"
                    size={64}
                    className={styles.courseThumbnail}
                    icon={<BookOutlined />}
                    style={{ filter: isLocked ? 'grayscale(100%)' : 'none' }}
                />
                <div className={styles.courseInfo}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Text strong className={styles.courseTitle}>{c.title}</Text>
                        {program.isEnrolled && (
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                                {isFinished ? 'Hoàn thành' : `${progress}%`}
                            </Text>
                        )}
                    </div>
                    <Space size={12} className={styles.courseMeta}>
                        <Tag>{c.level}</Tag>
                        <Text type="secondary">
                            {c._count?.sections || 0} chương
                        </Text>
                    </Space>

                    {program.isEnrolled && !isLocked && (
                        <div className={styles.courseProgressBarMini}>
                            <div
                                className={`${styles.progressFill} ${isFinished ? styles.isFinished : ''}`}
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                    )}
                </div>
                <div className={styles.lockStatusIcon}>
                    {!program.isEnrolled ? (
                        <LockOutlined style={{ color: '#94a3b8', fontSize: 18 }} />
                    ) : isLocked ? (
                        <LockOutlined style={{ color: '#ef4444', fontSize: 18 }} />
                    ) : isFinished ? (
                        <CheckCircleOutlined style={{ color: '#22c55e', fontSize: 18 }} />
                    ) : (
                        <RocketOutlined style={{ color: '#6366f1', fontSize: 18 }} />
                    )}
                </div>
            </div>
        </Card>
    );
}
