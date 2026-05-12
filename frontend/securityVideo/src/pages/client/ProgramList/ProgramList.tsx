import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Badge, Space, message, Skeleton, Empty, Pagination, Tag, Button } from 'antd';
import { BookOutlined, TeamOutlined, RocketOutlined, NodeIndexOutlined, LockOutlined, AppstoreOutlined } from '@ant-design/icons';
import { programService } from '../../../services/program.service';
import { statsService } from '../../../services/stats.service';
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
    courses: { order: number; course: { id: number; title: string } }[];
    _count: { enrollments: number; courses: number };
    progressPercent?: number; // Added for UI
    enrolled_at?: string;
}

const PAGE_SIZE = 5;

export default function ProgramList() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [myPrograms, setMyPrograms] = useState<Program[]>([]);
    const [summaryData, setSummaryData] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [activeFilter, setActiveFilter] = useState('ALL');
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
                const [allData, myData, summary] = await Promise.all([
                    programService.getAll(searchQuery).catch(() => []),
                    programService.getMyPrograms().catch(() => []),
                    statsService.getMyLearningSummary().catch(() => ({ completedCourses: 0 }))
                ]);

                const finalPrograms = (Array.isArray(allData) ? allData : []).map(p => {
                    const enrolled = (Array.isArray(myData) ? myData : []).find(mp => mp.id === p.id);
                    return enrolled ? { ...p, progressPercent: enrolled.progressPercent } : p;
                });

                setPrograms(finalPrograms);
                setMyPrograms(Array.isArray(myData) ? myData : []);
                setSummaryData(summary || {});
            } catch (err) {
                console.error('Fetch error:', err);
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

    const myProgramIds = new Set(myPrograms.map(p => p.id));

    const filteredPrograms = programs.filter(p => {
        const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description?.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (activeFilter === 'PRIVATE') return p.is_private;
        if (activeFilter === 'PUBLIC') return !p.is_private;
        if (activeFilter === 'ALL') return true;
        return p.level === activeFilter;
    });

    const displayed = filteredPrograms.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    // Calculate fellow students count
    const totalFellowStudents = myPrograms.reduce((acc, p) => acc + (p._count?.enrollments || 0), 0);

    return (
        <div className={styles.programListContainer}>
            {/* <div className={styles.pageHeader}>
                    <Title level={2} className={styles.headerTitle}>Lộ trình học</Title>
                    <Text type="secondary">Lộ trình học tập được thiết kế bài bản từ nhiều khóa học</Text>
                </div> */}

            {/* Summary Cards */}
            {/* <div className={styles.summaryRow}>
                <div className={styles.summaryCard}>
                    <div className={styles.iconBox} style={{ color: '#ef4444' }}>
                        <NodeIndexOutlined />
                    </div>
                    <div className={styles.info}>
                        <div className={styles.value}>{myPrograms.length}</div>
                        <div className={styles.label}>Lộ trình đang học</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.iconBox} style={{ color: '#8b5cf6' }}>
                        <BookOutlined />
                    </div>
                    <div className={styles.info}>
                        <div className={styles.value}>{summaryData?.completedCourses || 0}</div>
                        <div className={styles.label}>Khóa học hoàn thành</div>
                    </div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.iconBox} style={{ color: '#10b981' }}>
                        <TeamOutlined />
                    </div>
                    <div className={styles.info}>
                        <div className={styles.value}>{totalFellowStudents}</div>
                        <div className={styles.label}>nhân sự cùng lộ trình</div>
                    </div>
                </div>
            </div> */}

            {/* Filter Bar Modernized */}
            <div className={styles.modernFilterBar}>
                <div className={styles.filterGroup}>
                    <button
                        className={`${styles.filterPill} ${activeFilter === 'ALL' ? styles.active : ''}`}
                        onClick={() => setActiveFilter('ALL')}
                    >
                        Tất cả lộ trình
                    </button>
                    <div className={styles.separator} />
                    <button
                        className={`${styles.filterPill} ${activeFilter === 'Cơ bản' ? styles.active : ''}`}
                        onClick={() => setActiveFilter('Cơ bản')}
                    >
                        Cơ bản
                    </button>
                    <button
                        className={`${styles.filterPill} ${activeFilter === 'Trung cấp' ? styles.active : ''}`}
                        onClick={() => setActiveFilter('Trung cấp')}
                    >
                        Trung cấp
                    </button>
                    <button
                        className={`${styles.filterPill} ${activeFilter === 'Nâng cao' ? styles.active : ''}`}
                        onClick={() => setActiveFilter('Nâng cao')}
                    >
                        Nâng cao
                    </button>
                    <div className={styles.separator} />
                    <button
                        className={`${styles.filterPill} ${activeFilter === 'PRIVATE' ? styles.active : ''}`}
                        onClick={() => setActiveFilter('PRIVATE')}
                    >
                        Riêng tư
                    </button>
                    <button
                        className={`${styles.filterPill} ${activeFilter === 'PUBLIC' ? styles.active : ''}`}
                        onClick={() => setActiveFilter('PUBLIC')}
                    >
                        Công khai
                    </button>
                </div>
            </div>

            {/* In Progress Section */}
            {myPrograms.length > 0 && searchQuery === '' && activeFilter === 'ALL' && (
                <div style={{ marginBottom: '40px' }}>
                    <div className={styles.sectionHeader}>
                        <Title level={4} className={styles.sectionTitle}>Lộ trình của tôi</Title>
                    </div>
                    <div className={styles.programsGrid}>
                        {myPrograms.map(p => <ProgramCard key={p.id} program={p} navigate={navigate} isEnrolled={true} />)}
                    </div>
                </div>
            )}

            {/* Discovery Section */}
            <div className={styles.sectionHeader}>
                <Title level={4} className={styles.sectionTitle}>
                    {activeFilter === 'ALL'
                        ? 'Khám phá lộ trình'
                        : `Lộ trình: ${activeFilter === 'PRIVATE' ? 'Riêng tư' : activeFilter === 'PUBLIC' ? 'Công khai' : activeFilter}`}
                </Title>
            </div>

            {filteredPrograms.length === 0 ? (
                <Empty description="Không tìm thấy Lộ trình học nào phù hợp" />
            ) : (
                <>
                    <div className={styles.programsGrid}>
                        {displayed.map(p => (
                            <ProgramCard
                                key={p.id}
                                program={p}
                                navigate={navigate}
                                isEnrolled={myProgramIds.has(p.id)}
                            />
                        ))}
                    </div>
                    {filteredPrograms.length > PAGE_SIZE && (
                        <div className={styles.paginationWrapper}>
                            <Pagination
                                current={currentPage}
                                pageSize={PAGE_SIZE}
                                total={filteredPrograms.length}
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

function ProgramCard({ program: p, navigate, isEnrolled: enrolledProp }: { program: Program; navigate: any; isEnrolled?: boolean }) {
    const isEnrolled = enrolledProp ?? !!p.enrolled_at;
    const progress = p.progressPercent || 0;

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
                </div>
            }
            onClick={() => navigate(`/programs/${p.id}`)}
        >
            <div className={styles.cardHeader}>
                <Text className={styles.levelBadgeText}>{p.level?.toUpperCase() || 'LỘ TRÌNH'}</Text>
                <Title level={5} className={styles.titleText}>{p.title}</Title>
            </div>

            <div className={styles.cardBodyRow}>
                <Space direction="vertical" size={0} className={styles.creatorInfo}>
                    <Text className={styles.creatorLabel}>Người tạo</Text>
                    <Text strong className={styles.creatorName}>{p.instructor?.full_name || 'Hệ thống'}</Text>
                </Space>
                <div className={styles.statusTagContainer}>
                    <Tag color={p.is_private ? 'purple' : 'green'} className={styles.statusTag}>
                        {p.is_private ? "RIÊNG TƯ" : "CÔNG KHAI"}
                    </Tag>
                </div>
            </div>

            {isEnrolled && (
                <div className={styles.progressSection}>
                    <div className={styles.progressHeader}>
                        <Text type="secondary" className={styles.progressLabel}>Tiến độ lộ trình</Text>
                        <Text strong className={styles.progressValue}>{progress}%</Text>
                    </div>
                    <div className={styles.progressBar}>
                        <div
                            className={`${styles.progressFill} ${progress === 100 ? styles.finished : ''}`}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            <hr className={styles.cardDivider} />

            <div className={styles.cardFooter}>
                <Space size={4}><BookOutlined /> {p._count?.courses || 0} khóa học</Space>
                <Space size={4}><TeamOutlined /> {p._count?.enrollments || 0} nhân sự</Space>
            </div>
        </Card>
    );
}


