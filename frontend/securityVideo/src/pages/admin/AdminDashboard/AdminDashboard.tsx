import React from 'react';
import { statsService } from '../../../services/stats.service';
import { Row, Col, Typography } from 'antd';
import styles from './AdminDashboard.module.scss';

// New specialized components
import StatSummary from './components/StatSummary';
import EnrollmentChart from './components/EnrollmentChart';
import PopularCourses from './components/PopularCourses';

const { Title } = Typography;

const data_placeholder = [
    { name: '5k', enrollments: 20 },
    { name: '10k', enrollments: 40 },
    { name: '15k', enrollments: 30 },
    { name: '20k', enrollments: 80 },
    { name: '25k', enrollments: 45 },
    { name: '30k', enrollments: 50 },
    { name: '35k', enrollments: 25 },
    { name: '40k', enrollments: 70 },
    { name: '45k', enrollments: 60 },
    { name: '50k', enrollments: 50 },
    { name: '55k', enrollments: 40 },
    { name: '60k', enrollments: 55 }
];

export default function AdminDashboard() {
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await statsService.getDashboardStats();
                setStats(data);
            } catch (error) {
                console.error('Lỗi khi tải thống kê:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const chartData = stats?.enrollmentTrends || data_placeholder;

    return (
        <div>
            <Title level={2} className={styles.adminDashboardTitle}>
                Tổng quan
            </Title>

            <StatSummary stats={stats} />

            <Row gutter={[24, 24]}>
                <Col xl={16} lg={24}>
                    <EnrollmentChart data={chartData} loading={loading} />
                </Col>
                <Col xl={8} lg={24}>
                    <PopularCourses courses={stats?.topCourses || []} loading={loading} />
                </Col>
            </Row>
        </div>
    );
}


