import React from 'react';
import api from '../../api';
import { Row, Col, Card, Typography, Space, Empty, Badge } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    TeamOutlined,
    BoxPlotOutlined,
    LineChartOutlined,
    HistoryOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const data_placeholder = [
    { name: '5k', sales: 20 },
    { name: '10k', sales: 40 },
    { name: '15k', sales: 30 },
    { name: '20k', sales: 80 },
    { name: '25k', sales: 45 },
    { name: '30k', sales: 50 },
    { name: '35k', sales: 25 },
    { name: '40k', sales: 70 },
    { name: '45k', sales: 60 },
    { name: '50k', sales: 50 },
    { name: '55k', sales: 40 },
    { name: '60k', sales: 55 }
];

export default function AdminDashboard() {
    const [stats, setStats] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/stats/dashboard');
                setStats(res.data);
            } catch (error) {
                console.error('Lỗi khi tải thống kê:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const statCards = [
        {
            title: 'Tổng Học Viên',
            value: stats?.overview?.totalStudents?.toLocaleString() || '0',
            percent: '8.5%',
            isUp: true,
            icon: <TeamOutlined style={{ fontSize: '24px', color: '#8884d8' }} />,
            bg: '#eef2ff',
            detail: 'So với hôm qua'
        },
        {
            title: 'Khóa Học',
            value: stats?.overview?.totalCourses?.toLocaleString() || '0',
            percent: '1.3%',
            isUp: true,
            icon: <BoxPlotOutlined style={{ fontSize: '24px', color: '#f59e0b' }} />,
            bg: '#fffbeb',
            detail: 'Tổng số hiện có'
        },
        {
            title: 'Lượt tham gia',
            value: stats?.overview?.totalEnrollments?.toLocaleString() || '0',
            percent: '4.3%',
            isUp: true,
            icon: <LineChartOutlined style={{ fontSize: '24px', color: '#10b981' }} />,
            bg: '#ecfdf5',
            detail: 'Tổng lượt ghi danh'
        },
        {
            title: 'Đang chờ xử lý',
            value: stats?.overview?.pendingRequests?.toLocaleString() || '0',
            percent: '1.8%',
            isUp: true,
            icon: <HistoryOutlined style={{ fontSize: '24px', color: '#ef4444' }} />,
            bg: '#fef2f2',
            detail: 'Yêu cầu phê duyệt'
        }
    ];

    const chartData = stats?.enrollmentTrends || data_placeholder;

    return (
        <div>
            <Title level={2} style={{ marginTop: 0, marginBottom: '24px', fontWeight: 700, color: '#1E293B', letterSpacing: '-0.02em' }}>
                Dashboard
            </Title>

            <Row gutter={[24, 24]} style={{ marginBottom: '30px' }}>
                {statCards.map((stat, idx) => (
                    <Col xs={24} sm={12} lg={6} key={idx}>
                        <Card
                            bordered={false}
                            style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
                            bodyStyle={{ padding: '24px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                <div>
                                    <Text style={{ color: '#64748B', fontSize: '15px', fontWeight: 500 }}>{stat.title}</Text>
                                    <div style={{ fontSize: '28px', fontWeight: 700, color: '#1E293B', marginTop: '8px' }}>
                                        {stat.value}
                                    </div>
                                </div>
                                <div style={{
                                    width: '56px',
                                    height: '56px',
                                    borderRadius: '16px',
                                    background: stat.bg,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {stat.icon}
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px' }}>
                                <span style={{ color: stat.isUp ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                                    {stat.isUp ? <ArrowUpOutlined style={{ marginRight: '4px' }} /> : <ArrowDownOutlined style={{ marginRight: '4px' }} />}
                                    {stat.percent}
                                </span>
                                <span style={{ color: '#94A3B8' }}>{stat.detail}</span>
                            </div>
                        </Card>
                    </Col>
                ))}
            </Row>

            <Row gutter={[24, 24]}>
                <Col xl={16} lg={24}>
                    <Card
                        bordered={false}
                        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
                        bodyStyle={{ padding: '24px' }}
                        loading={loading}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                            <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>Xu hướng ghi danh (7 ngày qua)</Title>
                        </div>

                        <div style={{ height: '350px', width: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorEnrollments" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4880FF" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="#4880FF" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#94A3B8', fontSize: 12 }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                        itemStyle={{ color: '#4880FF', fontWeight: 600 }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="enrollments"
                                        stroke="#4880FF"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorEnrollments)"
                                        activeDot={{ r: 6, strokeWidth: 0, fill: '#4880FF' }}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </Col>
                <Col xl={8} lg={24}>
                    <Card
                        title={<Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>Khóa học phổ biến</Title>}
                        bordered={false}
                        style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', height: '100%' }}
                        bodyStyle={{ padding: '24px' }}
                        loading={loading}
                    >
                        <Space direction="vertical" style={{ width: '100%' }} size={16}>
                            {stats?.topCourses?.map((course: any, i: number) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', borderRadius: '12px', background: '#F8FAFC' }}>
                                    <div style={{ flex: 1, marginRight: '10px' }}>
                                        <Text strong style={{ display: 'block', fontSize: '14px' }}>{course.title}</Text>
                                        <Text type="secondary" style={{ fontSize: '12px' }}>Vị trí #{i + 1}</Text>
                                    </div>
                                    <Badge count={course.count} color="#4880FF" />
                                </div>
                            ))}
                            {(!stats?.topCourses || stats.topCourses.length === 0) && (
                                <Empty description="Chưa có dữ liệu" />
                            )}
                        </Space>
                    </Card>
                </Col>
            </Row>
        </div>
    );
}
