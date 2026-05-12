import React, { useEffect, useState } from 'react';
import { Table, Typography, Tag, Button, Collapse, Space, Tooltip, Skeleton, Empty, Card } from 'antd';
import { WarningOutlined, CheckCircleOutlined, ReloadOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { courseService } from '../../../services/course.service';

import styles from './OnboardingReport.module.scss';

const { Title, Text } = Typography;

interface OverdueCourse {
    courseId: number;
    courseTitle: string;
    daysOverdue: number;
}

interface OverdueUser {
    userId: number;
    fullName: string;
    email: string;
    phone?: string;
    employeeId?: string;
    department?: string;
    joinDate: string;
    overdueCourses: OverdueCourse[];
}

export default function OnboardingReport() {
    const [data, setData] = useState<OverdueUser[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const result = await courseService.getMandatoryOverdueReport();
            setData(result);
        } catch (e) {
            console.error('Lỗi tải báo cáo:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, []);

    const columns = [
        {
            title: 'Nhân viên',
            dataIndex: 'fullName',
            key: 'fullName',
            render: (name: string, record: OverdueUser) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{name}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <UserOutlined style={{ marginRight: 4 }} />{record.employeeId || 'Chưa có mã NV'}
                    </Text>
                </Space>
            )
        },
        {
            title: 'Phòng ban',
            dataIndex: 'department',
            key: 'department',
            render: (dept: string) => <Tag color="blue">{dept || 'Chưa phân phòng'}</Tag>
        },
        {
            title: 'Ngày nhận việc',
            dataIndex: 'joinDate',
            key: 'joinDate',
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Liên hệ',
            key: 'contact',
            render: (_: any, record: OverdueUser) => (
                <Space direction="vertical" size={0}>
                    <Text copyable style={{ fontSize: 12 }}>{record.email}</Text>
                    {record.phone && (
                        <Text style={{ fontSize: 12 }}>
                            <PhoneOutlined style={{ marginRight: 4 }} />{record.phone}
                        </Text>
                    )}
                </Space>
            )
        },
        {
            title: 'Khóa học trễ hạn',
            dataIndex: 'overdueCourses',
            key: 'overdueCourses',
            render: (courses: OverdueCourse[]) => (
                <Space wrap>
                    {courses.map(c => (
                        <Tooltip key={c.courseId} title={`Trễ ${c.daysOverdue} ngày`}>
                            <Tag color="error" icon={<WarningOutlined />}>
                                {c.courseTitle} (+{c.daysOverdue}d)
                            </Tag>
                        </Tooltip>
                    ))}
                </Space>
            )
        }
    ];

    return (
        <div className={styles.onboardingReportContainer}>
            <div className={styles.onboardingReportHeader}>
                <div className={styles.headerInfo}>
                    <Title level={4} className={styles.headerTitle}>Báo cáo Hội nhập Trễ hạn</Title>
                    <Text type="secondary">Danh sách nhân viên chưa hoàn thành khóa học bắt buộc đúng hạn</Text>
                </div>
            </div>

            <Card className="glass-card">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                    <Button 
                        icon={<ReloadOutlined />} 
                        onClick={fetchReport} 
                        loading={loading}
                        className={styles.reloadBtn}
                    >
                        Làm mới
                    </Button>
                </div>

                {loading ? (
                    <Skeleton active paragraph={{ rows: 8 }} />
                ) : data.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <Empty 
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            description={
                                <span>
                                    <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                    <Text type="secondary">Tất cả nhân viên đều đúng hạn!</Text>
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
                            pagination={{ pageSize: 20 }}
                            rowClassName={() => 'overdue-row'}
                        />
                    </div>
                )}
            </Card>
        </div>
    );
}
