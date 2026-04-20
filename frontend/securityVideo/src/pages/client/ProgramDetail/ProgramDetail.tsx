import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography, Button, Space, Tag, Card, List, Avatar,
    Skeleton, message
} from 'antd';

import { BookOutlined, TeamOutlined, RocketOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import { programService } from '../../../services/program.service';
import { programRequestService } from '../../../services/programRequest.service';
import styles from './ProgramDetail.module.scss';


const { Title, Text, Paragraph } = Typography;

interface Course {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    instructor: { full_name: string };
    _count: { sections: number; enrollments: number };
}

interface ProgramCourse {
    order: number;
    course: Course;
    isLocked?: boolean;
    progressPercent?: number;
    isFinished?: boolean;
}

interface Program {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    status: string;
    is_private: boolean;
    instructor: { id: number; full_name: string; username: string };
    courses: ProgramCourse[];
    _count: { enrollments: number; courses: number };
    isEnrolled: boolean;
    requestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    currentCourseId?: number | null;
}




export default function ProgramDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [program, setProgram] = useState<Program | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const token = localStorage.getItem('token');

    const fetchDetail = async () => {
        try {
            const data = await programService.getById(id!);
            setProgram(data);
        } catch {
            message.error('Không tìm thấy chương trình học');
            navigate('/programs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleEnroll = async () => {
        if (!token) { navigate('/login'); return; }
        setEnrolling(true);
        try {
            await programService.enroll(Number(id));

            message.success('Đăng ký chương trình học thành công! Tất cả khóa học đã được mở.');
            setProgram(prev => prev ? { ...prev, isEnrolled: true } : prev);
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Lỗi khi đăng ký');
        } finally {
            setEnrolling(false);
        }
    };

    const handleRequestAccess = async () => {
        if (!token) { navigate('/login'); return; }
        setSubmitting(true);
        try {
            const data = await programRequestService.submitRequest(Number(id));
            message.success(data.message || 'Gửi yêu cầu thành công, vui lòng chờ Admin phê duyệt');

            fetchDetail(); // Refresh status
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Lỗi khi gửi yêu cầu');
        } finally {
            setSubmitting(false);
        }
    };


    if (loading) return <div className={styles.loadingContainer}><Skeleton active paragraph={{ rows: 12 }} /></div>;
    if (!program) return null;

    const sortedCourses = [...program.courses].sort((a, b) => a.order - b.order);

    return (
        <div className={styles.programDetailContainer}>
            {/* Hero Banner */}
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


            {/* Danh sách khóa học */}
            <div className={styles.programContentArea}>
                <Title level={3} className={styles.curriculumTitle}>
                    Lộ trình học ({sortedCourses.length} khóa học)
                </Title>

                <List
                    dataSource={sortedCourses}
                    renderItem={(pc, index) => {
                        const c = pc.course;
                        const isLocked = pc.isLocked;
                        const isFinished = pc.isFinished;
                        const progress = pc.progressPercent || 0;

                        return (
                            <Card
                                hoverable={program.isEnrolled && !isLocked}
                                className={`${styles.courseCardItem} ${isLocked ? styles.locked : ''} ${isFinished ? styles.finished : ''}`}
                                style={{
                                    cursor: (program.isEnrolled && !isLocked) ? 'pointer' : 'default',
                                }}
                                onClick={() => {
                                    if (program.isEnrolled) {
                                        if (isLocked) {
                                            message.warning('Bạn cần hoàn thành khóa học trước đó để mở khóa nội dung này.');
                                        } else {
                                            navigate(`/course/${c.id}`);
                                        }
                                    }
                                }}
                            >
                                <div className={styles.courseCardContent}>
                                    <div className={styles.orderCircle} style={{ backgroundColor: isLocked ? '#94a3b8' : isFinished ? '#22c55e' : undefined }}>
                                        {isFinished ? <CheckCircleOutlined /> : index + 1}
                                    </div>
                                    <Avatar
                                        src={c.thumbnail}
                                        shape="square"
                                        size={64}
                                        className={styles.courseThumbnail}
                                        icon={<BookOutlined />}
                                        style={{ filter: isLocked ? 'grayscale(100%)' : 'none' }}
                                    />
                                    <div className={styles.courseInfo}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Text strong className={styles.courseTitle}>{c.title}</Text>
                                            {program.isEnrolled && (
                                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                                    {isFinished ? 'Hoàn thành' : `${progress}%`}
                                                </Text>
                                            )}
                                        </div>
                                        <Space size={12} className={styles.courseMeta}>
                                            <Tag>{c.level}</Tag>
                                            <Text type="secondary">
                                                {c._count?.sections || 0} chương
                                            </Text>
                                        </Space>

                                        {program.isEnrolled && !isLocked && (
                                            <div className={styles.courseProgressBarMini}>
                                                <div
                                                    className={`${styles.progressFill} ${isFinished ? styles.isFinished : ''}`}
                                                    style={{ width: `${progress}%` }}
                                                ></div>
                                            </div>
                                        )}
                                    </div>
                                    <div className={styles.lockStatusIcon}>
                                        {!program.isEnrolled ? (
                                            <LockOutlined style={{ color: '#94a3b8', fontSize: 18 }} />
                                        ) : isLocked ? (
                                            <LockOutlined style={{ color: '#ef4444', fontSize: 18 }} />
                                        ) : isFinished ? (
                                            <CheckCircleOutlined style={{ color: '#22c55e', fontSize: 18 }} />
                                        ) : (
                                            <RocketOutlined style={{ color: '#6366f1', fontSize: 18 }} />
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    }}
                />


                {sortedCourses.length === 0 && (
                    <Card className={styles.emptyCourseCard}>
                        <BookOutlined className={styles.emptyIcon} />
                        <br />
                        <Text type="secondary">Chưa có khóa học nào trong chương trình này</Text>
                    </Card>
                )}



            </div>
        </div>
    );
}


