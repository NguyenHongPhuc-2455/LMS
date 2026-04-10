import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import {
    Trash2, LogOut, UploadCloud, GraduationCap,
    Plus, ShieldCheck, BookOpen, Users,
    FolderOpen, PlayCircle
} from 'lucide-react';
import {
    Card, Row, Col,
    Button, Input, Select, Space, Typography,
    Table, Badge, Modal, Form, message, Divider, Popconfirm
} from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

interface Lesson {
    id: number;
    title: string;
    video_url: string;
}

interface Section {
    id: number;
    title: string;
    lessons: Lesson[];
    _count?: { lessons: number };
}

interface Course {
    id: number;
    title: string;
    sections: Section[];
}

export default function Dashboard() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [courseForm] = Form.useForm();
    const [sectionForm] = Form.useForm();
    const [lessonForm] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/courses');
            const detailedCourses = await Promise.all(
                res.data.map((c: any) => api.get(`/courses/${c.id}`).then(r => r.data))
            );
            setCourses(detailedCourses);
            if (detailedCourses.length > 0 && selectedCourseId === null) {
                setSelectedCourseId(detailedCourses[0].id);
            }
        } catch (e) {
            console.error('Lỗi fetch:', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const selectedCourse = courses.find(c => c.id === selectedCourseId) || null;

    const handleCreateCourse = async (values: any) => {
        try {
            await api.post('/courses', values);
            message.success('Đã tạo khóa học mới!');
            setIsCourseModalOpen(false);
            courseForm.resetFields();
            fetchData();
        } catch (e) { message.error('Lỗi tạo khóa học'); }
    };

    const handleCreateSection = async (values: any) => {
        try {
            await api.post('/courses/sections', { ...values, course_id: selectedCourseId });
            message.success('Đã tạo chương mới thành công!');
            setIsSectionModalOpen(false);
            sectionForm.resetFields();
            fetchData();
        } catch (e) { message.error('Lỗi tạo chương'); }
    };

    const handleUploadLesson = async (values: any) => {
        if (!selectedFile) return message.error('Vui lòng chọn tệp video');

        const formData = new FormData();
        formData.append('title', values.title);
        formData.append('section_id', values.section_id);
        formData.append('video', selectedFile);

        try {
            message.loading({ content: 'Đang khởi tạo băm bảo mật HLS...', key: 'hls-upload' });
            await api.post('/videos/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            message.success({ content: 'Bài giảng đã được đưa vào hàng chờ xử lý!', key: 'hls-upload' });
            setIsLessonModalOpen(false);
            setSelectedFile(null);
            lessonForm.resetFields();
            setTimeout(fetchData, 1500);
        } catch (e: any) {
            message.error({ content: e.response?.data?.error || 'Lỗi xử lý file', key: 'hls-upload' });
        }
    };

    const handleDeleteLesson = async (id: number) => {
        try {
            await api.delete(`/videos/${id}`);
            message.success('Đã xóa bài giảng');
            fetchData();
        } catch (e) { message.error('Không thể xóa bài giảng'); }
    };

    const handleDeleteSection = async (id: number) => {
        try {
            // Cần endpoint xóa section, giả định là backend có
            await api.delete(`/courses/sections/${id}`);
            message.success('Đã xóa chương');
            fetchData();
        } catch (e) { message.error('Lỗi khi xóa chương'); }
    };

    const handleDeleteCourse = async (id: number) => {
        try {
            await api.delete(`/courses/${id}`);
            message.success('Đã xóa khóa học');
            setSelectedCourseId(null);
            fetchData();
        } catch (e) { message.error('Lỗi khi xóa khóa học'); }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    return (
        <div style={{ padding: '30px', background: 'var(--bg-color)', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <div>
                    <Title level={2} className="premium-title" style={{ margin: 0 }}>Hệ Thống Quản Trị LMS</Title>
                    <Text style={{ color: 'var(--text-muted)' }}>Điều hành nội dung và bảo mật video</Text>
                </div>
                <Space>
                    <Button icon={<GraduationCap size={16} />} onClick={() => navigate('/course')}>Trang Học Viên</Button>
                    <Button icon={<Users size={16} />} onClick={() => navigate('/admin/users')}>Quản Lý User</Button>
                    <Button danger icon={<LogOut size={16} />} onClick={handleLogout}>Thoát</Button>
                </Space>
            </div>

            <Row gutter={24}>
                <Col span={7}>
                    <Card
                        title={<Space><FolderOpen size={18} /> Danh sách Khóa Học</Space>}
                        className="glass-card"
                        loading={loading}
                        extra={<Button type="text" onClick={() => setIsCourseModalOpen(true)} icon={<Plus size={16} />} style={{ color: '#a855f7' }} />}
                    >
                        <div style={{ maxHeight: '65vh', overflowY: 'auto' }}>
                            {courses.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedCourseId(c.id)}
                                    style={{
                                        padding: '12px 16px',
                                        cursor: 'pointer',
                                        borderRadius: '10px',
                                        marginBottom: '8px',
                                        background: selectedCourseId === c.id ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                                        border: selectedCourseId === c.id ? '1px solid #a855f7' : '1px solid transparent',
                                        transition: '0.3s'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text strong style={{ color: selectedCourseId === c.id ? '#a855f7' : 'var(--text-main)' }}>{c.title}</Text>
                                        {selectedCourseId === c.id && (
                                            <Popconfirm title="Xóa toàn bộ khóa học?" onConfirm={() => handleDeleteCourse(c.id)}>
                                                <Button type="text" danger icon={<Trash2 size={12} />} size="small" onClick={e => e.stopPropagation()} />
                                            </Popconfirm>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.sections.length} chương nội dung</div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>

                <Col span={17}>
                    {selectedCourse ? (
                        <Card
                            title={<Title level={4} style={{ color: 'var(--text-main)', margin: 0 }}>{selectedCourse.title}</Title>}
                            className="glass-card"
                            extra={
                                <Space>
                                    <Button icon={<Plus size={14} />} onClick={() => setIsSectionModalOpen(true)}>Thêm Chương</Button>
                                    <Button type="primary" icon={<UploadCloud size={14} />} onClick={() => setIsLessonModalOpen(true)} className="btn-primary" style={{ width: 'auto' }}>Đăng Bài Giảng</Button>
                                </Space>
                            }
                        >
                            <Table
                                dataSource={selectedCourse.sections}
                                rowKey="id"
                                pagination={false}
                                columns={[
                                    { title: 'STT', dataIndex: 'id', width: 60, render: (_, __, i) => i + 1 },
                                    { title: 'Chương Học', dataIndex: 'title', render: (t) => <Text style={{ color: 'var(--text-main)' }}>{t}</Text> },
                                    {
                                        title: 'Số bài giảng',
                                        key: 'stats',
                                        render: (record) => <Badge count={record.lessons?.length || 0} color="#6366f1" />
                                    },
                                    {
                                        title: 'Hành động',
                                        render: (record) => (
                                            <Popconfirm title="Xóa chương này?" onConfirm={() => handleDeleteSection(record.id)}>
                                                <Button type="text" danger icon={<Trash2 size={14} />} />
                                            </Popconfirm>
                                        )
                                    }
                                ]}
                                expandable={{
                                    expandedRowRender: (record) => (
                                        <Table
                                            dataSource={record.lessons}
                                            rowKey="id"
                                            pagination={false}
                                            size="small"
                                            columns={[
                                                { title: 'Tên bài giảng', dataIndex: 'title', render: (t) => <Space><PlayCircle size={12} color="#a855f7" /> <Text style={{ fontSize: '12px', color: '#94a3b8' }}>{t}</Text></Space> },
                                                { title: 'ID', dataIndex: 'id', width: 80 },
                                                {
                                                    title: 'Hành động',
                                                    render: (lesson) => (
                                                        <Popconfirm title="Xóa bài giảng này?" onConfirm={() => handleDeleteLesson(lesson.id)}>
                                                            <Button type="text" danger icon={<Trash2 size={12} />} />
                                                        </Popconfirm>
                                                    )
                                                }
                                            ]}
                                            style={{ margin: '8px 0', background: 'rgba(0,0,0,0.1)', borderRadius: '8px' }}
                                        />
                                    ),
                                    rowExpandable: (record) => record.lessons.length > 0,
                                }}
                            />
                        </Card>
                    ) : (
                        <div style={{ padding: '100px', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '20px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                            <BookOpen size={48} style={{ color: 'rgba(255,255,255,0.2)', marginBottom: 16 }} />
                            <Title level={4} style={{ color: 'rgba(255,255,255,0.3)' }}>Chọn khóa học để điều hành nội dung</Title>
                        </div>
                    )}
                </Col>
            </Row>

            {/* Modals keep original logic... */}
            <Modal title="Khởi tạo Khóa học" open={isCourseModalOpen} onCancel={() => setIsCourseModalOpen(false)} footer={null}>
                <Form form={courseForm} layout="vertical" onFinish={handleCreateCourse}>
                    <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block className="btn-primary">Hoàn tất</Button>
                </Form>
            </Modal>

            <Modal title="Thêm Chương Mới" open={isSectionModalOpen} onCancel={() => setIsSectionModalOpen(false)} footer={null}>
                <Form form={sectionForm} layout="vertical" onFinish={handleCreateSection}>
                    <Form.Item name="title" label="Tiêu đề chương" rules={[{ required: true }]}>
                        <Input placeholder="Chương 1..." />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block className="btn-primary">Lưu chương</Button>
                </Form>
            </Modal>

            <Modal title="Đăng tải Bài Giảng Bảo Mật" open={isLessonModalOpen} onCancel={() => setIsLessonModalOpen(false)} footer={null}>
                <Form form={lessonForm} layout="vertical" onFinish={handleUploadLesson}>
                    <Form.Item name="section_id" label="Chọn chương mục" rules={[{ required: true, message: 'Vui lòng chọn chương' }]}>
                        <Select placeholder="Thuộc chương nào?">
                            {selectedCourse?.sections.map(s => <Option key={s.id} value={s.id}>{s.title}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="title" label="Tiêu đề bài giảng" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
                        <Input />
                    </Form.Item>
                    <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', marginBottom: 8, color: 'var(--text-muted)' }}>Tệp Video (MP4)</label>
                        <input
                            type="file"
                            accept="video/mp4"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            style={{
                                width: '100%',
                                padding: '10px',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                color: 'var(--text-main)'
                            }}
                        />
                        {selectedFile && <Text style={{ fontSize: '12px', color: '#10b981' }}>✓ {selectedFile.name}</Text>}
                    </div>
                    <Divider />
                    <Button type="primary" htmlType="submit" icon={<ShieldCheck size={18} />} block className="btn-primary">
                        Bắt đầu xử lý Video HLS
                    </Button>
                </Form>
            </Modal>

            <style>{`
                .ant-modal-content { background: #ffffff !important; border-radius: 12px; }
                .ant-modal-title { color: #1e293b !important; }
                .ant-form-item-label > label { color: #475569 !important; }
                .ant-input, .ant-select-selector { background: #ffffff !important; border-color: #e2e8f0 !important; color: #1e293b !important; }
                .ant-table { background: #ffffff !important; color: #1e293b !important; }
                .ant-table-thead > tr > th { background: #f8fafc !important; color: #64748b !important; border-bottom: 1px solid #e2e8f0 !important; }
                .ant-table-tbody > tr > td { border-bottom: 1px solid #f1f5f9 !important; }
                .ant-table-cell-row-hover { background: #f0f7ff !important; }
                .ant-table-expanded-row { background: #fcfcfc !important; }
            `}</style>
        </div>
    );
}
