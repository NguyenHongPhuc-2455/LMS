import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckOutlined, PlayCircleFilled,
    GlobalOutlined, ClockCircleOutlined,
    PlaySquareOutlined, ExperimentOutlined
} from '@ant-design/icons';
import {
    Row, Col, Typography, Button,
    Collapse, Space, Skeleton, App, List, Tag

} from 'antd';
import { courseService } from '../../../services/course.service';
import { courseRequestService } from '../../../services/courseRequest.service';
import styles from './CourseDetail.module.scss';



const { Title, Text, Paragraph } = Typography;

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
    is_private: boolean;
    requestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    sections: any[];
    instructor: { full_name: string };
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
        if (course.hasAccess) {
            const isContinuing = !course.isCourseFinished;
            const targetUrl = course.nextLessonId
                ? `/course/${course.id}/learning?lessonId=${course.nextLessonId}`
                : `/course/${course.id}/learning`;

            return (
                <Button
                    type="primary"
                    size="large"
                    block
                    className={`${styles.actionBtnStyled} ${styles.btnSuccess}`}
                    onClick={() => navigate(targetUrl)}
                >
                    {isContinuing ? "TIẾP TỤC HỌC" : "XEM LẠI KHÓA HỌC"}
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
                {/* Left Side: Info */}
                <Col lg={16} md={24}>
                    <Title level={1} className={styles.courseTitleMain}>{course.title}</Title>
                    <Paragraph className={styles.courseDescription}>
                        {course.description}
                    </Paragraph>

                    <div className={styles.infoSection}>
                        <Title level={4}>Bạn sẽ học được gì?</Title>
                        <Row gutter={[16, 12]}>
                            {(course.learning_outcomes || "- Kiến thức chuyên sâu và thực tế\n- Tự tay xây dựng các dự án phức tạp\n- Nắm vững các concept nâng cao\n- Kỹ năng giải quyết vấn đề thực tế\n- Tư duy lập trình chuyên nghiệp\n- Sẵn sàng cho các vị trí công việc cao")
                                .split('\n')
                                .filter(line => line.trim() !== '')
                                .map((item, index) => (
                                    <Col span={12} key={index} className={styles.outcomeItem}>
                                        <Space align="start">
                                            <CheckOutlined className={styles.outcomeIcon} />
                                            <Text className={styles.outcomeText}>{item.replace(/^- /, '')}</Text>
                                        </Space>
                                    </Col>
                                ))
                            }
                        </Row>
                    </div>

                    <div className={styles.infoSection}>
                        <Title level={4}>Yêu cầu</Title>
                        <ul className={styles.requirementsList}>
                            {(course.requirements || "- Có máy tính kết nối internet\n- Kiến thức cơ bản về HTML/CSS")
                                .split('\n')
                                .filter(line => line.trim() !== '')
                                .map((item, index) => (
                                    <li key={index} className={styles.requirementItem}>
                                        {item.replace(/^- /, '')}
                                    </li>
                                ))
                            }
                        </ul>
                    </div>

                    <div className={styles.infoSection}>
                        <div className={styles.sectionContentHeader}>
                            <Title level={4} style={{ margin: 0 }}>Nội dung khóa học</Title>
                        </div>
                        <Text type="secondary" className={styles.sectionStats}>
                            {course.sections.length} chương • {totalLessons} bài học • Thời lượng {(() => {
                                const totalSeconds = course.sections.reduce((acc, s) => acc + (s.lessons?.reduce((lacc: number, l: any) => lacc + (l.duration || 0), 0) || 0), 0);
                                const h = Math.floor(totalSeconds / 3600);
                                const m = Math.floor((totalSeconds % 3600) / 60);
                                return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
                            })()}
                        </Text>

                        <Collapse
                            expandIconPlacement="start"
                            bordered={false}
                            className={styles.curriculumCollapse}
                            items={course.sections.map((section, idx) => ({
                                key: section.id,
                                label: (
                                    <div className={styles.sectionCollapseHeader}>
                                        <Text strong>{idx + 1}. {section.title}</Text>
                                        <Text type="secondary">{section.lessons?.length || 0} bài học</Text>
                                    </div>
                                ),
                                children: (
                                    <List
                                        dataSource={section.lessons}
                                        renderItem={(lesson: any, lidx: number) => (
                                            <List.Item className={`${styles.lessonItem} ${lesson.isCompleted ? styles.completed : ''}`}>
                                                <Space size={12}>
                                                    {lesson.isCompleted ? (
                                                        <CheckOutlined style={{ color: '#22c55e' }} />
                                                    ) : (
                                                        <PlayCircleFilled className={styles.lessonIcon} />
                                                    )}
                                                    <Text className={styles.lessonTitle}>{idx + 1}.{lidx + 1} {lesson.title}</Text>
                                                </Space>

                                                {lesson.duration > 0 && (
                                                    <Text type="secondary" className={styles.lessonDuration}>
                                                        {Math.floor(lesson.duration / 60).toString().padStart(2, '0')}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                                    </Text>
                                                )}
                                            </List.Item>
                                        )}
                                    />
                                ),
                                className: styles.sectionPanelItem
                            }))}
                        />
                    </div>
                </Col>

                {/* Right Side: Floating Sidebar */}
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
                                    {
                                        icon: <ClockCircleOutlined />,
                                        text: `Thời lượng ${(() => {
                                            const totalSeconds = course.sections.reduce((acc, s) => acc + (s.lessons?.reduce((lacc: number, l: any) => lacc + (l.duration || 0), 0) || 0), 0);
                                            const h = Math.floor(totalSeconds / 3600);
                                            const m = Math.floor((totalSeconds % 3600) / 60);
                                            return h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;
                                        })()}`
                                    },
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
            </Row>

        </div>
    );
}

