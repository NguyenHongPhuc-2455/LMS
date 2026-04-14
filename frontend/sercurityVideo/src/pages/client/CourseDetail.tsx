import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    CheckOutlined, PlayCircleFilled,
    GlobalOutlined, ClockCircleOutlined,
    PlaySquareOutlined, ExperimentOutlined
} from '@ant-design/icons';
import {
    Row, Col, Typography, Button,
    Collapse, Space, Skeleton, App, List
} from 'antd';
import api from '../../api';

const { Title, Text, Paragraph } = Typography;

interface Course {
    id: number;
    title: string;
    description: string;
    price: string | number;
    thumbnail: string;
    intro_video_url: string;
    learning_outcomes: string;
    requirements: string;
    level: string;
    hasAccess: boolean;
    sections: any[];
    instructor: { full_name: string };
}

export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { message } = App.useApp();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchDetail();
    }, [id]);

    const handleBuy = async () => {
        try {
            message.loading({ content: 'Đang kết nối tới cổng thanh toán VNPay...', key: 'payment' });
            const res = await api.post('/payments/create-vnpay-url', { courseId: id });
            if (res.data.payUrl) {
                window.location.href = res.data.payUrl;
            }
        } catch (error: any) {
            message.error({ content: error.response?.data?.error || 'Lỗi khởi tạo thanh toán', key: 'payment' });
        }
    };

    if (loading) return <div style={{ padding: 50 }}><Skeleton active /></div>;
    if (!course) return <div>Không tìm thấy khóa học</div>;

    const totalLessons = course.sections.reduce((acc, s) => acc + (s.lessons?.length || 0), 0);

    return (
        <div style={{ padding: '20px 4%', maxWidth: '1200px', margin: '0 auto' }}>
            <Row gutter={40}>
                {/* Left Side: Info */}
                <Col lg={16} md={24}>
                    <Title level={1} style={{ fontSize: '32px', marginBottom: '16px' }}>{course.title}</Title>
                    <Paragraph style={{ fontSize: '15px', color: '#444', marginBottom: '32px' }}>
                        {course.description}
                    </Paragraph>

                    <div style={{ marginBottom: '40px' }}>
                        <Title level={4}>Bạn sẽ học được gì?</Title>
                        <Row gutter={[16, 12]}>
                            {(course.learning_outcomes || "- Kiến thức chuyên sâu và thực tế\n- Tự tay xây dựng các dự án phức tạp\n- Nắm vững các concept nâng cao\n- Kỹ năng giải quyết vấn đề thực tế\n- Tư duy lập trình chuyên nghiệp\n- Sẵn sàng cho các vị trí công việc cao")
                                .split('\n')
                                .filter(line => line.trim() !== '')
                                .map((item, index) => (
                                    <Col span={12} key={index}>
                                        <Space align="start">
                                            <CheckOutlined style={{ color: '#f05123', marginTop: '5px' }} />
                                            <Text style={{ fontSize: '14px' }}>{item.replace(/^- /, '')}</Text>
                                        </Space>
                                    </Col>
                                ))
                            }
                        </Row>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <Title level={4}>Yêu cầu</Title>
                        <ul style={{ paddingLeft: '20px', color: '#444' }}>
                            {(course.requirements || "- Có máy tính kết nối internet\n- Kiến thức cơ bản về HTML/CSS")
                                .split('\n')
                                .filter(line => line.trim() !== '')
                                .map((item, index) => (
                                    <li key={index} style={{ marginBottom: '8px', fontSize: '14px' }}>
                                        {item.replace(/^- /, '')}
                                    </li>
                                ))
                            }
                        </ul>
                    </div>

                    <div style={{ marginBottom: '40px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <Title level={4} style={{ margin: 0 }}>Nội dung khóa học</Title>
                        </div>
                        <Text type="secondary" style={{ display: 'block', marginBottom: '16px' }}>
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
                            style={{ background: '#fff' }}
                            items={course.sections.map((section, idx) => ({
                                key: section.id,
                                label: (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '4px 0' }}>
                                        <Text strong>{idx + 1}. {section.title}</Text>
                                        <Text type="secondary">{section.lessons?.length || 0} bài học</Text>
                                    </div>
                                ),
                                children: (
                                    <List
                                        dataSource={section.lessons}
                                        renderItem={(lesson: any, lidx: number) => (
                                            <List.Item style={{ border: 'none', padding: '12px 20px' }}>
                                                <Space size={12}>
                                                    <PlayCircleFilled style={{ color: '#f05123', fontSize: '14px', opacity: 0.6 }} />
                                                    <Text style={{ fontSize: '14px', color: '#333' }}>{idx + 1}.{lidx + 1} {lesson.title}</Text>
                                                </Space>
                                                {lesson.duration > 0 && (
                                                    <Text type="secondary" style={{ fontSize: '13px' }}>
                                                        {Math.floor(lesson.duration / 60).toString().padStart(2, '0')}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                                    </Text>
                                                )}
                                            </List.Item>
                                        )}
                                    />
                                ),
                                style: {
                                    marginBottom: '8px',
                                    background: '#f7f8fa',
                                    borderRadius: '6px',
                                    border: 'none',
                                    overflow: 'hidden'
                                }
                            }))}
                        />
                    </div>
                </Col>

                {/* Right Side: Floating Sidebar */}
                <Col lg={8} md={24}>
                    <div style={{
                        position: 'sticky',
                        top: '90px',
                        background: '#fff',
                        borderRadius: '16px',
                        padding: '2px',
                        textAlign: 'center'
                    }}>
                        <div style={{
                            position: 'relative',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            marginBottom: '20px',
                            cursor: 'pointer'
                        }}>
                            <img
                                src={course.thumbnail || "https://files.fullstack.edu.vn/f8-prod/courses/2.png"}
                                style={{ width: '100%', display: 'block', transition: '0.3s' }}
                                alt="Course"
                            />
                        </div>

                        <div style={{ padding: '0 20px 20px' }}>
                            <Title level={2} style={{ color: '#26ac51ff', margin: '16px 0' }}>
                                {Number(course.price) === 0 ? 'Miễn phí' : `${Number(course.price).toLocaleString()}đ`}
                            </Title>

                            <Button
                                type="primary"
                                size="large"
                                block
                                style={{
                                    height: '50px',
                                    borderRadius: '25px',
                                    background: '#7064f9ff',
                                    border: 'none',
                                    fontWeight: 700,
                                    fontSize: '16px',
                                    marginBottom: '24px'
                                }}
                                onClick={() => {
                                    if (course.hasAccess) {
                                        navigate(`/course/${course.id}/learning`);
                                    } else {
                                        handleBuy();
                                    }
                                }}
                            >
                                {course.hasAccess ? "VÀO HỌC NGAY" : "ĐĂNG KÝ HỌC"}
                            </Button>

                            <ul style={{ textAlign: 'left', listStyle: 'none', padding: 0, margin: 0 }}>
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
                                    <li key={i} style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ color: '#444', fontSize: '16px' }}>{item.icon}</span>
                                        <Text style={{ color: '#494949', fontSize: '14px' }}>{item.text}</Text>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </Col>
            </Row>

            <style>{`
                .ant-collapse-header { padding: 12px 20px !important; }
                .ant-collapse-content-box { padding: 0 !important; background: #fff !important; }
            `}</style>
        </div>
    );
}
