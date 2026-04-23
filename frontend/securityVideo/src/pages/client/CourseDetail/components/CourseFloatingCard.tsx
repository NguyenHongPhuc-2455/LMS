import { Col, Typography, Tag } from 'antd';
import { ExperimentOutlined, PlaySquareOutlined, ClockCircleOutlined, GlobalOutlined } from '@ant-design/icons';
import styles from '../CourseDetail.module.scss';

const { Text } = Typography;

interface CourseFloatingCardProps {
    course: any;
    totalLessons: number;
    renderActionButton: () => React.ReactNode;
}

export default function CourseFloatingCard({ course, totalLessons, renderActionButton }: CourseFloatingCardProps) {
    return (
        <Col lg={8} md={24}>
            <div className={styles.floatingSidebar}>
                <div className={styles.thumbnailWrapper}>
                    <img
                        src={course.thumbnail || "https://files.fullstack.edu.vn/f8-prod/courses/2.png"}
                        className={styles.thumbnailImg}
                        alt="Course"
                    />
                </div>

                <div className={styles.sidebarActions}>
                    <div className={styles.statusTagContainer}>
                        <Tag color={course.is_private ? 'purple' : 'green'} className={styles.courseStatusTag}>
                            {course.is_private ? "KHÓA HỌC RIÊNG TƯ" : "KHÓA HỌC CÔNG KHAI"}
                        </Tag>
                    </div>

                    {renderActionButton()}

                    <ul className={styles.sidebarInfoList}>
                        {[
                            { icon: <ExperimentOutlined />, text: `Trình độ ${course.level || 'Cơ bản'}` },
                            { icon: <PlaySquareOutlined />, text: `Tổng số ${totalLessons} bài học` },
                            // {
                            //     icon: <ClockCircleOutlined />,
                            //     text: `Thời lượng ${(() => {
                            //         const totalSeconds = course.sections.reduce((acc: number, s: any) => acc + (s.lessons?.reduce((lacc: number, l: any) => lacc + (l.duration || 0), 0) || 0), 0);
                            //         const h = Math.floor(totalSeconds / 3600);
                            //         const m = Math.floor((totalSeconds % 3600) / 60);
                            //         return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
                            //     })()}`
                            // },
                            { icon: <GlobalOutlined />, text: "Học mọi lúc, mọi nơi" }
                        ].map((item, i) => (
                            <li key={i} className={styles.infoItem}>
                                <span className={styles.infoIcon}>{item.icon}</span>
                                <Text className={styles.infoText}>{item.text}</Text>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </Col>
    );
}
