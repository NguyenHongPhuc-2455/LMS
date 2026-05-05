import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Badge, Space, message, Skeleton, Empty, Pagination, Tag } from 'antd';
import { BookOutlined, TeamOutlined, RocketOutlined } from '@ant-design/icons';
import { programService } from '../../../services/program.service';
import styles from './ProgramList.module.scss';


const { Title, Text } = Typography;

interface Program {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    status: string;
    is_private: boolean;
    instructor: { full_name: string };
    courses: { course: { id: number; title: string } }[];
    _count: { enrollments: number; courses: number };
}

const PAGE_SIZE = 5;

export default function ProgramList() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const data = await programService.getAll(searchQuery);
                setPrograms(data);

            } catch {
                message.error('Lỗi khi tải danh sách Lộ trình học');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [searchQuery]);

    if (loading) return (
        <div className={styles.loadingContainer}>
            <Skeleton active paragraph={{ rows: 10 }} />
        </div>
    );

    const displayed = programs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div className={styles.programListContainer}>
            <div className={styles.pageHeader}>
                <Title level={2} className={styles.headerTitle}>Lộ trình học</Title>
                <Text type="secondary">Lộ trình học tập được thiết kế bài bản từ nhiều khóa học</Text>
            </div>

            {programs.length === 0 ? (
                <Empty description="Chưa có Lộ trình học nào được phát hành" />
            ) : (
                <>
                    <div className={styles.programsGrid}>
                        {displayed.map(p => <ProgramCard key={p.id} program={p} navigate={navigate} />)}
                    </div>
                    {programs.length > PAGE_SIZE && (
                        <div className={styles.paginationWrapper}>
                            <Pagination
                                current={currentPage}
                                pageSize={PAGE_SIZE}
                                total={programs.length}
                                onChange={setCurrentPage}
                                showSizeChanger={false}
                            />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ProgramCard({ program: p, navigate }: { program: Program; navigate: any }) {
    return (
        <Card
            hoverable
            className={styles.programCardItem}
            cover={
                <div className={styles.cardCoverWrapper}>
                    <img 
                        src={p.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'} 
                        alt={p.title} 
                    />
                    <div className={styles.statusBadgeSticky}>
                        <Tag color={p.is_private ? 'purple' : 'green'}>
                            {p.is_private ? 'RIÊNG TƯ' : 'CÔNG KHAI'}
                        </Tag>
                    </div>
                </div>
            }
            onClick={() => navigate(`/programs/${p.id}`)}
        >
            <div className={styles.cardTitleSection}>
                <Badge
                    status="processing"
                    text={<Text className={styles.levelBadgeText}>{p.level?.toUpperCase() || 'LỘ TRÌNH'}</Text>}
                />
                <Title level={5} className={styles.titleText} ellipsis={{ rows: 2 }}>{p.title}</Title>
            </div>
            <Space direction="vertical" size={0} className={styles.instructorSection}>
                <Text className={styles.label}>Người tạo</Text>
                <Text strong className={styles.name}>{p.instructor?.full_name || 'Hệ thống'}</Text>
            </Space>
            <hr className={styles.cardDivider} />
            <div className={styles.cardFooter}>
                <Space size={4}><RocketOutlined /> {p._count?.courses || 0} khóa học</Space>
                <Space size={4}><TeamOutlined /> {p._count?.enrollments || 0} học viên</Space>
            </div>
        </Card>
    );
}


