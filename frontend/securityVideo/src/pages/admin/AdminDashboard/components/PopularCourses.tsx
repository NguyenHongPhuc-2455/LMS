import { Card, Typography, Space, Badge, Empty } from 'antd';
import styles from '../AdminDashboard.module.scss';

const { Title, Text } = Typography;

interface PopularCoursesProps {
    courses: any[];
    loading: boolean;
}

export default function PopularCourses({ courses, loading }: PopularCoursesProps) {
    return (
        <Card
            title={<Title level={4} className={styles.chartCardTitle}>Khóa học phổ biến</Title>}
            bordered={false}
            className={styles.statCard}
            style={{ height: '100%', minHeight: 440 }}
            bodyStyle={{ padding: '24px' }}
            loading={loading}
        >
            <Space direction="vertical" className={styles.popularCourseList} size={16}>
                {courses?.map((course: any, i: number) => (
                    <div key={i} className={styles.popularCourseItem}>
                        <div style={{ flex: 1, marginRight: '8px' }}>
                            <Text strong style={{ display: 'block' }}>{course.title}</Text>
                            <Text type="secondary" style={{ fontSize: '12px' }}>Vị trí #{i + 1}</Text>
                        </div>
                        <Badge count={course.count} color="#4880FF" />
                    </div>
                ))}
                {(!courses || courses.length === 0) && !loading && (
                    <Empty description="Chưa có dữ liệu" />
                )}
            </Space>
        </Card>
    );
}
