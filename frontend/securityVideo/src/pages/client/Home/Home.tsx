import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Card, Space, Avatar, Empty, Select, Skeleton } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ClockCircleOutlined, BookOutlined, FireOutlined, LineChartOutlined, TrophyOutlined, FolderOpenOutlined } from '@ant-design/icons';
import { statsService } from '../../../services/stats.service';
import { categoryService, type Category } from '../../../services/category.service';
import { courseService } from '../../../services/course.service';
import { Progress, Button as AntButton } from 'antd';
import dayjs from 'dayjs';
import styles from './Home.module.scss';

import HeroSection from './components/HeroSection';
import MandatoryCourseBanner from '../../../components/MandatoryCourseBanner/MandatoryCourseBanner';

const { Title, Text } = Typography;

export default function Home() {
    const navigate = useNavigate();
    const [summary, setSummary] = useState<any>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [topLearners, setTopLearners] = useState<any[]>([]);
    const [inProgressCourses, setInProgressCourses] = useState<any[]>([]);
    const [weeklyStats, setWeeklyStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortType, setSortType] = useState('progress_desc');

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            const userRoles = user.roles || [];
            const isAdminOrManager = userRoles.some((r: any) => {
                const roleName = typeof r === 'string' ? r : r.name;
                return ['admin', 'manager'].includes(roleName?.toLowerCase());
            });
            if (isAdminOrManager) {
                navigate('/admin', { replace: true });
            }
        }
    }, [navigate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch myCourses independently so filter logic always runs
                const [myCourses, catData] = await Promise.all([
                    courseService.getMyCourses(),
                    categoryService.getAllCategories()
                ]);

                const completedCourses = myCourses?.filter((c: any) => Number(c.progressPercent) >= 100)?.length || 0;
                const inProgress = myCourses?.filter((c: any) => Number(c.progressPercent) < 100) || [];

                setCategories(catData);
                setInProgressCourses(inProgress);

                // Fetch stats separately - don't block if fails
                try {
                    const sumData = await statsService.getMyLearningSummary();
                    setSummary({ ...sumData, completedCourses });
                } catch {
                    setSummary({ completedCourses });
                }

                try {
                    const topData = await statsService.getTopLearners();
                    setTopLearners(topData);
                } catch {
                    setTopLearners([]);
                }

                try {
                    const daysInMonth = dayjs().date(); // Fetch up to today
                    const weekData = await statsService.getMyLearningTime(daysInMonth);
                    setWeeklyStats(weekData || []);
                } catch {
                    setWeeklyStats([]);
                }

            } catch (error) {
                console.error('Lỗi khi tải dữ liệu trang chủ', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const CARDS = [
        {
            key: 'totalHoursDisplay',
            fallback: '0h0p',
            label: 'Tổng giờ học',
            icon: <ClockCircleOutlined />,
            color: '#C72127',
            bg: 'rgba(200, 16, 46, 0.06)',
            value: summary?.totalHoursDisplay
        },
        {
            key: 'completedCourses',
            fallback: '0',
            label: 'Khóa học hoàn thành',
            icon: <BookOutlined />,
            color: '#059669',
            bg: 'rgba(5,150,105,0.06)',
            value: summary?.completedCourses
        },
        {
            key: 'currentStreak',
            fallback: '0',
            label: 'Chuỗi học liên tục',
            unit: 'ngày',
            icon: <FireOutlined />,
            color: '#d97706',
            bg: 'rgba(217,119,6,0.06)',
            value: summary?.currentStreak
        },
        {
            key: 'avgHoursDisplay',
            fallback: '0h0p',
            label: 'Trung bình / ngày',
            icon: <LineChartOutlined />,
            color: '#2563eb',
            bg: 'rgba(37,99,235,0.06)',
            value: summary?.avgHoursDisplay
        },
    ];

    if (loading) {
        return (
            <div className={styles.homeContainer} style={{ padding: '24px' }}>
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                    {[1, 2, 3, 4].map(i => (
                        <Col key={i} xs={24} sm={12} lg={6}>
                            <Skeleton active avatar paragraph={{ rows: 1 }} />
                        </Col>
                    ))}
                </Row>
                <Row gutter={[24, 24]}>
                    <Col xs={24} lg={16}>
                        <Skeleton active paragraph={{ rows: 10 }} />
                        <Skeleton active style={{ marginTop: '24px' }} paragraph={{ rows: 5 }} />
                    </Col>
                    <Col xs={24} lg={8}>
                        <Skeleton active paragraph={{ rows: 15 }} />
                    </Col>
                </Row>
            </div>
        );
    }

    return (
        <div className={styles.homeContainer}>
            {/* Hero Banner Section */}
            <HeroSection />

            <div style={{ padding: '0 24px' }}>
                {/* Top Cards */}
                <Row gutter={[16, 16]} style={{ marginBottom: '20px', marginTop: '40px' }}>
                    {CARDS.map((card) => (
                        <Col key={card.key} xs={24} sm={12} lg={6}>
                            <div className={styles.summaryCard} style={{ '--card-color': card.color, '--card-bg': card.bg } as React.CSSProperties}>
                                <div className={styles.cardIconWrap} style={{ background: card.bg, color: card.color }}>
                                    {card.icon}
                                </div>
                                <div className={styles.cardInfo}>
                                    <Text className={styles.label}>{card.label}</Text>
                                    <div className={styles.value}>
                                        {card.value || card.fallback}
                                        {card.unit && <span className={styles.unit}> {card.unit}</span>}
                                    </div>
                                </div>
                            </div>
                        </Col>
                    ))}
                </Row>

                <Row gutter={[24, 24]}>
                    {/* Left column: in-progress + categories */}
                    <Col xs={24} lg={16}>
                        {/* Banner cảnh báo khóa học bắt buộc */}
                        <MandatoryCourseBanner hideFloating={true} hideDrawer={true} />

                        {inProgressCourses.length > 0 && (
                            <div className={styles.inProgressWrapper}>
                                <div className={styles.sectionHeader} style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Title level={4} style={{ margin: 0 }}>Tiếp tục học</Title>
                                    <Select
                                        defaultValue="progress_desc"
                                        style={{ width: 180 }}
                                        onChange={(val) => setSortType(val)}
                                        options={[
                                            { value: 'progress_desc', label: 'Tiến độ: Cao → Thấp' },
                                            { value: 'progress_asc', label: 'Tiến độ: Thấp → Cao' },
                                            { value: 'newest', label: 'Mới đăng ký' },
                                        ]}
                                    />
                                </div>
                                <div className={styles.inProgressScroll}>
                                    <Space direction="vertical" size="small" style={{ width: '100%', paddingBottom: '8px' }}>
                                        {[...inProgressCourses]
                                            .sort((a, b) => {
                                                if (sortType === 'progress_desc') return b.progressPercent - a.progressPercent;
                                                if (sortType === 'progress_asc') return a.progressPercent - b.progressPercent;
                                                if (sortType === 'newest') return new Date(b.enrolledAt).getTime() - new Date(a.enrolledAt).getTime();
                                                return 0;
                                            })
                                            .map((course: any) => (
                                                <div key={course.id} className={styles.inProgressCard}>
                                                    <div className={styles.progThumbnail}>
                                                        <img
                                                            src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=800&auto=format&fit=crop'}
                                                            alt={course.title}
                                                        />
                                                    </div>
                                                    <div className={styles.progInfo}>
                                                        <Title level={5} style={{ margin: 0 }}>{course.title}</Title>
                                                        <Progress
                                                            percent={course.progressPercent}
                                                            strokeColor="#C72127"
                                                            size="small"
                                                            showInfo={true}
                                                            format={(percent) => <span style={{ color: '#1e293b', fontWeight: 600 }}>{percent}%</span>}
                                                        />
                                                        <Text type="secondary" style={{ fontSize: '12px', marginTop: '-4px' }}>Hoàn thành {course.completedLessons || 0}/{course.totalLessons || 0} bài học</Text>
                                                    </div>
                                                    <div className={styles.progAction}>
                                                        <AntButton
                                                            type="primary"
                                                            size="small"
                                                            disabled={course.isOverdue}
                                                            style={{ 
                                                                opacity: course.isOverdue ? 0.6 : 1,
                                                                cursor: course.isOverdue ? 'not-allowed' : 'pointer',
                                                                backgroundColor: course.isOverdue ? '#bfbfbf' : '#C72127',
                                                                borderColor: course.isOverdue ? '#bfbfbf' : '#C72127'
                                                            }}
                                                            onClick={() => {
                                                                if (!course.isOverdue) {
                                                                    const url = course.nextLessonId
                                                                        ? `/course/${course.id}/learning?lessonId=${course.nextLessonId}`
                                                                        : `/course/${course.id}/learning`;
                                                                    navigate(url);
                                                                }
                                                            }}
                                                        >
                                                            Tiếp tục
                                                        </AntButton>
                                                    </div>
                                                </div>
                                            ))}
                                    </Space>
                                </div>
                            </div>
                        )}

                        <div className={styles.inProgressWrapper}>
                            <div className={styles.sectionHeader} style={{ marginBottom: '16px' }}>
                                <Title level={4} style={{ margin: 0 }}>Kho Danh Mục</Title>
                            </div>
                            <Row gutter={[16, 16]}>
                                {categories.map(cat => (
                                    <Col xs={24} sm={12} key={cat.id}>
                                        <Card
                                            hoverable
                                            className={styles.categoryCard}
                                            onClick={() => navigate(`/categories/${cat.id}`)}
                                        >
                                            <Space direction="vertical" size={8}>
                                                <div className={styles.catIconBox}>
                                                    <FolderOpenOutlined style={{ fontSize: '24px', color: '#C72127' }} />
                                                </div>
                                                <div>
                                                    <Title level={5} style={{ margin: 0 }}>{cat.name}</Title>
                                                    <Text type="secondary" style={{ fontSize: '13px' }}>
                                                        {cat._count?.courses || 0} khóa học
                                                    </Text>
                                                </div>
                                            </Space>
                                        </Card>
                                    </Col>
                                ))}
                            </Row>
                            {categories.length === 0 && <Empty description="Chưa có danh mục nào" />}
                        </div>
                    </Col>

                    {/* Right column: Leaderboard & Streak */}
                    <Col xs={24} lg={8}>
                        <div className={styles.leaderboardBox} style={{ marginBottom: '16px' }}>
                            <div className={styles.lbHeader} style={{ background: '#C72127' }}>
                                <Title level={4} style={{ margin: 0, color: '#fff' }}>
                                    <TrophyOutlined style={{ marginRight: '8px' }} />
                                    Top nhân sự tháng này
                                </Title>
                            </div>
                            <div className={styles.lbList}>
                                {topLearners.slice(0, 5).map((learner, index) => {
                                    const h = Math.floor(learner.totalSeconds / 3600);
                                    const m = Math.floor((learner.totalSeconds % 3600) / 60);
                                    const timeStr = h > 0 ? `${h}h${m}p` : `${m}p`;

                                    return (
                                        <div key={index} className={styles.lbItem}>
                                            <div className={styles.lbRank} data-rank={index + 1}>{index + 1}</div>
                                            <Avatar src={learner.avatar} size={40} style={{ backgroundColor: '#f0f0f0', color: '#666', border: '2px solid #fff' }}>
                                                {learner.user.charAt(0).toUpperCase()}
                                            </Avatar>
                                            <div className={styles.lbInfo}>
                                                <Text strong className={styles.lbName}>{learner.user}</Text>
                                                <Text type="secondary" className={styles.lbTime}>
                                                    <ClockCircleOutlined style={{ marginRight: '4px', fontSize: '12px' }} />
                                                    {timeStr}
                                                </Text>
                                            </div>
                                        </div>
                                    );
                                })}
                                {topLearners.length === 0 && <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có dữ liệu" />}
                            </div>
                        </div>

                        <div className={styles.streakWidget}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <Title level={5} style={{ margin: 0 }}>Lịch học tập</Title>
                                <Text type="secondary" style={{ fontSize: '12px' }}>Tháng {dayjs().format('MM/YYYY')}</Text>
                            </div>
                            <div className={styles.streakNumberBox}>
                                <FireOutlined style={{ color: '#C72127', fontSize: '32px' }} />
                                <span className={styles.streakCount}>{summary?.currentStreak || 0}</span>
                                <span className={styles.streakText}>ngày liên tiếp</span>
                            </div>
                            <div className={styles.streakDays}>
                                {(() => {
                                    const now = dayjs();
                                    const startOfMonth = now.startOf('month');
                                    const daysInMonth = now.daysInMonth();
                                    const paddingDays = (startOfMonth.day() + 6) % 7;
                                    const prevMonth = now.subtract(1, 'month');
                                    const prevMonthDays = prevMonth.daysInMonth();

                                    const calendar: any[] = [];
                                    for (let i = paddingDays - 1; i >= 0; i--) {
                                        calendar.push({ type: 'padding', dayNumber: prevMonthDays - i });
                                    }
                                    for (let d = 1; d <= daysInMonth; d++) {
                                        const dateStr = now.date(d).format('DD/MM');
                                        const stat = weeklyStats.find(s => s.date === dateStr);
                                        calendar.push({
                                            type: 'day',
                                            dayNumber: d,
                                            isStudied: stat?.hasActivity || (stat?.minutes || 0) > 0
                                        });
                                    }

                                    return calendar.map((item, idx) => (
                                        <div key={idx} className={styles.streakDayCol}>
                                            <div className={`${styles.streakDot} ${item.isStudied ? styles.active : ''} ${item.type === 'padding' ? styles.paddingDot : ''}`}></div>
                                            <div className={`${styles.streakDayName} ${item.type === 'padding' ? styles.paddingText : ''}`}>
                                                {item.dayNumber < 10 ? `0${item.dayNumber}` : item.dayNumber}
                                            </div>
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
