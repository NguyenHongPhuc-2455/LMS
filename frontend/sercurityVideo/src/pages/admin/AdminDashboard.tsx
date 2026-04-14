import React from 'react';
import { Row, Col, Card, Typography, Space, Select } from 'antd';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import {
    TeamOutlined,
    BoxPlotOutlined,
    LineChartOutlined,
    HistoryOutlined,
    ArrowUpOutlined,
    ArrowDownOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const data = [
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
    const statCards = [
        {
            title: 'Tổng Học Viên',
            value: '40,689',
            percent: '8.5%',
            isUp: true,
            icon: <TeamOutlined style={{ fontSize: '24px', color: '#8884d8' }} />,
            bg: '#eef2ff',
            detail: 'So với hôm qua'
        },
        {
            title: 'Tổng Đơn Hàng',
            value: '10,293',
            percent: '1.3%',
            isUp: true,
            icon: <BoxPlotOutlined style={{ fontSize: '24px', color: '#f59e0b' }} />,
            bg: '#fffbeb',
            detail: 'So với tuần trước'
        },
        {
            title: 'Doanh Thu',
            value: '$89,000',
            percent: '4.3%',
            isUp: false,
            icon: <LineChartOutlined style={{ fontSize: '24px', color: '#10b981' }} />,
            bg: '#ecfdf5',
            detail: 'So với hôm qua'
        },
        {
            title: 'Đang chờ xử lý',
            value: '2,040',
            percent: '1.8%',
            isUp: true,
            icon: <HistoryOutlined style={{ fontSize: '24px', color: '#ef4444' }} />,
            bg: '#fef2f2',
            detail: 'So với hôm qua'
        }
    ];

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

            <Card
                bordered={false}
                style={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}
                bodyStyle={{ padding: '24px' }}
            >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1E293B' }}>Chi Tiết Doanh Thu</Title>
                    <Select defaultValue="October" style={{ width: 120, background: '#F8FAFC' }} bordered={false}>
                        <Select.Option value="September">September</Select.Option>
                        <Select.Option value="October">October</Select.Option>
                        <Select.Option value="November">November</Select.Option>
                    </Select>
                </div>

                <div style={{ height: '350px', width: '100%' }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
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
                                tickFormatter={(value) => `${value}%`}
                            />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                itemStyle={{ color: '#4880FF', fontWeight: 600 }}
                            />
                            <Area
                                type="monotone"
                                dataKey="sales"
                                stroke="#4880FF"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorSales)"
                                activeDot={{ r: 6, strokeWidth: 0, fill: '#4880FF' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
}
