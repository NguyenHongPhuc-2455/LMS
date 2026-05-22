import React, { useEffect, useState } from 'react';
import { Table, Typography, Button, Space, Skeleton, Empty, Card, Tabs, Tag, Progress, Segmented } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, WarningOutlined, ClockCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import { courseService } from '../../../services/course.service';
import LearningActivityReport from './components/LearningActivityReport';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';

import styles from './OnboardingReport.module.scss';

const { Title, Text } = Typography;

import { type ReportCourse, type ReportUser } from '../../../types/report';

interface CourseListCellProps {
    courses: ReportCourse[];
    activeTab: string;
}

const CourseListCell = ({ courses, activeTab }: CourseListCellProps) => {
    const [expanded, setExpanded] = useState(false);
    const limit = 2;

    const renderCourseRow = (c: ReportCourse) => (
        <div key={c.courseId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ minWidth: 150 }}>
                <Text strong style={{ display: 'block', fontSize: 13 }}>{c.courseTitle}</Text>
                <Progress percent={c.progress} size="small" status={c.progress === 100 ? 'success' : 'active'} />
            </div>
            {activeTab === 'overdue' ? (
                <Tag color="error" icon={<WarningOutlined />}>Trễ hạn</Tag>
            ) : (
                c.isCompleted ? (
                    <Tag color="success" icon={<CheckCircleOutlined />}>Hoàn thành</Tag>
                ) : (
                    <Tag color="processing" icon={<ClockCircleOutlined />}>
                        {c.remainingDays !== null && c.remainingDays !== undefined
                            ? `Còn ${c.remainingDays} ngày`
                            : 'Khóa học định kỳ'}
                    </Tag>
                )
            )}
        </div>
    );

    if (courses.length <= limit) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {courses.map(renderCourseRow)}
            </div>
        );
    }

    const visibleCourses = expanded ? courses : courses.slice(0, limit);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {visibleCourses.map(renderCourseRow)}
            <div style={{ marginTop: 4 }}>
                <Button
                    type="link"
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    style={{ padding: 0, height: 'auto', fontSize: 12, color: '#B8121A' }}
                >
                    {expanded ? 'Thu gọn' : `Xem thêm (${courses.length - limit})`}
                </Button>
            </div>
        </div>
    );
};

export default function OnboardingReport() {
    const [data, setData] = useState<ReportUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overdue');
    const [timeframe, setTimeframe] = useState<string>('all');
    const [reportType, setReportType] = useState<'onboarding' | 'activity'>('onboarding');

    const fetchReport = async (tab: string, tf: string = 'all') => {
        setLoading(true);
        try {
            const result = await courseService.getMandatoryOverdueReport(tab, tf);
            setData(result);
        } catch (e) {
            console.error('Lỗi tải báo cáo:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleExportXLSX = () => {
        if (!data || data.length === 0) return;

        const exportData = data.flatMap((user: any) => {
            return user.courses.map((course: any) => {
                if (activeTab === 'overdue') {
                    return {
                        'Mã nhân sự': user.employeeId || '',
                        'Họ và tên': user.fullName,
                        'Phòng ban': user.department || 'Chưa phân phòng',
                        'Ngày nhận việc': user.joinDate ? dayjs(user.joinDate).format('DD/MM/YYYY') : '',
                        'Khóa học': course.courseTitle,
                        'Tiến độ': `${course.progress}%`,
                        'Trạng thái': 'Trễ hạn',
                        'Số ngày trễ': course.daysOverdue
                    };
                } else {
                    return {
                        'Mã nhân sự': user.employeeId || '',
                        'Họ và tên': user.fullName,
                        'Phòng ban': user.department || 'Chưa phân phòng',
                        'Ngày nhận việc': user.joinDate ? dayjs(user.joinDate).format('DD/MM/YYYY') : '',
                        'Khóa học': course.courseTitle,
                        'Tiến độ': `${course.progress}%`,
                        'Trạng thái': course.isCompleted ? 'Hoàn thành' : 'Đang tiến hành',
                        'Thời hạn còn lại': course.remainingDays !== null && course.remainingDays !== undefined
                            ? `${course.remainingDays} ngày`
                            : 'Định kỳ'
                    };
                }
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, activeTab === 'overdue' ? 'Trễ hạn' : 'Đúng hạn');

        XLSX.writeFile(workbook, `bao_cao_onboarding_${activeTab}_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    useEffect(() => {
        if (reportType === 'onboarding') {
            fetchReport(activeTab, timeframe);
        }
    }, [activeTab, timeframe, reportType]);

    const columns = [
        {
            title: 'Nhân viên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (name: string, record: ReportUser) => (
                <Space direction="vertical" size={0} style={{ whiteSpace: 'nowrap' }}>
                    <Text strong>{name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {record.employeeId || 'Chưa có mã NV'}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Phòng ban',
            dataIndex: 'department',
            key: 'department',
            render: (dept: string) => <span style={{ color: '#000', fontWeight: 500, whiteSpace: 'nowrap' }}>{dept || 'Chưa phân phòng'}</span>
        },
        {
            title: 'Ngày nhận việc',
            dataIndex: 'joinDate',
            key: 'joinDate',
            render: (date: string) => <span style={{ whiteSpace: 'nowrap' }}>{new Date(date).toLocaleDateString('vi-VN')}</span>
        },
        {
            title: activeTab === 'overdue' ? 'Khóa học trễ hạn' : 'Khóa học bắt buộc',
            dataIndex: 'courses',
            key: 'courses',
            render: (courses: ReportCourse[]) => (
                <CourseListCell courses={courses} activeTab={activeTab} />
            )
        }
    ];

    return (
        <div className={styles.onboardingReportContainer}>
            <div className={styles.onboardingReportHeader}>
                {/* <div className={styles.headerInfo}>
                    <Title level={3} className={styles.headerTitle} style={{ margin: '0 0 4px 0' }}>
                        {reportType === 'onboarding' ? 'Báo cáo Onboarding' : 'Báo cáo Hoạt động Học tập'}
                    </Title>
                    <Text type="secondary">
                        {reportType === 'onboarding'
                            ? 'Theo dõi tiến độ hoàn thành khóa học bắt buộc của nhân sự'
                            : 'Thống kê chi tiết thời lượng học, bài học hoàn thành'}
                    </Text>
                </div> */}
                <div>
                    <Segmented
                        value={reportType}
                        onChange={(val: any) => setReportType(val)}
                        options={[
                            { label: 'Tiến độ Onboarding', value: 'onboarding' },
                            { label: 'Hoạt động học tập', value: 'activity' }
                        ]}
                        size="large"
                        style={{ border: '1px solid #e2e8f0', padding: 3, background: '#f8fafc', borderRadius: 8 }}
                    />
                </div>
            </div>

            {reportType === 'onboarding' ? (
                <Card className="glass-card" bordered={false} style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.02)', borderRadius: 12 }}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        tabBarExtraContent={
                            <Space size={16}>
                                <Space align="center" size={8}>
                                    <span style={{ fontWeight: 500, fontSize: 13 }}>Thời hạn:</span>
                                    <Segmented
                                        value={timeframe}
                                        onChange={(val: any) => setTimeframe(val)}
                                        options={[
                                            { label: 'Tất cả', value: 'all' },
                                            { label: 'Hôm nay', value: 'day' },
                                            { label: 'Tuần này', value: 'week' },
                                            { label: 'Tháng này', value: 'month' }
                                        ]}
                                        size="middle"
                                        style={{ border: '1px solid #e2e8f0', padding: 2, background: '#f8fafc', borderRadius: 6 }}
                                    />
                                </Space>
                                <Button
                                    icon={<ReloadOutlined />}
                                    onClick={() => fetchReport(activeTab, timeframe)}
                                    loading={loading}
                                    type="text"
                                >
                                    Làm mới
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<DownloadOutlined />}
                                    onClick={handleExportXLSX}
                                    disabled={data.length === 0}
                                    style={{ background: '#B8121A', borderColor: '#B8121A', borderRadius: 8 }}
                                >
                                    Xuất Excel
                                </Button>
                            </Space>
                        }
                        items={[
                            {
                                key: 'overdue',
                                label: (
                                    <span style={{ color: activeTab === 'overdue' ? '#ff4d4f' : 'inherit' }}>
                                        Nhân sự trễ hạn
                                    </span>
                                ),
                            },
                            {
                                key: 'ontime',
                                label: (
                                    <span style={{ color: activeTab === 'ontime' ? '#52c41a' : 'inherit' }}>
                                        Nhân sự đúng hạn
                                    </span>
                                ),
                            }
                        ]}
                    />

                    {loading ? (
                        <Skeleton active paragraph={{ rows: 8 }} />
                    ) : data.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '60px 0' }}>
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <span>
                                        {activeTab === 'overdue' ? (
                                            <>
                                                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                                <Text type="secondary">Tuyệt vời! Không có nhân sự nào trễ hạn.</Text>
                                            </>
                                        ) : (
                                            <Text type="secondary">Chưa có dữ liệu báo cáo đúng hạn.</Text>
                                        )}
                                    </span>
                                }
                            />
                        </div>
                    ) : (
                        <div className={styles.tableWrapper}>
                            <Table
                                dataSource={data}
                                columns={columns}
                                rowKey="userId"
                                pagination={{ pageSize: 10 }}
                                rowClassName={() => activeTab === 'overdue' ? styles.overdueRow : styles.ontimeRow}
                            />
                        </div>
                    )}
                </Card>
            ) : (
                <LearningActivityReport />
            )}
        </div>
    );
}
