import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckOutlined, PlayCircleFilled,
    GlobalOutlined, ClockCircleOutlined,
    PlaySquareOutlined, ExperimentOutlined
} from '@ant-design/icons';
import {
    Row, Col, Typography, Button,
    Collapse, Space, Skeleton, App, List, Badge
} from 'antd';
import api from '../../api';
import './CourseDetail.scss';

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
            const res = await api.get(`/courses/${id}`);
            setCourse(res.data);
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
            const res = await api.post(`/courses/${id}/enroll`);
            message.success(res.data.message);
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
            const res = await api.post('/course-requests', { courseId: id });
            message.success(res.data.message);
            fetchDetail(); // Refresh to update status
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Lỗi gửi yêu cầu');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="loader-container-center"><Skeleton active /></div>;
    if (!course) return <div>Không tìm thấy khóa học</div>;

    const totalLessons = course.sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);

    const renderActionButton = () => {
        if (course.hasAccess) {
            return (
                <Button
                    type="primary"
                    size="large"
                    block
                    className="action-btn-styled btn-success"
                    onClick={() => navigate(`/course/${course.id}/learning`)}
                >
                    VÀO HỌC NGAY
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
                        className="action-btn-styled"
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
                        className="action-btn-styled"
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
                    className="action-btn-styled btn-private"
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
                className="action-btn-styled btn-public"
                onClick={handleJoinPublicCourse}
                loading={submitting}
            >
                THAM GIA KHÓA HỌC
            </Button>
        );
    };

    return (
        <div className="course-detail-container">
            <Row gutter={40}>
                {/* Left Side: Info */}
                <Col lg={16} md={24}>
                    <Title level={1} className="course-title-main">{course.title}</Title>
                    <Paragraph className="course-description">
                        {course.description}
                    </Paragraph>

                    <div className="info-section">
                        <Title level={4}>Bạn sẽ học được gì?</Title>
                        <Row gutter={[16, 12]}>
                            {(course.learning_outcomes || "- Kiến thức chuyên sâu và thực tế\n- Tự tay xây dựng các dự án phức tạp\n- Nắm vững các concept nâng cao\n- Kỹ năng giải quyết vấn đề thực tế\n- Tư duy lập trình chuyên nghiệp\n- Sẵn sàng cho các vị trí công việc cao")
                                .split('\n')
                                .filter(line => line.trim() !== '')
                                .map((item, index) => (
                                    <Col span={12} key={index} className="outcome-item">
                                        <Space align="start">
                                            <CheckOutlined className="outcome-icon" />
                                            <Text className="outcome-text">{item.replace(/^- /, '')}</Text>
                                        </Space>
                                    </Col>
                                ))
                            }
                        </Row>
                    </div>

                    <div className="info-section">
                        <Title level={4}>Yêu cầu</Title>
                        <ul className="requirements-list">
                            {(course.requirements || "- Có máy tính kết nối internet\n- Kiến thức cơ bản về HTML/CSS")
                                .split('\n')
                                .filter(line => line.trim() !== '')
                                .map((item, index) => (
                                    <li key={index} className="requirement-item">
                                        {item.replace(/^- /, '')}
                                    </li>
                                ))
                            }
                        </ul>
                    </div>

                    <div className="info-section">
                        <div className="section-content-header">
                            <Title level={4} style={{ margin: 0 }}>Nội dung khóa học</Title>
                        </div>
                        <Text type="secondary" className="section-stats">
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
                            className="curriculum-collapse"
                            items={course.sections.map((section, idx) => ({
                                key: section.id,
                                label: (
                                    <div className="section-collapse-header">
                                        <Text strong>{idx + 1}. {section.title}</Text>
                                        <Text type="secondary">{section.lessons?.length || 0} bài học</Text>
                                    </div>
                                ),
                                children: (
                                    <List
                                        dataSource={section.lessons}
                                        renderItem={(lesson: any, lidx: number) => (
                                            <List.Item className="lesson-item">
                                                <Space size={12}>
                                                    <PlayCircleFilled className="lesson-icon" />
                                                    <Text className="lesson-title">{idx + 1}.{lidx + 1} {lesson.title}</Text>
                                                </Space>
                                                {lesson.duration > 0 && (
                                                    <Text type="secondary" className="lesson-duration">
                                                        {Math.floor(lesson.duration / 60).toString().padStart(2, '0')}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                                    </Text>
                                                )}
                                            </List.Item>
                                        )}
                                    />
                                ),
                                className: "section-panel-item"
                            }))}
                        />
                    </div>
                </Col>

                {/* Right Side: Floating Sidebar */}
                <Col lg={8} md={24}>
                    <div className="floating-sidebar">
                        <div className="thumbnail-wrapper">
                            <img
                                src={course.thumbnail || "https://files.fullstack.edu.vn/f8-prod/courses/2.png"}
                                className="thumbnail-img"
                                alt="Course"
                            />
                        </div>

                        <div className="sidebar-actions">
                            <div className="status-badge-container">
                                <Badge
                                    count={course.is_private ? "KHÓA HỌC RIÊNG TƯ" : "KHÓA HỌC CÔNG KHAI"}
                                    className={course.is_private ? 'badge-private' : 'badge-public-height'}
                                    style={!course.is_private ? { backgroundColor: '#26ac51' } : {}}
                                />
                            </div>

                            {renderActionButton()}

                            <ul className="sidebar-info-list">
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
                                    <li key={i} className="info-item">
                                        <span className="info-icon">{item.icon}</span>
                                        <Text className="info-text">{item.text}</Text>
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
