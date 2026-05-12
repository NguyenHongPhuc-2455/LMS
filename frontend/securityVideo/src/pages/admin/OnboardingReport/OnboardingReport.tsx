import React, { useEffect, useState } from 'react';
import { Table, Typography, Tag, Button, Collapse, Space, Tooltip, Skeleton, Empty, Card } from 'antd';
import { WarningOutlined, CheckCircleOutlined, ReloadOutlined, UserOutlined, PhoneOutlined } from '@ant-design/icons';
import { courseService } from '../../../services/course.service';

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
            render: (dept: string) => <Tag color="blue">{dept || 'Chưa phân phòng'}</Tag>
        },
        {
            title: 'Ngày nhận việc',
            dataIndex: 'joinDate',
            render: (date: string) => new Date(date).toLocaleDateString('vi-VN')
        },
        {
            title: 'Liên hệ',
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
        <div style={{ padding: '0 4px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Báo cáo Hội nhập Trễ hạn</Title>
                    <Text type="secondary">Danh sách nhân viên chưa hoàn thành khóa học bắt buộc đúng hạn</Text>
                </div>
                <Button icon={<ReloadOutlined />} onClick={fetchReport} loading={loading}>
                    Làm mới
                </Button>
            </div>

            {loading ? (
                <Skeleton active paragraph={{ rows: 8 }} />
            ) : data.length === 0 ? (
                <Card className="glass-card" style={{ textAlign: 'center', padding: '80px 0' }}>
                    <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={
                            <span>
                                <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
                                <Text type="secondary">Tất cả nhân viên đều đúng hạn!</Text>
                            </span>
                        } 
                    />
                </Card>
            ) : (
                <>
                    <div style={{
                        display: 'flex', gap: 16, marginBottom: 16, padding: '16px 20px',
                        background: 'linear-gradient(135deg, #fff2f0, #fff)', borderRadius: 12,
                        border: '1px solid #ffccc7'
                    }}>
                        <WarningOutlined style={{ color: '#ff4d4f', fontSize: 24 }} />
                        <div>
                            <Text strong style={{ color: '#ff4d4f', fontSize: 16 }}>
                                {data.length} nhân viên trễ hạn
                            </Text>
                            <div>
                                <Text type="secondary">
                                    Tổng {data.reduce((acc, u) => acc + u.overdueCourses.length, 0)} lượt vi phạm deadline
                                </Text>
                            </div>
                        </div>
                    </div>

                    <Table
                        dataSource={data}
                        columns={columns}
                        rowKey="userId"
                        pagination={{ pageSize: 20 }}
                        className="glass-card"
                        rowClassName={() => 'overdue-row'}
                    />
                </>
            )}
        </div>
    );
}
