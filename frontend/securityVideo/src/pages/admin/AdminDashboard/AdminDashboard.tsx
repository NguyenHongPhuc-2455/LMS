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
    { name: '17/04', enrollments: 0 },
    { name: '18/04', enrollments: 0 },
    { name: '19/04', enrollments: 0 },
    { name: '20/04', enrollments: 0 },
    { name: '21/04', enrollments: 1 },
    { name: '22/04', enrollments: 0 },
    { name: '23/04', enrollments: 2 }
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

    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userRoles = user?.roles || [];
    const roleNames = userRoles.map((r: any) => (typeof r === 'string' ? r : r.name).toLowerCase());
    const isManagerOnly = roleNames.includes('manager') && !roleNames.includes('admin');

    return (
        <div>
            <Title level={2} className={styles.adminDashboardTitle}>
                {isManagerOnly ? 'Tổng quan phòng ban' : 'Tổng quan'}
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


