import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Typography, Button, Space, Tag, Card, List, Avatar,
    Skeleton, message, Divider, Badge
} from 'antd';
import { BookOutlined, TeamOutlined, RocketOutlined, CheckCircleOutlined, LockOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Title, Text, Paragraph } = Typography;

interface Course {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    instructor: { full_name: string };
    _count: { sections: number; enrollments: number };
}

interface Program {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    status: string;
    is_private: boolean;
    instructor: { id: number; full_name: string; username: string };
    courses: { order: number; course: Course }[];
    _count: { enrollments: number; courses: number };
    isEnrolled: boolean;
}

export default function ProgramDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [program, setProgram] = useState<Program | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);

    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetch = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/programs/${id}`);
                setProgram(res.data);
            } catch {
                message.error('Không tìm thấy chương trình học');
                navigate('/programs');
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [id]);

    const handleEnroll = async () => {
        if (!token) { navigate('/login'); return; }
        setEnrolling(true);
        try {
            await api.post(`/programs/${id}/enroll`);
            message.success('Đăng ký chương trình học thành công! Tất cả khóa học đã được mở.');
            setProgram(prev => prev ? { ...prev, isEnrolled: true } : prev);
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Lỗi khi đăng ký');
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) return <div style={{ padding: '40px 5%' }}><Skeleton active paragraph={{ rows: 12 }} /></div>;
    if (!program) return null;

    const sortedCourses = [...program.courses].sort((a, b) => a.order - b.order);

    return (
        <div style={{ minHeight: '100vh' }}>
            {/* Hero Banner */}
            <div style={{
                background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
                padding: '48px 5%',
                color: '#fff'
            }}>
                <div style={{ maxWidth: 900, margin: '0 auto' }}>
                    <Space style={{ marginBottom: 12 }}>
                        <Tag color="purple">{program.level}</Tag>
                        <Tag color={program.is_private ? 'orange' : 'green'}>
                            {program.is_private ? 'RIÊNG TƯ' : 'CÔNG KHAI'}
                        </Tag>
                    </Space>
                    <Title level={1} style={{ color: '#fff', marginBottom: 12, fontSize: 32 }}>{program.title}</Title>
                    {program.description && (
                        <Paragraph style={{ color: '#c7d2fe', fontSize: 16, maxWidth: 680, marginBottom: 24 }}>
                            {program.description}
                        </Paragraph>
                    )}
                    <Space size={24} style={{ marginBottom: 24, color: '#a5b4fc' }}>
                        <Space><RocketOutlined /> {program._count?.courses || 0} khóa học</Space>
                        <Space><TeamOutlined /> {program._count?.enrollments || 0} học viên đã đăng ký</Space>
                        <Space><BookOutlined /> Tạo bởi {program.instructor?.full_name}</Space>
                    </Space>

                    {program.isEnrolled ? (
                        <Button type="primary" size="large" icon={<CheckCircleOutlined />}
                            style={{ background: '#22c55e', borderColor: '#22c55e' }}
                            onClick={() => navigate('/my-courses')}>
                            Đã đăng ký — Vào học ngay
                        </Button>
                    ) : program.is_private ? (
                        <Button size="large" disabled icon={<LockOutlined />}>Chương trình riêng tư</Button>
                    ) : (
                        <Button type="primary" size="large" loading={enrolling} onClick={handleEnroll}
                            style={{ background: '#6366f1', borderColor: '#6366f1', fontWeight: 600 }}>
                            Đăng ký miễn phí — Nhận tất cả khóa học
                        </Button>
                    )}
                </div>
            </div>

            {/* Danh sách khóa học */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 5%' }}>
                <Title level={3} style={{ marginBottom: 20 }}>
                    Lộ trình học ({sortedCourses.length} khóa học)
                </Title>

                <List
                    dataSource={sortedCourses}
                    renderItem={(pc, index) => {
                        const c = pc.course;
                        return (
                            <Card
                                hoverable={program.isEnrolled}
                                style={{ marginBottom: 12, borderRadius: 12, cursor: program.isEnrolled ? 'pointer' : 'default' }}
                                onClick={() => program.isEnrolled && navigate(`/course/${c.id}`)}
                            >
                                <Space size={16} style={{ width: '100%' }}>
                                    <div style={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        background: '#6366f1', color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: 16, flexShrink: 0
                                    }}>
                                        {index + 1}
                                    </div>
                                    <Avatar src={c.thumbnail} shape="square" size={64}
                                        style={{ borderRadius: 8, flexShrink: 0 }}
                                        icon={<BookOutlined />} />
                                    <div style={{ flex: 1 }}>
                                        <Text strong style={{ fontSize: 15, display: 'block' }}>{c.title}</Text>
                                        <Space size={12} style={{ marginTop: 4 }}>
                                            <Tag>{c.level}</Tag>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {c._count?.sections || 0} chương
                                            </Text>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {c.instructor?.full_name}
                                            </Text>
                                        </Space>
                                    </div>
                                    {!program.isEnrolled && <LockOutlined style={{ color: '#94a3b8', fontSize: 18 }} />}
                                    {program.isEnrolled && <CheckCircleOutlined style={{ color: '#22c55e', fontSize: 18 }} />}
                                </Space>
                            </Card>
                        );
                    }}
                />

                {sortedCourses.length === 0 && (
                    <Card style={{ textAlign: 'center', padding: 40 }}>
                        <BookOutlined style={{ fontSize: 40, color: '#94a3b8' }} />
                        <br />
                        <Text type="secondary">Chưa có khóa học nào trong chương trình này</Text>
                    </Card>
                )}

                {!program.isEnrolled && sortedCourses.length > 0 && (
                    <>
                        <Divider />
                        <div style={{ textAlign: 'center' }}>
                            <Button type="primary" size="large" loading={enrolling} onClick={handleEnroll}
                                disabled={program.is_private}
                                style={{ background: '#6366f1', borderColor: '#6366f1', fontWeight: 600, minWidth: 280 }}>
                                {program.is_private ? 'Chương trình riêng tư' : 'Đăng ký để học tất cả'}
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

