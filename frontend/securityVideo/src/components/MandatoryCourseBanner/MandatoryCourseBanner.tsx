import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Tag, Typography, Space, Button, Modal, List, Drawer, Tabs, Badge } from 'antd';
import { WarningOutlined, ClockCircleOutlined, CheckCircleOutlined, ArrowRightOutlined, BookOutlined, BellOutlined, CarryOutOutlined } from '@ant-design/icons';
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

interface Props {
    hideBanner?: boolean;
    hideFloating?: boolean;
    hideDrawer?: boolean;
}

export default function MandatoryCourseBanner({ hideBanner = false, hideFloating = false, hideDrawer = false }: Props) {
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
                // Lưu toàn bộ để phân loại vào Tabs (bao gồm cả COMPLETED)
                setCourses(data);

                // Lọc các khóa học CÒN HẠN (không tính quá hạn/hoàn thành) để hiển thị trong Modal thông báo
                const validCoursesForModal = data.filter((c: MandatoryCourse) => c.status !== 'COMPLETED' && c.status !== 'OVERDUE');

                // Chỉ hiện Modal nếu vừa đăng nhập và có ít nhất 1 khóa học CÒN HẠN
                if (shouldShowModal && validCoursesForModal.length > 0) {
                    setLoginNotifyModal({ open: true, courses: validCoursesForModal });
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
            case 'COMPLETED':
                return { color: '#52c41a', bg: 'linear-gradient(135deg, #f6ffed, #f0f9eb)', border: '#b7eb8f', icon: <CheckCircleOutlined />, label: 'Hoàn thành' };
            default:
                return { color: '#1677ff', bg: 'linear-gradient(135deg, #f0f5ff, #e6efff)', border: '#adc6ff', icon: <ClockCircleOutlined />, label: 'Đang học' };
        }
    };

    const renderCourseList = (filteredCourses: MandatoryCourse[]) => {
        if (filteredCourses.length === 0) {
            return (
                <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                    <CheckCircleOutlined style={{ fontSize: 40, display: 'block', marginBottom: 12 }} />
                    <Text>Không có khóa học nào trong mục này</Text>
                </div>
            );
        }
        return (
            <div className={styles.courseList}>
                {filteredCourses.map(course => {
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
                                            ? `Quá hạn`
                                            : course.status === 'COMPLETED' 
                                                ? 'Đã hoàn tất' 
                                                : (course.remainingDays !== null ? `Còn ${course.remainingDays} ngày` : 'Bắt buộc')
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
                                        {course.completedLessons}/{course.totalLessons} bài ({course.progressPercent}%)
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
                                {course.status === 'COMPLETED' ? 'Xem lại' : 'Học ngay'}
                            </Button>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            {/* ====== SIDEBAR THÔNG BÁO CAO CẤP (GLASSMORPHISM) (Ẩn nếu hideDrawer = true) ====== */}
            {!hideDrawer && (
                <Drawer
                    open={loginNotifyModal.open}
                onClose={() => setLoginNotifyModal(prev => ({ ...prev, open: false }))}
                placement="right"
                width={400}
                closable={false}
                className={styles.glassDrawer}
                zIndex={5000}
            >
                <div className={styles.sidebarHeader} style={{ padding: '24px 24px 0' }}>
                    <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1a1a1a' }}>
                        Khóa học bắt buộc
                    </Title>
                </div>

                <div className={styles.sidebarContent}>
                    <Tabs
                        defaultActiveKey="1"
                        className={styles.premiumTabs}
                        items={[
                            {
                                key: '1',
                                label: (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        Còn hạn
                                        <Badge
                                            count={loginNotifyModal.courses.filter((c: any) => c.status !== 'OVERDUE' && c.status !== 'COMPLETED').length}
                                            style={{ backgroundColor: '#52c41a' }}
                                        />
                                    </span>
                                ),
                                children: (
                                    <div style={{ paddingTop: 16 }}>
                                        {loginNotifyModal.courses.filter((c: any) => c.status !== 'OVERDUE' && c.status !== 'COMPLETED').length > 0 ? (
                                            loginNotifyModal.courses.filter((c: any) => c.status !== 'OVERDUE' && c.status !== 'COMPLETED').map((course: any) => (
                                                <div key={course.id} className={styles.notificationCard} onClick={() => navigate(`/course/${course.id}`)}>
                                                    <div className={styles.cardHeader}>
                                                        <Text className={styles.cardTitle}>{course.title}</Text>
                                                        <Tag color={course.remainingDays !== null && course.remainingDays <= 3 ? 'error' : 'warning'} style={{ borderRadius: 6, margin: 0 }}>
                                                            {course.remainingDays !== null ? `Còn ${course.remainingDays} ngày` : 'Bắt buộc'}
                                                        </Tag>
                                                    </div>
                                                    <div className={styles.cardMeta}>
                                                        <ClockCircleOutlined />
                                                        <span>{course.remainingDays !== null ? `Hạn: ${course.mandatory_deadline_days} ngày từ khi nhận việc` : 'Khóa học định kỳ bắt buộc'}</span>
                                                    </div>
                                                    <div className={styles.progressWrapper} style={{ marginTop: 12 }}>
                                                        <div className={styles.progressBar}>
                                                            <div
                                                                className={styles.progressFill}
                                                                style={{ width: `${course.progressPercent}%`, background: '#C72127' }}
                                                            />
                                                        </div>
                                                        <Text style={{ fontSize: 11, fontWeight: 600 }}>{course.progressPercent}%</Text>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                                                <CheckCircleOutlined style={{ fontSize: 40, display: 'block', marginBottom: 12 }} />
                                                <Text>Không có khóa học nào còn hạn</Text>
                                            </div>
                                        )}
                                    </div>
                                )
                            },
                            {
                                key: '2',
                                label: (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        Quá hạn
                                        <Badge
                                            count={loginNotifyModal.courses.filter((c: any) => c.status === 'OVERDUE').length}
                                            style={{ backgroundColor: '#C72127' }}
                                        />
                                    </span>
                                ),
                                children: (
                                    <div style={{ paddingTop: 16 }}>
                                        {loginNotifyModal.courses.filter((c: any) => c.status === 'OVERDUE').length > 0 ? (
                                            loginNotifyModal.courses.filter((c: any) => c.status === 'OVERDUE').map((course: any) => (
                                                <div key={course.id} className={styles.notificationCard} style={{ borderLeft: '4px solid #C72127' }} onClick={() => navigate(`/course/${course.id}`)}>
                                                    <div className={styles.cardHeader}>
                                                        <Text className={styles.cardTitle} style={{ color: '#C72127' }}>{course.title}</Text>
                                                        <Tag color="error" style={{ borderRadius: 6, margin: 0 }}>Quá hạn</Tag>
                                                    </div>
                                                    <div className={styles.cardMeta}>
                                                        <ClockCircleOutlined />
                                                        <span>Hạn chót đã trôi qua</span>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                                                <CheckCircleOutlined style={{ fontSize: 40, display: 'block', marginBottom: 12 }} />
                                                <Text>Tuyệt vời! Không có khóa học quá hạn</Text>
                                            </div>
                                        )}
                                    </div>
                                )
                            }
                        ]}
                    />
                </div>

                <div className={styles.sidebarFooter}>
                    <Button
                        type="primary"
                        block
                        icon={<ArrowRightOutlined />}
                        className={styles.primaryBtn}
                        onClick={() => setLoginNotifyModal(prev => ({ ...prev, open: false }))}
                    >
                        Bắt đầu học ngay
                    </Button>
                    <Button
                        block
                        className={styles.secondaryBtn}
                        onClick={() => setLoginNotifyModal(prev => ({ ...prev, open: false }))}
                    >
                        Để sau
                    </Button>
                </div>
            </Drawer>
            )}

            {/* ====== BANNER THƯỜNG TRỰC TRÊN TRANG CHỦ (Ẩn nếu hideBanner = true) ====== */}
            {!loading && courses.length > 0 && !hideBanner && (
                <div className={styles.mandatoryBannerContainer}>
                    <div className={styles.bannerHeader}>
                        <div className={styles.bannerTitleRow}>
                            <WarningOutlined style={{ color: '#fa8c16', fontSize: 20 }} />
                            <Title level={5} style={{ margin: 0 }}>Khóa học bắt buộc</Title>
                            <Tag color="orange">{courses.length} khóa tổng cộng</Tag>
                        </div>
                        <Text type="secondary" style={{ fontSize: 13 }}>
                            Vui lòng hoàn thành các khóa học theo đúng quy định của công ty
                        </Text>
                    </div>

                    <Tabs
                        defaultActiveKey="1"
                        className={styles.bannerTabs}
                        items={[
                            {
                                key: '1',
                                label: `Đang học (${courses.filter(c => c.status !== 'COMPLETED' && c.status !== 'OVERDUE').length})`,
                                children: renderCourseList(courses.filter(c => c.status !== 'COMPLETED' && c.status !== 'OVERDUE'))
                            },
                            {
                                key: '2',
                                label: `Hoàn thành (${courses.filter(c => c.status === 'COMPLETED').length})`,
                                children: renderCourseList(courses.filter(c => c.status === 'COMPLETED'))
                            },
                            {
                                key: '3',
                                label: `Hết hạn (${courses.filter(c => c.status === 'OVERDUE').length})`,
                                children: renderCourseList(courses.filter(c => c.status === 'OVERDUE'))
                            }
                        ]}
                    />
                </div>
            )}
            {/* ====== NÚT CHUÔNG NỔI ĐỂ BẬT LẠI THÔNG BÁO (DÙNG PORTAL ĐỂ KHÔNG BỊ CHE) ====== */}
            {!loading && courses.length > 0 && !loginNotifyModal.open && !hideFloating && createPortal(
                <div
                    className={styles.floatingNotifyBtn}
                    onClick={() => setLoginNotifyModal({ open: true, courses: courses })}
                >
                    <div className={styles.pulseRing}></div>
                    <CarryOutOutlined />
                    {courses.filter(c => c.status !== 'OVERDUE' && c.status !== 'COMPLETED').length > 0 && (
                        <div className={styles.badgeCount}>
                            {courses.filter(c => c.status !== 'OVERDUE' && c.status !== 'COMPLETED').length}
                        </div>
                    )}
                </div>,
                document.body
            )}
        </>
    );
}
