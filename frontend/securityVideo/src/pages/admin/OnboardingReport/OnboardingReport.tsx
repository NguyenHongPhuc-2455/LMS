import React, { useEffect, useState } from 'react';
import { Table, Typography, Button, Space, Skeleton, Empty, Card, Tabs, Tag, Progress } from 'antd';
import { CheckCircleOutlined, ReloadOutlined, WarningOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { courseService } from '../../../services/course.service';

import styles from './OnboardingReport.module.scss';

const { Title, Text } = Typography;

import { type ReportCourse, type ReportUser } from '../../../types/report';

export default function OnboardingReport() {
    const [data, setData] = useState<ReportUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overdue');

    const fetchReport = async (tab: string) => {
        setLoading(true);
        try {
            const result = await courseService.getMandatoryOverdueReport(tab);
            setData(result);
        } catch (e) {
            console.error('Lỗi tải báo cáo:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport(activeTab);
    }, [activeTab]);

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {courses.map(c => (
                        <div key={c.courseId} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ minWidth: 150 }}>
                                <Text strong style={{ display: 'block', fontSize: 13 }}>{c.courseTitle}</Text>
                                <Progress percent={c.progress} size="small" status={c.progress === 100 ? 'success' : 'active'} />
                            </div>
                            {activeTab === 'overdue' ? (
                                <Tag color="error" icon={<WarningOutlined />}>Trễ {c.daysOverdue} ngày</Tag>
                            ) : (
                                c.isCompleted ? (
                                    <Tag color="success" icon={<CheckCircleOutlined />}>Hoàn thành</Tag>
                                ) : (
                                    <Tag color="processing" icon={<ClockCircleOutlined />}>Còn {c.remainingDays} ngày</Tag>
                                )
                            )}
                        </div>
                    ))}
                </div>
            )
        }
    ];

    return (
        <div className={styles.onboardingReportContainer}>
            <div className={styles.onboardingReportHeader}>
                <div className={styles.headerInfo}>
                    <Title level={4} className={styles.headerTitle}>Báo cáo Onboarding</Title>
                    <Text type="secondary">Theo dõi tiến độ hoàn thành khóa học bắt buộc của nhân sự</Text>
                </div>
            </div>

            <Card className="glass-card">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    tabBarExtraContent={
                        <Button 
                            icon={<ReloadOutlined />} 
                            onClick={() => fetchReport(activeTab)} 
                            loading={loading}
                            type="text"
                        >
                            Làm mới
                        </Button>
                    }
                    items={[
                        {
                            key: 'overdue',
                            label: (
                                <span style={{ color: activeTab === 'overdue' ? '#ff4d4f' : 'inherit' }}>
                                    <WarningOutlined /> Nhân sự trễ hạn
                                </span>
                            ),
                        },
                        {
                            key: 'ontime',
                            label: (
                                <span style={{ color: activeTab === 'ontime' ? '#52c41a' : 'inherit' }}>
                                    <CheckCircleOutlined /> Nhân sự đúng hạn
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
        </div>
    );
}
