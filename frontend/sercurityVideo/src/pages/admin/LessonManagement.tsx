import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import {
    Trash2,
    Plus, ShieldCheck, PlayCircle, Edit
} from 'lucide-react';
import {
    Card, Button, Input, Select, Space, Typography,
    Table, Modal, Form, message, Divider, Popconfirm, Badge
} from 'antd';

const { Title, Text } = Typography;
const { Option } = Select;

interface Lesson {
    id: number;
    title: string;
    video_url: string;
    attachment_url?: string;
    attachment_name?: string;
    content?: string;
}

interface Section {
    id: number;
    title: string;
}

interface Course {
    id: number;
    title: string;
}

export default function LessonManagement() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);

    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const isFirstLoad = useRef(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

    const [form] = Form.useForm();

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (e) { message.error('Lỗi tải khóa học'); }
    };

    const fetchSections = async (courseId: number) => {
        try {
            const res = await api.get(`/courses/${courseId}`);
            setSections(res.data.sections || []);
        } catch (e) { message.error('Lỗi tải chương'); }
    };

    const fetchLessons = async (sectionId: number) => {
        setLoading(true);
        try {
            // Get detailed section or filter lessons
            const res = await api.get(`/courses/sections/${sectionId}`);
            setLessons(res.data.lessons || []);
        } catch (e) {
            // message.error('Lỗi tải bài giảng'); 
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();

        const cId = searchParams.get('courseId');
        if (cId) {
            setSelectedCourseId(Number(cId));
        }
    }, [searchParams]);

    useEffect(() => {
        if (selectedCourseId) {
            fetchSections(selectedCourseId);

            // Nếu là lần đầu load từ URL có sectionId, hãy giữ lại nó
            if (isFirstLoad.current) {
                const sId = searchParams.get('sectionId');
                if (sId) {
                    setSelectedSectionId(Number(sId));
                }
                isFirstLoad.current = false;
            } else {
                // Các lần thay đổi sau đó mới reset
                setSelectedSectionId(null);
                setLessons([]);
            }
        }
    }, [selectedCourseId]);

    useEffect(() => {
        if (selectedSectionId) {
            fetchLessons(selectedSectionId);
        } else {
            setLessons([]);
        }
    }, [selectedSectionId]);

    const handleSave = async (values: any) => {
        try {
            let lessonId = editingId;
            if (editingId) {
                await api.put(`/videos/${editingId}`, {
                    title: values.title,
                    section_id: values.section_id,
                    content: values.content
                });
                message.success('Đã cập nhật bài giảng!');
            } else {
                if (!selectedFile) return message.error('Vui lòng chọn tệp video');
                const formData = new FormData();
                formData.append('title', values.title);
                formData.append('section_id', values.section_id);
                formData.append('video', selectedFile);

                message.loading({ content: 'Đang xử lý video HLS...', key: 'hls-up' });
                const res = await api.post('/videos/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                lessonId = res.data.data.lessonId;
                message.success({ content: 'Video đang được băm bảo mật...', key: 'hls-up' });
            }

            if (attachmentFile && lessonId) {
                const attachData = new FormData();
                attachData.append('attachment', attachmentFile);
                await api.post(`/videos/upload-attachment/${lessonId}`, attachData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                message.success('Đã đính kèm tài liệu!');
            }

            setIsModalOpen(false);
            setEditingId(null);
            setSelectedFile(null);
            setAttachmentFile(null);
            form.resetFields();
            if (selectedSectionId) fetchLessons(selectedSectionId);
        } catch (e: any) {
            message.error({ content: e.response?.data?.error || 'Lỗi xử lý', key: 'hls-up' });
        }
    };

    const startEditing = (lesson: any) => {
        setEditingId(lesson.id);
        form.setFieldsValue({
            title: lesson.title,
            section_id: selectedSectionId,
            content: lesson.content
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/videos/${id}`);
            message.success('Đã xóa bài giảng');
            if (selectedSectionId) fetchLessons(selectedSectionId);
        } catch (e) { message.error('Lỗi khi xóa'); }
    };

    return (
        <div style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Quản lý Bài Giảng</Title>
                    <Text type="secondary">Cập nhật nội dung video và tài liệu học tập</Text>
                </div>
                <Button
                    type="primary"
                    disabled={!selectedSectionId}
                    onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}
                    icon={<Plus size={16} />}
                >
                    Đăng bài giảng mới
                </Button>
            </div>

            <Card className="glass-card" style={{ marginBottom: 20 }}>
                <Space size={24}>
                    <Space>
                        <Text strong>Khóa học:</Text>
                        <Select
                            placeholder="Chọn khóa học..."
                            style={{ width: 250 }}
                            onChange={v => setSelectedCourseId(v)}
                            value={selectedCourseId}
                        >
                            {courses.map(c => <Option key={c.id} value={c.id}>{c.title}</Option>)}
                        </Select>
                    </Space>
                    <Space>
                        <Text strong>Chương:</Text>
                        <Select
                            placeholder="Chọn chương..."
                            style={{ width: 250 }}
                            disabled={!selectedCourseId}
                            onChange={v => setSelectedSectionId(v)}
                            value={selectedSectionId}
                        >
                            {sections.map(s => <Option key={s.id} value={s.id}>{s.title}</Option>)}
                        </Select>
                    </Space>
                </Space>
            </Card>

            <Card className="glass-card">
                {!selectedSectionId ? (
                    <div style={{ padding: '40px', textAlign: 'center' }}>
                        <PlayCircle size={40} style={{ color: '#cbd5e1', marginBottom: 16 }} />
                        <Text type="secondary" style={{ display: 'block' }}>Vui lòng chọn Khóa học và Chương để quản lý bài giảng</Text>
                    </div>
                ) : (
                    <Table
                        dataSource={lessons}
                        loading={loading}
                        rowKey="id"
                        columns={[
                            { title: 'ID', dataIndex: 'id', width: 80 },
                            { title: 'Tên bài giảng', dataIndex: 'title', render: (t) => <Space><PlayCircle size={14} color="#6366f1" /> {t}</Space> },
                            { title: 'Tài liệu', key: 'attach', render: (record) => record.attachment_url ? <Badge status="success" text="Có đính kèm" /> : <Text type="secondary">Không có</Text> },
                            {
                                title: 'Hành động',
                                key: 'actions',
                                width: 150,
                                render: (record) => (
                                    <Space>
                                        <Button type="text" icon={<Edit size={16} />} onClick={() => startEditing(record)} />
                                        <Popconfirm title="Xóa bài giảng?" onConfirm={() => handleDelete(record.id)}>
                                            <Button type="text" danger icon={<Trash2 size={16} />} />
                                        </Popconfirm>
                                    </Space>
                                )
                            }
                        ]}
                    />
                )}
            </Card>

            <Modal title={editingId ? "Chỉnh sửa Bài Giảng" : "Đăng Bài Giảng Mới"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={600}>
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="section_id" label="Chương học" rules={[{ required: true }]} initialValue={selectedSectionId}>
                        <Select>
                            {sections.map(s => <Option key={s.id} value={s.id}>{s.title}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="title" label="Tiêu đề bài giảng" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="content" label="Nội dung văn bản">
                        <Input.TextArea rows={4} />
                    </Form.Item>

                    <div style={{ marginBottom: 16 }}>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Tài liệu đính kèm (PDF - Tùy chọn)</Text>
                        <input type="file" accept="application/pdf" onChange={e => setAttachmentFile(e.target.files?.[0] || null)} />
                        {attachmentFile && <Text type="success" style={{ fontSize: '12px' }}><br />✓ {attachmentFile.name}</Text>}
                    </div>

                    {!editingId && (
                        <div style={{ marginBottom: 16 }}>
                            <Text strong style={{ display: 'block', marginBottom: 8 }}>Tệp Video (MP4 - Bắt buộc)</Text>
                            <input type="file" accept="video/mp4" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                            {selectedFile && <Text type="success" style={{ fontSize: '12px' }}><br />✓ {selectedFile.name}</Text>}
                        </div>
                    )}

                    <Divider />
                    <Button type="primary" htmlType="submit" block size="large" icon={<ShieldCheck size={18} />}>
                        {editingId ? "Cập nhật" : "Bắt đầu băm video HLS"}
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
