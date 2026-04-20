import { Row, Col, Card, Typography } from 'antd';
import {
    TeamOutlined, BoxPlotOutlined, LineChartOutlined, HistoryOutlined,
    ArrowUpOutlined, ArrowDownOutlined
} from '@ant-design/icons';
import styles from '../AdminDashboard.module.scss';

const { Text } = Typography;

interface StatSummaryProps {
    stats: any;
}

export default function StatSummary({ stats }: StatSummaryProps) {
    const statCards = [
        {
            title: 'Tổng Học Viên',
            value: stats?.overview?.totalStudents?.toLocaleString() || '0',
            percent: '8.5%',
            isUp: true,
            icon: <TeamOutlined style={{ fontSize: '24px', color: '#8884d8' }} />,
            bg: '#eef2ff',
            detail: 'So với hôm qua'
        },
        {
            title: 'Khóa Học',
            value: stats?.overview?.totalCourses?.toLocaleString() || '0',
            percent: '1.3%',
            isUp: true,
            icon: <BoxPlotOutlined style={{ fontSize: '24px', color: '#f59e0b' }} />,
            bg: '#fffbeb',
            detail: 'Tổng số hiện có'
        },
        {
            title: 'Lượt tham gia',
            value: stats?.overview?.totalEnrollments?.toLocaleString() || '0',
            percent: '4.3%',
            isUp: true,
            icon: <LineChartOutlined style={{ fontSize: '24px', color: '#10b981' }} />,
            bg: '#ecfdf5',
            detail: 'Tổng lượt ghi danh'
        },
        {
            title: 'Đang chờ xử lý',
            value: stats?.overview?.pendingRequests?.toLocaleString() || '0',
            percent: '1.8%',
            isUp: true,
            icon: <HistoryOutlined style={{ fontSize: '24px', color: '#ef4444' }} />,
            bg: '#fef2f2',
            detail: 'Yêu cầu phê duyệt'
        }
    ];

    return (
        <Row gutter={[24, 24]} className={styles.statCardContainer}>
            {statCards.map((stat, idx) => (
                <Col xs={24} sm={12} lg={6} key={idx}>
                    <Card
                        bordered={false}
                        className={styles.statCard}
                        bodyStyle={{ padding: '24px' }}
                    >
                        <div className={styles.statCardHeader}>
                            <div>
                                <Text className={styles.statCardTitle}>{stat.title}</Text>
                                <div className={styles.statCardValue}>
                                    {stat.value}
                                </div>
                            </div>
                            <div className={styles.statCardIconWrapper} style={{ background: stat.bg }}>
                                {stat.icon}
                            </div>
                        </div>
                        <div className={styles.statCardFooter}>
                            <span className={`${styles.statCardTrend} ${stat.isUp ? styles.trendUp : styles.trendDown}`}>
                                {stat.isUp ? <ArrowUpOutlined style={{ marginRight: '4px' }} /> : <ArrowDownOutlined style={{ marginRight: '4px' }} />}
                                {stat.percent}
                            </span>
                            <span className={styles.statCardDetail}>{stat.detail}</span>
                        </div>
                    </Card>
                </Col>
            ))}
        </Row>
    );
}
