import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Typography, Space, message, Skeleton, Empty, Tag, Button } from 'antd';
import { BookOutlined, RocketOutlined, ArrowRightOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Title, Text } = Typography;

interface Program {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    instructor: { full_name: string };
    courses: { course: { id: number; title: string } }[];
    _count: { courses: number };
    enrolled_at: string;
}

export default function MyPrograms() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const res = await api.get('/programs/my-programs');
                setPrograms(res.data);
            } catch {
                message.error('Lỗi khi tải chương trình học của bạn');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return <div style={{ padding: '60px 40px' }}><Skeleton active paragraph={{ rows: 10 }} /></div>;

    return (
        <div style={{ padding: '10px 3%', minHeight: '100vh' }}>
            <div style={{ marginBottom: 28 }}>
                <Title level={3} style={{ margin: 0 }}>Chương trình học của tôi</Title>
                <Text type="secondary">Tất cả lộ trình bạn đã đăng ký</Text>
            </div>

            {programs.length === 0 ? (
                <Empty
                    description="Bạn chưa đăng ký chương trình học nào"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <Button type="primary" onClick={() => navigate('/programs')}>
                        Khám phá chương trình học
                    </Button>
                </Empty>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                    {programs.map(p => (
                        <Card
                            key={p.id}
                            hoverable
                            style={{ borderRadius: 12, overflow: 'hidden', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                            styles={{ body: { padding: 16 } }}
                            cover={
                                <div style={{ height: 130, background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)', position: 'relative' }}>
                                    {p.thumbnail ? (
                                        <img src={p.thumbnail} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#fff', fontSize: 36 }}>
                                            <BookOutlined />
                                        </div>
                                    )}
                                </div>
                            }
                            onClick={() => navigate(`/programs/${p.id}`)}
                        >
                            <Space direction="vertical" style={{ width: '100%' }} size={8}>
                                <div>
                                    <Tag color="purple" style={{ fontSize: 10 }}>{p.level}</Tag>
                                    <Title level={5} style={{ marginTop: 6, marginBottom: 0 }} ellipsis={{ rows: 2 }}>
                                        {p.title}
                                    </Title>
                                </div>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    Bởi {p.instructor?.full_name || 'Hệ thống'}
                                </Text>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <Space style={{ color: '#94a3b8', fontSize: 12 }}>
                                        <RocketOutlined /> {p._count?.courses || 0} khóa học
                                    </Space>
                                    <Text type="secondary" style={{ fontSize: 11 }}>
                                        Đăng ký: {new Date(p.enrolled_at).toLocaleDateString('vi-VN')}
                                    </Text>
                                </div>
                                <Button type="primary" ghost size="small" icon={<ArrowRightOutlined />}
                                    onClick={e => { e.stopPropagation(); navigate(`/programs/${p.id}`); }}
                                    style={{ width: '100%' }}>
                                    Xem lộ trình
                                </Button>
                            </Space>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

