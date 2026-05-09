import { Row, Col, Card, Statistic, Typography, Skeleton } from 'antd';
import { TeamOutlined, IdcardOutlined, CrownOutlined, BookOutlined } from '@ant-design/icons';
import styles from '../UserManagement.module.scss';

const { Text } = Typography;

import type { User as UserData } from '../../../../types/user';

interface UserStatisticsProps {
    users: UserData[];
    loading: boolean;
}

export default function UserStatistics({ users, loading }: UserStatisticsProps) {
    const statsData = [
        {
            title: 'Học viên',
            value: users.length,
            icon: <TeamOutlined className={`${styles.statsIcon} ${styles.student}`} />,
            type: 'student'
        },
        {
            title: 'Giảng viên',
            value: users.filter(u => u.roles.some((r: any) => (typeof r === 'object' ? r.name : r) === 'instructor')).length,
            icon: <IdcardOutlined className={`${styles.statsIcon} ${styles.instructor}`} />,
            type: 'instructor'
        },
        {
            title: 'Quản trị viên',
            value: users.filter(u => u.roles.some((r: any) => (typeof r === 'object' ? r.name : r) === 'admin')).length,
            icon: <CrownOutlined className={`${styles.statsIcon} ${styles.admin}`} />,
            type: 'admin'
        },
        {
            title: 'Khóa học bán',
            value: users.reduce((a, b) => a + (b.enrollments_count || 0), 0),
            icon: <BookOutlined className={`${styles.statsIcon} ${styles.courses}`} />,
            type: 'courses'
        }
    ];

    return (
        <Row gutter={[16, 16]} className={styles.statsRow}>
            {statsData.map((stat, i) => (
                <Col key={i} xs={24} sm={12} md={6}>
                    <Card className="glass-card stats-card">
                        {loading && users.length === 0 ? (
                            <Skeleton active avatar title={false} paragraph={{ rows: 1 }} />
                        ) : (
                            <Statistic
                                title={<Text type="secondary" className={styles.statsTitle}>{stat.title}</Text>}
                                value={stat.value}
                                valueStyle={{ fontSize: '20px' }}
                                prefix={stat.icon}
                            />
                        )}
                    </Card>
                </Col>
            ))}
        </Row>
    );
}
