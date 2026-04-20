import { Typography, Button } from 'antd';
import { TeamOutlined, BookOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
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
                <div className={styles.heroMainLayout}>
                    <div className={styles.heroTextSection}>
                        <Title level={1} className={styles.heroTitle}>{program.title}</Title>

                        {program.description && (
                            <Paragraph className={styles.heroDescription}>
                                {program.description}
                            </Paragraph>
                        )}

                        <div className={styles.heroStats}>
                            <div className={styles.statItem}><BookOutlined /> <span>{program._count?.courses || 0} khóa học</span></div>
                            <div className={styles.statDivider} />
                            <div className={styles.statItem}><TeamOutlined /> <span>{program._count?.enrollments || 0} học viên</span></div>
                            <div className={styles.statDivider} />
                            <div className={styles.statItem}><CheckCircleOutlined /> <span>Tạo bởi <strong>{program.instructor?.full_name}</strong></span></div>
                        </div>
                    </div>

                    <div className={styles.heroActionSection}>
                        <div className={styles.actionGlowEffect} />
                        {program.isEnrolled ? (
                            <Button
                                type="primary"
                                icon={<CheckCircleOutlined />}
                                className={`${styles.premiumActionBtn} ${styles.enrolled}`}
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
                                ĐÃ ĐĂNG KÝ — VÀO HỌC NGAY
                            </Button>
                        ) : program.is_private ? (
                            program.requestStatus === 'PENDING' ? (
                                <Button disabled className={styles.premiumActionBtn}>ĐANG CHỜ PHÊ DUYỆT</Button>
                            ) : program.requestStatus === 'REJECTED' ? (
                                <Button
                                    type="primary"
                                    danger
                                    className={styles.premiumActionBtn}
                                    onClick={handleRequestAccess}
                                    loading={submitting}
                                >
                                    YÊU CẦU LẠI
                                </Button>
                            ) : (
                                <Button
                                    type="primary"
                                    className={`${styles.premiumActionBtn} ${styles.privateBtn}`}
                                    onClick={handleRequestAccess}
                                    loading={submitting}
                                    icon={<LockOutlined />}
                                >
                                    ĐĂNG KÝ THAM GIA
                                </Button>
                            )
                        ) : (
                            <Button
                                type="primary"
                                loading={enrolling}
                                onClick={handleEnroll}
                                className={styles.premiumActionBtn}
                            >
                                BẮT ĐẦU NGAY — MIỄN PHÍ
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
