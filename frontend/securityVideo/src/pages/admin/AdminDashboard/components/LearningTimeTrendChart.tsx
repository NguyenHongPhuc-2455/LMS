import { Card, Typography } from 'antd';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import styles from '../AdminDashboard.module.scss';

const { Title } = Typography;

interface LearningTimeTrendChartProps {
    data: any[];
    loading: boolean;
}

export default function LearningTimeTrendChart({ data, loading }: LearningTimeTrendChartProps) {
    return (
        <Card
            bordered={false}
            className={styles.statCard}
            bodyStyle={{ padding: '24px' }}
            loading={loading}
        >
            <div className={styles.chartCardHeader}>
                <Title level={4} className={styles.chartCardTitle}>Xu hướng học tập (7 ngày qua)</Title>
            </div>

            <div className={styles.chartContainer}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                            tickFormatter={(val) => `${val}h`}
                        />
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                            cursor={{ fill: '#f1f5f9' }}
                            formatter={(value: any) => [`${value} giờ`, 'Thời gian học']}
                        />
                        <Bar
                            dataKey="hours"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                        >
                            {data.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={index === data.length - 1 ? '#C72127' : '#4880FF'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}
