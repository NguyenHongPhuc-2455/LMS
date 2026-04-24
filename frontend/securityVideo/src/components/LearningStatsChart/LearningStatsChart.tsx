import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Select, Spin, Space } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ClockCircleOutlined, LineChartOutlined, CalendarOutlined, FireOutlined } from '@ant-design/icons';
import { statsService } from '../../services/stats.service';
import styles from './LearningStatsChart.module.scss';

const { Title, Text } = Typography;
const { Option } = Select;

const CARDS = [
    {
        key: 'totalHoursDisplay',
        fallback: '0h0p',
        label: 'Tổng giờ học',
        icon: <ClockCircleOutlined />,
        color: '#C72127',
        bg: 'rgba(199,33,39,0.06)',
    },
    {
        key: 'avgHoursDisplay',
        fallback: '0h0p',
        label: 'Trung bình / ngày',
        icon: <LineChartOutlined />,
        color: '#2563eb',
        bg: 'rgba(37,99,235,0.06)',
    },
    {
        key: 'peakDay',
        fallback: 'Chưa có',
        label: 'Ngày học nhiều nhất',
        icon: <CalendarOutlined />,
        color: '#059669',
        bg: 'rgba(5,150,105,0.06)',
    },
    {
        key: 'currentStreak',
        fallback: '0',
        label: 'Chuỗi hiện tại',
        unit: 'ngày',
        icon: <FireOutlined />,
        color: '#d97706',
        bg: 'rgba(217,119,6,0.06)',
    },
];

const LearningStatsChart: React.FC<{ isProfile?: boolean }> = ({ isProfile = true }) => {
    const [summary, setSummary] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);
    const [days, setDays] = useState(7);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [sumData, timeData] = await Promise.all([
                statsService.getMyLearningSummary(),
                statsService.getMyLearningTime(days)
            ]);
            setSummary(sumData);
            setChartData(timeData);
        } catch (error) {
            console.error('Failed to fetch stats:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [days]);

    if (loading && !summary) {
        return (
            <div className={styles.loadingContainer}>
                <Spin size="large" tip="Đang tải thống kê..." />
            </div>
        );
    }

    return (
        <div className={`${styles.dashboardContainer} ${isProfile ? styles.profileVersion : ''}`}>
            {!isProfile && (
                <div className={styles.headerSection}>
                    <Title level={2}>Thống kê học tập</Title>
                    <Text>Phân tích chi tiết thời gian học tập và thói quen của bạn.</Text>
                </div>
            )}

            <Row gutter={[16, 16]}>
                {CARDS.map((card) => {
                    const rawValue = summary?.[card.key];
                    const displayValue = rawValue !== undefined && rawValue !== null ? rawValue : card.fallback;
                    return (
                        <Col key={card.key} xs={24} sm={12} lg={6}>
                            <div
                                className={styles.summaryCard}
                                style={{ '--card-color': card.color, '--card-bg': card.bg } as React.CSSProperties}
                            >
                                <div className={styles.cardIconWrap} style={{ background: card.bg, color: card.color }}>
                                    {card.icon}
                                </div>
                                <span className={styles.label}>{card.label}</span>
                                <div className={styles.value}>
                                    {displayValue}
                                    {card.unit && <span className={styles.unit}> {card.unit}</span>}
                                </div>
                                {card.key === 'currentStreak' && summary?.longestStreak > summary?.currentStreak && (
                                    <div className={styles.recordTag}>
                                        Kỷ lục: {summary.longestStreak} ngày
                                    </div>
                                )}
                            </div>
                        </Col>
                    );
                })}
            </Row>

            <div className={styles.chartCard}>
                <div className={styles.chartHeader}>
                    <Title level={isProfile ? 5 : 4} style={{ margin: 0 }}>
                        Biểu đồ thời gian học
                    </Title>
                    <Space>
                        <Select
                            defaultValue={7}
                            style={{ width: 130 }}
                            onChange={setDays}
                            className={styles.darkSelect}
                            dropdownStyle={{ background: '#ffffff' }}
                        >
                            <Option value={7}>7 ngày qua</Option>
                            <Option value={14}>14 ngày qua</Option>
                            <Option value={30}>30 ngày qua</Option>
                        </Select>
                    </Space>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <div style={{ width: '12px', height: '12px', background: '#C72127', marginRight: '8px', borderRadius: '4px' }}></div>
                    <Text style={{ color: '#64748b', fontSize: '13px', fontWeight: 600 }}>GIỜ HỌC</Text>
                </div>

                <div style={{ height: isProfile ? '300px' : '400px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorMinutesLight" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#C72127" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#C72127" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                dataKey="date"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
                                dy={10}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}
                                tickFormatter={(val) => `${(val / 60).toFixed(1)}h`}
                            />
                            <Tooltip
                                content={({ active, payload, label }) => {
                                    if (active && payload && payload.length) {
                                        const mins = payload[0].value as number;
                                        const h = Math.floor(mins / 60);
                                        const p = mins % 60;
                                        const displayTime = h > 0 ? `${h}h${p}p` : `${p}p`;

                                        return (
                                            <div className={styles.customTooltip} style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif" }}>
                                                <span className={styles.tooltipDate}>{label}</span>
                                                <span className={styles.tooltipValue}>
                                                    {displayTime}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="minutes"
                                stroke="#C72127"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorMinutesLight)"
                                dot={{ fill: '#C72127', strokeWidth: 2, r: 4, stroke: '#ffffff' }}
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#C72127' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default LearningStatsChart;
