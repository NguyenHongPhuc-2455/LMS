import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Space, message, Skeleton, Empty, Tag, Button } from 'antd';
import { BookOutlined, RocketOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { programService } from '../../../services/program.service';
import styles from './MyPrograms.module.scss';


const { Title, Text } = Typography;

interface Program {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    instructor: { full_name: string };
    courses: { course: { id: number; title: string } }[];
    _count: { courses: number };
    enrolled_at: string;
}

export default function MyPrograms() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const data = await programService.getMyPrograms();
                setPrograms(data);

            } catch {
                message.error('Lỗi khi tải Lộ trình học của bạn');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return (
        <div className={styles.loadingContainer}>
            <Skeleton active paragraph={{ rows: 10 }} />
        </div>
    );

    return (
        <div className={styles.myProgramsContainer}>
            <div className={styles.pageHeader}>
                <Title level={3} className={styles.headerTitle}>Lộ trình học của tôi</Title>
                <Text type="secondary">Tất cả lộ trình bạn đã đăng ký</Text>
            </div>

            {programs.length === 0 ? (
                <Empty
                    description="Bạn chưa đăng ký Lộ trình học nào"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <Button type="primary" onClick={() => navigate('/programs')}>
                        Khám phá Lộ trình học
                    </Button>
                </Empty>
            ) : (
                <div className={styles.programsGrid}>
                    {programs.map(p => (
                        <Card
                            key={p.id}
                            hoverable
                            className={styles.programCard}
                            cover={
                                <div className={styles.cardCoverWrapper}>
                                    {p.thumbnail ? (
                                        <img src={p.thumbnail} alt={p.title} />
                                    ) : (
                                        <div className={styles.emptyThumb}>
                                            <BookOutlined />
                                        </div>
                                    )}
                                </div>
                            }
                            onClick={() => navigate(`/programs/${p.id}`)}
                        >
                            <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                <div>
                                    <Tag color="purple" className={styles.programLevelTag}>{p.level}</Tag>
                                    <Title level={5} className={styles.programCardTitle} ellipsis={{ rows: 2 }}>
                                        {p.title}
                                    </Title>
                                </div>
                                <Text type="secondary" className={styles.instructorText}>
                                    Bởi {p.instructor?.full_name || 'Hệ thống'}
                                </Text>
                                <div className={styles.cardFooter}>
                                    <Space className={styles.statsText}>
                                        <RocketOutlined /> {p._count?.courses || 0} khóa học
                                    </Space>
                                    <Text type="secondary" className={styles.enrolledDate}>
                                        Đăng ký: {new Date(p.enrolled_at).toLocaleDateString('vi-VN')}
                                    </Text>
                                </div>
                                <Button
                                    type="primary"
                                    ghost
                                    size="small"
                                    icon={<ArrowRightOutlined />}
                                    className={styles.actionBtn}
                                    onClick={e => { e.stopPropagation(); navigate(`/programs/${p.id}`); }}
                                >
                                    Xem lộ trình
                                </Button>
                            </Space>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}


