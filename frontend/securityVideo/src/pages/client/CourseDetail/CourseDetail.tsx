import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Row, Col, Typography, Button,
    Skeleton, App
} from 'antd';
import { courseService } from '../../../services/course.service';
import { courseRequestService } from '../../../services/courseRequest.service';
import styles from './CourseDetail.module.scss';

// Sub-components
import CourseOutcomes from './components/CourseOutcomes';
import CourseRequirements from './components/CourseRequirements';
import CourseCurriculum from './components/CourseCurriculum';
import CourseFloatingCard from './components/CourseFloatingCard';

const { Title, Paragraph } = Typography;

interface Course {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    intro_video_url: string;
    learning_outcomes: string;
    requirements: string;
    level: string;
    hasAccess: boolean;
    canAccess?: boolean; // New field
    accessReason?: string; // New field
    isOverdue?: boolean;
    is_private: boolean;
    requestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    sections: any[];
    instructor: { full_name: string; email: string; phone?: string };
    nextLessonId?: number | null;
    isCourseFinished?: boolean;
}

export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const fetchDetail = async () => {
        try {
            const data = await courseService.getById(id!);
            setCourse(data);
        } catch (error) {
            message.error('Lỗi khi tải thông tin khóa học');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleJoinPublicCourse = async () => {
        try {
            setSubmitting(true);
            await courseService.enroll(Number(id));
            message.success('Ghi danh thành công!');
            fetchDetail();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Lỗi tham gia khóa học');
        } finally {
            setSubmitting(false);
        }
    };

    const handleRequestAccess = async () => {
        try {
            setSubmitting(true);
            await courseRequestService.submitRequest(Number(id));
            message.success('Yêu cầu đã được gửi, vui lòng chờ phê duyệt');
            fetchDetail();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Lỗi gửi yêu cầu');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className={styles.loaderContainerCenter}><Skeleton active /></div>;
    if (!course) return <div>Không tìm thấy khóa học</div>;

    const totalLessons = course.sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);

    const renderActionButton = () => {
        // Kiểm tra quyền truy cập sớm (Early Access)
        if (course.canAccess === false) {
            return (
                <Button
                    size="large"
                    block
                    disabled
                    className={styles.actionBtnStyled}
                    style={{ backgroundColor: '#f5f5f5', color: '#8c8c8c' }}
                >
                    {course.accessReason || 'KHÓA HỌC CHƯA MỞ'}
                </Button>
            );
        }

        if (course.hasAccess) {
            const isOverdue = course.isOverdue;
            const isContinuing = !course.isCourseFinished;
            const targetUrl = course.nextLessonId
                ? `/course/${course.id}/learning?lessonId=${course.nextLessonId}`
                : `/course/${course.id}/learning`;

            return (
                <Button
                    type="primary"
                    size="large"
                    block
                    disabled={isOverdue}
                    className={`${styles.actionBtnStyled} ${!isOverdue ? styles.btnSuccess : ''}`}
                    style={isOverdue ? { backgroundColor: '#bfbfbf', borderColor: '#bfbfbf', opacity: 0.6, cursor: 'not-allowed' } : {}}
                    onClick={() => {
                        if (!isOverdue) {
                            navigate(targetUrl);
                        }
                    }}
                >
                    {isOverdue ? "ĐÃ KHÓA (QUÁ HẠN)" : (isContinuing ? "TIẾP TỤC HỌC" : "XEM LẠI KHÓA HỌC")}
                </Button>
            );
        }

        if (course.is_private) {
            if (course.requestStatus === 'PENDING') {
                return (
                    <Button
                        size="large"
                        block
                        disabled
                        className={styles.actionBtnStyled}
                    >
                        ĐANG CHỜ PHÊ DUYỆT
                    </Button>
                );
            }

            if (course.requestStatus === 'REJECTED') {
                return (
                    <Button
                        type="primary"
                        danger
                        size="large"
                        block
                        className={styles.actionBtnStyled}
                        onClick={handleRequestAccess}
                        loading={submitting}
                    >
                        YÊU CẦU LẠI
                    </Button>
                );
            }

            return (
                <Button
                    type="primary"
                    size="large"
                    block
                    className={`${styles.actionBtnStyled} ${styles.btnPrivate}`}
                    onClick={handleRequestAccess}
                    loading={submitting}
                >
                    GỬI YÊU CẦU TRUY CẬP
                </Button>
            );
        }

        return (
            <Button
                type="primary"
                size="large"
                block
                className={`${styles.actionBtnStyled} ${styles.btnPublic}`}
                onClick={handleJoinPublicCourse}
                loading={submitting}
            >
                THAM GIA KHÓA HỌC
            </Button>
        );
    };

    return (
        <div className={styles.courseDetailContainer}>
            <Row gutter={40}>
                <CourseFloatingCard
                    course={course}
                    totalLessons={totalLessons}
                    renderActionButton={renderActionButton}
                />
                <Col lg={16} md={24}>
                    <Title level={1} className={styles.courseTitleMain}>{course.title}</Title>
                    <Paragraph className={styles.courseDescription}>
                        {course.description}
                    </Paragraph>

                    <CourseOutcomes learning_outcomes={course.learning_outcomes} />

                    <CourseRequirements requirements={course.requirements} />

                    <CourseCurriculum sections={course.sections} totalLessons={totalLessons} />
                </Col>
            </Row>
        </div>
    );
}


