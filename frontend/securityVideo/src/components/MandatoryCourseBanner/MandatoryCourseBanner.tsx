import React, { useEffect, useState } from 'react';
import { Tag, Typography, Space, Button, Modal, List } from 'antd';
import { WarningOutlined, ClockCircleOutlined, CheckCircleOutlined, ArrowRightOutlined, BookOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../services/course.service';
import { ROUTES } from '../../constants/routes';
import styles from './MandatoryCourseBanner.module.scss';

const { Text, Title } = Typography;

interface MandatoryCourse {
    id: number;
    title: string;
    thumbnail: string;
    remainingDays: number;
    progressPercent: number;
    totalLessons: number;
    completedLessons: number;
    status: 'NORMAL' | 'WARNING' | 'OVERDUE' | 'COMPLETED';
    mandatory_deadline_days: number;
}

export default function MandatoryCourseBanner() {
    const [courses, setCourses] = useState<MandatoryCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [loginNotifyModal, setLoginNotifyModal] = useState<{ open: boolean; courses: any[] }>({
        open: false, courses: []
    });
    const navigate = useNavigate();

    useEffect(() => {
        const shouldShowModal = sessionStorage.getItem('show_mandatory_modal') === 'true';

        // Tải danh sách khóa học bắt buộc
        courseService.getMandatoryCourses()
            .then(data => {
                const activeCourses = data.filter((c: MandatoryCourse) => c.status !== 'COMPLETED');
                setCourses(activeCourses);

                // Nếu có cờ vừa đăng nhập và có khóa học chưa hoàn thành thì hiện Modal
                if (shouldShowModal && activeCourses.length > 0) {
                    setLoginNotifyModal({ open: true, courses: activeCourses });
                }
            })
            .catch(console.error)
            .finally(() => {
                setLoading(false);
                sessionStorage.removeItem('show_mandatory_modal');
            });
    }, []);

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'OVERDUE':
                return { color: '#ff4d4f', bg: 'linear-gradient(135deg, #fff2f0, #ffe7e6)', border: '#ffccc7', icon: <WarningOutlined />, label: 'Quá hạn' };
            case 'WARNING':
                return { color: '#fa8c16', bg: 'linear-gradient(135deg, #fffbe6, #fff7e6)', border: '#ffe58f', icon: <ClockCircleOutlined />, label: 'Sắp hết hạn' };
            default:
                return { color: '#1677ff', bg: 'linear-gradient(135deg, #f0f5ff, #e6efff)', border: '#adc6ff', icon: <ClockCircleOutlined />, label: 'Đang tiến hành' };
        }
    };

    return (
        <>
            {/* ====== MODAL THÔNG BÁO NGAY KHI VÀO TRANG CHỦ SAU LOGIN ====== */}
            <Modal
                open={loginNotifyModal.open}
                onCancel={() => setLoginNotifyModal(prev => ({ ...prev, open: false }))}
                footer={null}
                centered
                width={520}
                closable={true}
                styles={{ mask: { backdropFilter: 'blur(4px)' } }}
            >
                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'linear-gradient(135deg, #fff7e6, #ffe58f)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        margin: '0 auto 16px', border: '2px solid #ffe58f'
                    }}>
                        <BookOutlined style={{ fontSize: 28, color: '#fa8c16' }} />
                    </div>
                    <Title level={4} style={{ margin: 0 }}>Chào mừng đến với eLearning!</Title>
                    <Text type="secondary" style={{ fontSize: 14, display: 'block', marginTop: 6 }}>
                        Bạn có <strong style={{ color: '#fa8c16' }}>{loginNotifyModal.courses.length} khóa học bắt buộc</strong> cần hoàn thành trong thời gian quy định
                    </Text>
                </div>

                <List
                    dataSource={loginNotifyModal.courses}
                    renderItem={(course: any) => (
                        <List.Item style={{
                            padding: '10px 14px', marginBottom: 8,
                            background: 'linear-gradient(135deg, #fffbe6, #fff)',
                            borderRadius: 10, border: '1px solid #ffe58f'
                        }}>
                            <Space style={{ width: '100%' }}>
                                <WarningOutlined style={{ color: '#fa8c16', fontSize: 16, flexShrink: 0 }} />
                                <div style={{ flex: 1 }}>
                                    <Text strong style={{ display: 'block' }}>{course.title}</Text>
                                    <Space size={4}>
                                        <ClockCircleOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            Hạn hoàn thành: {course.mandatory_deadline_days} ngày kể từ ngày nhận việc
                                        </Text>
                                    </Space>
                                </div>
                                <Tag color={course.remainingDays <= 7 ? 'error' : 'orange'}>
                                    Còn {course.remainingDays} ngày
                                </Tag>
                            </Space>
                        </List.Item>
                    )}
                />

                <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
                    <Button
                        type="primary"
                        block
                        icon={<ArrowRightOutlined />}
                        size="large"
                        style={{ background: '#C72127', borderColor: '#C72127' }}
                        onClick={() => setLoginNotifyModal(prev => ({ ...prev, open: false }))}
                    >
                        Đã hiểu, bắt đầu học
                    </Button>
                    <Button block size="large" onClick={() => setLoginNotifyModal(prev => ({ ...prev, open: false }))}>
                        Để sau
                    </Button>
                </div>
            </Modal>

            {/* ====== BANNER THƯỜNG TRỰC TRÊN TRANG CHỦ ====== */}
            {!loading && courses.length > 0 && (
                <div className={styles.mandatoryBannerContainer}>
                    <div className={styles.bannerHeader}>
                        <div className={styles.bannerTitleRow}>
                            <WarningOutlined style={{ color: '#fa8c16', fontSize: 20 }} />
                            <Title level={5} style={{ margin: 0 }}>Khóa học bắt buộc cần hoàn thành</Title>
                            <Tag color="orange">{courses.length} khóa</Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Vui lòng hoàn thành các khóa học bắt buộc trước hạn
                        </Text>
                    </div>

                    <div className={styles.courseList}>
                        {courses.map(course => {
                            const config = getStatusConfig(course.status);
                            return (
                                <div
                                    key={course.id}
                                    className={styles.courseCard}
                                    style={{ background: config.bg, borderColor: config.border }}
                                >
                                    <div className={styles.courseThumb}>
                                        <img
                                            src={course.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=200&auto=format&fit=crop'}
                                            alt={course.title}
                                        />
                                    </div>

                                    <div className={styles.courseInfo}>
                                        <Text strong className={styles.courseTitle}>{course.title}</Text>
                                        <Space size={8} style={{ marginTop: 4 }}>
                                            <Tag color={config.color} icon={config.icon} style={{ margin: 0 }}>
                                                {config.label}
                                            </Tag>
                                            <Text style={{ fontSize: 12, color: config.color }}>
                                                {course.status === 'OVERDUE'
                                                    ? `Trễ ${Math.abs(course.remainingDays)} ngày`
                                                    : `Còn ${course.remainingDays} ngày`
                                                }
                                            </Text>
                                        </Space>

                                        <div className={styles.progressWrapper}>
                                            <div className={styles.progressBar}>
                                                <div
                                                    className={styles.progressFill}
                                                    style={{
                                                        width: `${course.progressPercent}%`,
                                                        background: config.color
                                                    }}
                                                />
                                            </div>
                                            <Text style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>
                                                {course.completedLessons}/{course.totalLessons} bài
                                            </Text>
                                        </div>
                                    </div>

                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<ArrowRightOutlined />}
                                        disabled={course.status === 'OVERDUE'}
                                        style={{ 
                                            opacity: course.status === 'OVERDUE' ? 0.6 : 1,
                                            cursor: course.status === 'OVERDUE' ? 'not-allowed' : 'pointer',
                                            backgroundColor: course.status === 'OVERDUE' ? '#bfbfbf' : config.color,
                                            borderColor: course.status === 'OVERDUE' ? '#bfbfbf' : config.color
                                        }}
                                        onClick={() => {
                                            if (course.status !== 'OVERDUE') {
                                                navigate(`/course/${course.id}`);
                                            }
                                        }}
                                    >
                                        Học ngay
                                    </Button>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
