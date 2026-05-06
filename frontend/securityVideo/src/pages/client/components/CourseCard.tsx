import { Card, Badge, Typography, Space, Tag } from 'antd';
import { BookOutlined, ClockCircleOutlined, RocketOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import styles from './CourseCard.module.scss';

const { Title, Text } = Typography;

export interface Course {
    id: number;
    title: string;
    description: string;
    level: string;
    thumbnail: string;
    category?: { name: string };
    instructor?: { full_name: string; username: string };
    is_private: boolean;
    created_at: string;
    _count?: { sections: number };
    progressPercent?: number; // Added progress field
}

interface CourseCardProps {
    course: Course;
}

export default function CourseCard({ course }: CourseCardProps) {
    const navigate = useNavigate();

    return (
        <Card
            hoverable
            className={`glass-card ${styles.courseHoverCard}`}
            cover={
                <div className={styles.courseCardCover}>
                    <img 
                        src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'} 
                        alt={course.title} 
                        className={styles.thumbnailImg} 
                    />
                </div>
            }
            onClick={() => navigate(`/course/${course.id}`)}
        >
            <div className={styles.courseCardHeader}>
                <Badge status="processing" text={<Text className={styles.levelBadgeText}>{course.level?.toUpperCase() || 'OFFICIAL'}</Text>} />
                <Title level={5} className={styles.courseTitle}>{course.title}</Title>
            </div>

            <div className={styles.courseCardBodyRow}>
                <Space direction="vertical" size={0} className={styles.creatorInfo}>
                    <Text className={styles.creatorLabel}>Người tạo</Text>
                    <Text strong className={styles.creatorName}>{course.instructor?.full_name || 'Hệ thống'}</Text>
                </Space>
                <div className="card-badge-container">
                    <Tag color={course.is_private ? 'purple' : 'green'} className={styles.statusTag}>
                        {course.is_private ? "RIÊNG TƯ" : "CÔNG KHAI"}
                    </Tag>
                </div>
            </div>

            {/* Progress Section */}
            {(course.progressPercent !== undefined && course.progressPercent !== null) && (
                <div className={styles.progressContainer}>
                    <div className={styles.progressHeader}>
                        <Text type="secondary" className={styles.progressText}>Tiến độ học tập</Text>
                        <Text strong className={styles.percentText}>{course.progressPercent}%</Text>
                    </div>
                    <div className={styles.progressBarWrapper}>
                        <div 
                            className={styles.progressBar} 
                            style={{ width: `${course.progressPercent}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <hr className={styles.courseCardDivider} />

            <div className={styles.courseCardFooter}>
                <Space size={4}><ClockCircleOutlined /> Lộ trình</Space>
                <Space size={4}><RocketOutlined /> {course._count?.sections || 0} chương</Space>
            </div>
        </Card>
    );
}
