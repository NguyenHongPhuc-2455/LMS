import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Typography, Badge, Space, message, Skeleton, Empty, Pagination, Tag } from 'antd';
import { BookOutlined, TeamOutlined, RocketOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Title, Text } = Typography;

interface Program {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    status: string;
    is_private: boolean;
    instructor: { full_name: string };
    courses: { course: { id: number; title: string } }[];
    _count: { enrollments: number; courses: number };
}

const PAGE_SIZE = 8;

export default function ProgramList() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const searchQuery = searchParams.get('search') || '';

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery]);

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/programs${searchQuery ? `?search=${searchQuery}` : ''}`);
                setPrograms(res.data);
            } catch {
                message.error('Lỗi khi tải danh sách chương trình học');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [searchQuery]);

    if (loading) return <div style={{ padding: '60px 40px' }}><Skeleton active paragraph={{ rows: 10 }} /></div>;

    const displayed = programs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

    return (
        <div style={{ padding: '10px 3%', minHeight: '100vh' }}>
            <div style={{ marginBottom: 28 }}>
                <Title level={2} style={{ margin: 0, fontSize: 24, color: '#1e293b' }}>Chương trình học</Title>
                <Text type="secondary">Lộ trình học tập được thiết kế bài bản từ nhiều khóa học</Text>
            </div>

            {programs.length === 0 ? (
                <Empty description="Chưa có chương trình học nào được phát hành" />
            ) : (
                <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
                        {displayed.map(p => <ProgramCard key={p.id} program={p} navigate={navigate} />)}
                    </div>
                    {programs.length > PAGE_SIZE && (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Pagination current={currentPage} pageSize={PAGE_SIZE} total={programs.length}
                                onChange={setCurrentPage} showSizeChanger={false} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function ProgramCard({ program: p, navigate }: { program: Program; navigate: any }) {
    return (
        <Card
            hoverable
            className="glass-card program-hover-card"
            style={{ overflow: 'hidden', border: 'none', borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
            styles={{ body: { padding: 16 } }}
            cover={
                <div style={{ height: 140, background: 'linear-gradient(135deg, #6366f1 0%, #a78bfa 100%)', position: 'relative' }}>
                    {p.thumbnail ? (
                        <img src={p.thumbnail} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'white', fontSize: 40 }}>
                            <BookOutlined />
                        </div>
                    )}
                    <div style={{ position: 'absolute', top: 8, right: 8 }}>
                        <Tag color={p.is_private ? 'purple' : 'green'} style={{ fontSize: 10 }}>
                            {p.is_private ? 'RIÊNG TƯ' : 'CÔNG KHAI'}
                        </Tag>
                    </div>
                </div>
            }
            onClick={() => navigate(`/programs/${p.id}`)}
        >
            <div style={{ marginBottom: 12 }}>
                <Badge status="processing" text={<Text style={{ color: '#6366f1', fontWeight: 600, fontSize: 11 }}>{p.level?.toUpperCase() || 'LỘ TRÌNH'}</Text>} />
                <Title level={5} style={{ marginTop: 4, marginBottom: 4, color: '#1e293b', fontSize: 15 }} ellipsis={{ rows: 2 }}>{p.title}</Title>
            </div>
            <Space direction="vertical" size={0} style={{ marginBottom: 8 }}>
                <Text style={{ color: '#94a3b8', fontSize: 11 }}>Người tạo</Text>
                <Text strong style={{ color: '#64748b', fontSize: 13 }}>{p.instructor?.full_name || 'Hệ thống'}</Text>
            </Space>
            <hr style={{ margin: '10px 0', border: '0.1px solid #f1f5f9' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 11 }}>
                <Space size={4}><RocketOutlined /> {p._count?.courses || 0} khóa học</Space>
                <Space size={4}><TeamOutlined /> {p._count?.enrollments || 0} học viên</Space>
            </div>

            <style>{`
                .program-hover-card { transition: all 0.3s cubic-bezier(0.25,0.8,0.25,1) !important; }
                .program-hover-card:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 20px 40px rgba(0,0,0,0.12) !important; }
            `}</style>
        </Card>
    );
}

