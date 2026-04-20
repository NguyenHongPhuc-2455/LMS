import { Typography, Button, Space } from 'antd';
import { RocketOutlined, TeamOutlined, BookOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import styles from '../ProgramDetail.module.scss';

const { Title, Paragraph } = Typography;

interface ProgramHeroProps {
    program: any;
    handleEnroll: () => void;
    handleRequestAccess: () => void;
    enrolling: boolean;
    submitting: boolean;
    navigate: (path: string) => void;
    sortedCourses: any[];
}

export default function ProgramHero({
    program,
    handleEnroll,
    handleRequestAccess,
    enrolling,
    submitting,
    navigate,
    sortedCourses
}: ProgramHeroProps) {
    return (
        <div className={styles.heroBanner}>
            <div className={styles.heroContent}>
                <div className={styles.heroHeader}>
                    <div style={{ flex: 1 }}>
                        <Title level={1} className={styles.heroTitle} style={{ margin: 0 }}>{program.title}</Title>
                    </div>
                    <div className={styles.heroActionTop}>
                        {program.isEnrolled ? (
                            <Button
                                type="primary"
                                size="large"
                                icon={<CheckCircleOutlined />}
                                className={`${styles.enrollBtn} ${styles.enrolled}`}
                                onClick={() => {
                                    if (program.currentCourseId) {
                                        navigate(`/course/${program.currentCourseId}`);
                                    } else if (sortedCourses.length > 0) {
                                        navigate(`/course/${sortedCourses[0].course.id}`);
                                    } else {
                                        navigate('/my-courses');
                                    }
                                }}
                            >
                                Đã đăng ký — Vào học ngay
                            </Button>
                        ) : program.is_private ? (
                            program.requestStatus === 'PENDING' ? (
                                <Button size="large" disabled className={styles.enrollBtn}>ĐANG CHỜ PHÊ DUYỆT</Button>
                            ) : program.requestStatus === 'REJECTED' ? (
                                <Button
                                    type="primary"
                                    danger
                                    size="large"
                                    className={styles.enrollBtn}
                                    onClick={handleRequestAccess}
                                    loading={submitting}
                                >
                                    YÊU CẦU LẠI
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    size="large"
                                    className={`${styles.enrollBtn} ${styles.privateBtn}`}
                                    onClick={handleRequestAccess}
                                    loading={submitting}
                                    icon={<LockOutlined />}
                                >
                                    ĐĂNG KÝ KHÓA HỌC
                                </Button>
                            )
                        ) : (
                            <Button
                                type="primary"
                                size="large"
                                loading={enrolling}
                                onClick={handleEnroll}
                                className={styles.enrollBtn}
                            >
                                Đăng ký miễn phí
                            </Button>
                        )}
                    </div>
                </div>

                {program.description && (
                    <Paragraph className={styles.heroDescription}>
                        {program.description}
                    </Paragraph>
                )}
                <Space size={24} className={styles.heroStats}>
                    <Space><RocketOutlined /> {program._count?.courses || 0} khóa học</Space>
                    <Space><TeamOutlined /> {program._count?.enrollments || 0} học viên đã đăng ký</Space>
                    <Space><BookOutlined /> Tạo bởi {program.instructor?.full_name}</Space>
                </Space>
            </div>
        </div>
    );
}
