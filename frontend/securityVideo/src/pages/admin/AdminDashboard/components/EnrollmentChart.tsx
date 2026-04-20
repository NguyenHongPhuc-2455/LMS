import { Card, Typography } from 'antd';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import styles from '../AdminDashboard.module.scss';

const { Title } = Typography;

interface EnrollmentChartProps {
    data: any[];
    loading: boolean;
}

export default function EnrollmentChart({ data, loading }: EnrollmentChartProps) {
    return (
        <Card
            bordered={false}
            className={styles.statCard}
            bodyStyle={{ padding: '24px' }}
            loading={loading}
        >
            <div className={styles.chartCardHeader}>
                <Title level={4} className={styles.chartCardTitle}>Xu hướng ghi danh (7 ngày qua)</Title>
            </div>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
    );
}
