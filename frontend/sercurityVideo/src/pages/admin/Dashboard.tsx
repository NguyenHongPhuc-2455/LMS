import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import {
    Trash2, UploadCloud, GraduationCap,
    Plus, ShieldCheck, BookOpen, Users,
    FolderOpen, PlayCircle, Edit
} from 'lucide-react';
import {
    Card, Row, Col,
    Button, Input, Select, Space, Typography,
    Table, Badge, Modal, Form, message, Divider, Popconfirm, Upload, Empty
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';

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
    price: string | number;
}

export default function Dashboard() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [thumbFile, setThumbFile] = useState<any>(null);
    const [thumbUrl, setThumbUrl] = useState<string>('');

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
            let finalThumbnail = values.thumbnail;

            // Nếu có file ảnh mới được chọn, upload nó trước
            if (thumbFile) {
                const formData = new FormData();
                formData.append('image', thumbFile);
                const uploadRes = await api.post('/upload/image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalThumbnail = uploadRes.data.url;
            }

            const payload = { ...values, thumbnail: finalThumbnail };

            if (editingCourseId) {
                await api.put(`/courses/${editingCourseId}`, payload);
                message.success('Đã cập nhật khóa học!');
            } else {
                await api.post('/courses', payload);
                message.success('Đã tạo khóa học mới!');
            }
            setIsCourseModalOpen(false);
            setEditingCourseId(null);
            setThumbFile(null);
            setThumbUrl('');
            courseForm.resetFields();
            fetchData();
        } catch (e) { message.error('Lỗi lưu khóa học'); }
    };

    const startEditingCourse = (course: any) => {
        setEditingCourseId(course.id);
        courseForm.setFieldsValue({
            title: course.title,
            description: course.description,
            price: course.price,
            thumbnail: course.thumbnail,
            intro_video_url: course.intro_video_url,
            learning_outcomes: course.learning_outcomes,
            requirements: course.requirements,
            level: course.level || 'OFFICIAL'
        });
        setThumbUrl(course.thumbnail || '');
        setThumbFile(null);
        setIsCourseModalOpen(true);
    };

    const handleSaveSection = async (values: any) => {
        try {
            if (editingSectionId) {
                await api.put(`/courses/sections/${editingSectionId}`, values);
                message.success('Đã cập nhật chương!');
            } else {
                await api.post('/courses/sections', { ...values, course_id: selectedCourseId });
                message.success('Đã tạo chương mới thành công!');
            }
            setIsSectionModalOpen(false);
            setEditingSectionId(null);
            sectionForm.resetFields();
            fetchData();
        } catch (e) { message.error('Lỗi lưu chương'); }
    };

    const startEditingSection = (section: any) => {
        setEditingSectionId(section.id);
        sectionForm.setFieldsValue({
            title: section.title,
            order: section.order
        });
        setIsSectionModalOpen(true);
    };

    const handleSaveLesson = async (values: any) => {
        try {
            if (editingLessonId) {
                // Nếu đang edit, chỉ cập nhật title và section_id
                await api.put(`/videos/${editingLessonId}`, {
                    title: values.title,
                    section_id: values.section_id
                });
                message.success('Đã cập nhật bài giảng!');
            } else {
                // Nếu tạo mới, bắt buộc phải có video
                if (!selectedFile) return message.error('Vui lòng chọn tệp video');

                const formData = new FormData();
                formData.append('title', values.title);
                formData.append('section_id', values.section_id);
                formData.append('video', selectedFile);

                message.loading({ content: 'Đang khởi tạo băm bảo mật HLS...', key: 'hls-upload' });
                await api.post('/videos/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                message.success({ content: 'Bài giảng đã được đưa vào hàng chờ xử lý!', key: 'hls-upload' });
            }
            setIsLessonModalOpen(false);
            setEditingLessonId(null);
            setSelectedFile(null);
            lessonForm.resetFields();
            setTimeout(fetchData, 1500);
        } catch (e: any) {
            message.error({ content: e.response?.data?.error || 'Lỗi xử lý file', key: 'hls-upload' });
        }
    };

    const startEditingLesson = (lesson: any, sectionId: number) => {
        setEditingLessonId(lesson.id);
        lessonForm.setFieldsValue({
            title: lesson.title,
            section_id: sectionId
        });
        setIsLessonModalOpen(true);
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

    const [searchText, setSearchText] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');

    const filteredCourses = courses.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchText.toLowerCase());
        const matchesLevel = filterLevel === 'All' || (c as any).level === filterLevel;
        return matchesSearch && matchesLevel;
    });

    return (
        <div style={{ padding: '30px', background: 'var(--bg-color)', minHeight: '100vh' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 }}>
                <div>
                    <Title level={2} className="premium-title" style={{ margin: 0 }}>Quản lý khóa học</Title>
                    <Text style={{ color: 'var(--text-muted)' }}>Điều hành nội dung và bảo mật video</Text>
                </div>
            </div>

            <Row gutter={24}>
                <Col span={7}>
                    <Card
                        title={<Space><FolderOpen size={16} /> Danh sách Khóa Học</Space>}
                        className="glass-card"
                        loading={loading}
                        styles={{ body: { padding: '10px' } }}
                        extra={<Button type="text" onClick={() => { setEditingCourseId(null); courseForm.resetFields(); setIsCourseModalOpen(true); }} icon={<Plus size={14} />} style={{ color: '#a855f7' }} />}
                    >
                        <Space direction="vertical" style={{ width: '100%', marginBottom: '12px' }} size={4}>
                            <Input
                                placeholder="Tìm khóa học..."
                                prefix={<SearchOutlined style={{ color: '#94a3b8', fontSize: '11px' }} />}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className="admin-search-input"
                            />
                            <Select
                                defaultValue="All"
                                onChange={(v) => setFilterLevel(v)}
                                size="small"
                                variant="borderless"
                                className="admin-filter-select"
                                dropdownStyle={{ borderRadius: '8px' }}
                            >
                                <Option value="All">Tất cả trình độ</Option>
                                <Option value="Cơ bản">Cơ bản</Option>
                                <Option value="Trung cấp">Trung cấp</Option>
                                <Option value="Nâng cao">Nâng cao</Option>
                            </Select>
                        </Space>

                        <div style={{ maxHeight: '55vh', overflowY: 'auto' }}>
                            {filteredCourses.length === 0 ? (
                                <Empty description="Không tìm thấy kết quả" />
                            ) : filteredCourses.map(c => (
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
                                        <Space size={4}>
                                            <Button type="text" icon={<Edit size={12} />} size="small" onClick={(e) => { e.stopPropagation(); startEditingCourse(c); }} style={{ color: '#6366f1' }} />
                                            {selectedCourseId === c.id && (
                                                <Popconfirm title="Xóa toàn bộ khóa học?" onConfirm={() => handleDeleteCourse(c.id)}>
                                                    <Button type="text" danger icon={<Trash2 size={12} />} size="small" onClick={e => e.stopPropagation()} />
                                                </Popconfirm>
                                            )}
                                        </Space>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.sections.length} chương nội dung</div>
                                        <Text style={{ fontSize: '11px', fontWeight: 700, color: '#28a745' }}>
                                            {Number(c.price) === 0 ? 'MIỄN PHÍ' : `${Number(c.price).toLocaleString()}đ`}
                                        </Text>
                                    </div>
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
                                    { title: 'Thứ tự', dataIndex: 'order', width: 80, sorter: (a: any, b: any) => a.order - b.order },
                                    { title: 'Chương Học', dataIndex: 'title', render: (t) => <Text style={{ color: 'var(--text-main)' }}>{t}</Text> },
                                    {
                                        title: 'Số bài giảng',
                                        key: 'stats',
                                        render: (record) => <Badge count={record.lessons?.length || 0} color="#6366f1" />
                                    },
                                    {
                                        render: (record) => (
                                            <Space>
                                                <Button type="text" icon={<Edit size={14} />} onClick={() => startEditingSection(record)} style={{ color: '#6366f1' }} />
                                                <Popconfirm title="Xóa chương này?" onConfirm={() => handleDeleteSection(record.id)}>
                                                    <Button type="text" danger icon={<Trash2 size={14} />} />
                                                </Popconfirm>
                                            </Space>
                                        )
                                    }
                                ]}
                                expandable={{
                                    expandedRowRender: (record) => (
                                        <Table
                                            dataSource={record.lessons}
                                            rowKey="id"
                                            pagination={false}
                                            columns={[
                                                {
                                                    title: <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>Tên bài giảng</span>,
                                                    dataIndex: 'title',
                                                    render: (t) => <Space align="center" size={10}><PlayCircle size={14} color="#a855f7" /> <Text style={{ fontSize: '13px', color: '#334155', fontWeight: 500 }}>{t}</Text></Space>
                                                },
                                                {
                                                    title: <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>ID</span>,
                                                    dataIndex: 'id',
                                                    width: 80,
                                                    render: (id) => <Text style={{ fontSize: '12px', color: '#94a3b8' }}>{id}</Text>
                                                },
                                                {
                                                    title: <span style={{ color: '#64748b', fontSize: '11px', fontWeight: 600 }}>Hành động</span>,
                                                    width: 100,
                                                    align: 'center',
                                                    render: (lesson) => (
                                                        <Space>
                                                            <Button type="text" icon={<Edit size={14} />} onClick={() => startEditingLesson(lesson, record.id)} style={{ color: '#6366f1' }} />
                                                            <Popconfirm title="Xóa bài giảng này?" onConfirm={() => handleDeleteLesson(lesson.id)}>
                                                                <Button type="text" danger icon={<Trash2 size={14} />} style={{ display: 'flex', alignItems: 'center' }} />
                                                            </Popconfirm>
                                                        </Space>
                                                    )
                                                }
                                            ]}
                                            style={{ margin: '4px 0 12px 40px', background: '#fcfaff', borderRadius: '12px', border: '1px solid #f0f0f0', overflow: 'hidden' }}
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
            <Modal title={editingCourseId ? "Chỉnh sửa Khóa học" : "Khởi tạo Khóa học"} open={isCourseModalOpen} onCancel={() => { setIsCourseModalOpen(false); setEditingCourseId(null); }} footer={null}>
                <Form form={courseForm} layout="vertical" onFinish={handleCreateCourse}>
                    <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="level" label="Trình độ" initialValue="Cơ bản">
                        <Select>
                            <Option value="Cơ bản">Cơ bản</Option>
                            <Option value="Trung cấp">Trung cấp</Option>
                            <Option value="Nâng cao">Nâng cao</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="price" label="Giá khóa học (VNĐ)" initialValue={0} rules={[{ required: true }]}>
                        <Input
                            type="number"
                            prefix="₫"
                            placeholder="0 = Miễn phí"
                            style={{ borderRadius: '10px', height: '40px' }}
                        />
                    </Form.Item>
                    <Form.Item name="thumbnail" label="Hình ảnh khóa học (Thumbnail)">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Input
                                placeholder="Dán URL ảnh hoặc chọn file từ máy tính"
                                value={thumbUrl}
                                onChange={(e) => setThumbUrl(e.target.value)}
                                suffix={
                                    <Upload
                                        beforeUpload={(file) => {
                                            setThumbFile(file);
                                            const reader = new FileReader();
                                            reader.onload = e => setThumbUrl(e.target?.result as string);
                                            reader.readAsDataURL(file);
                                            return false;
                                        }}
                                        showUploadList={false}
                                    >
                                        <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--primary-color)' }} title="Tải ảnh lên">
                                            <UploadCloud size={18} />
                                        </div>
                                    </Upload>
                                }
                                style={{
                                    borderRadius: '10px',
                                    padding: '4px 16px',
                                    height: '40px'
                                }}
                            />
                            {thumbUrl && (
                                <div style={{ position: 'relative', marginTop: '10px' }}>
                                    <img src={thumbUrl} style={{ width: '100%', maxHeight: '180px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #eee' }} alt="Preview" />
                                    <Button
                                        type="primary"
                                        danger
                                        size="small"
                                        shape="circle"
                                        icon={<Trash2 size={12} />}
                                        style={{ position: 'absolute', top: 8, right: 8 }}
                                        onClick={() => { setThumbUrl(''); setThumbFile(null); courseForm.setFieldsValue({ thumbnail: '' }); }}
                                    />
                                </div>
                            )}
                        </Space>
                    </Form.Item>
                    <Form.Item name="learning_outcomes" label="Bạn sẽ học được gì? (Mỗi dòng một ý)">
                        <Input.TextArea rows={4} placeholder="- Nắm vững kiến thức...\n- Xây dựng sản phẩm..." />
                    </Form.Item>
                    <Form.Item name="requirements" label="Yêu cầu khóa học (Mỗi dòng một ý)">
                        <Input.TextArea rows={3} placeholder="- Có kiến thức cơ bản về...\n- Máy tính có cài đặt..." />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block className="btn-primary">Hoàn tất</Button>
                </Form>
            </Modal>

            <Modal title={editingSectionId ? "Chỉnh sửa Chương" : "Thêm Chương Mới"} open={isSectionModalOpen} onCancel={() => { setIsSectionModalOpen(false); setEditingSectionId(null); }} footer={null}>
                <Form form={sectionForm} layout="vertical" onFinish={handleSaveSection}>
                    <Form.Item name="title" label="Tiêu đề chương" rules={[{ required: true }]}>
                        <Input placeholder="Chương 1..." />
                    </Form.Item>
                    <Form.Item name="order" label="Thứ tự hiển thị" initialValue={0}>
                        <Input type="number" placeholder="Số càng nhỏ càng nằm trên" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block className="btn-primary">{editingSectionId ? "Cập nhật" : "Lưu chương"}</Button>
                </Form>
            </Modal>

            <Modal title={editingLessonId ? "Chỉnh sửa Bài Giảng" : "Đăng tải Bài Giảng Bảo Mật"} open={isLessonModalOpen} onCancel={() => { setIsLessonModalOpen(false); setEditingLessonId(null); }} footer={null}>
                <Form form={lessonForm} layout="vertical" onFinish={handleSaveLesson}>
                    <Form.Item name="section_id" label="Chọn chương mục" rules={[{ required: true, message: 'Vui lòng chọn chương' }]}>
                        <Select placeholder="Thuộc chương nào?">
                            {selectedCourse?.sections.map(s => <Option key={s.id} value={s.id}>{s.title}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="title" label="Tiêu đề bài giảng" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
                        <Input />
                    </Form.Item>
                    {!editingLessonId && (
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
                    )}
                    <Divider />
                    <Button type="primary" htmlType="submit" icon={editingLessonId ? <Edit size={18} /> : <ShieldCheck size={18} />} block className="btn-primary">
                        {editingLessonId ? "Cập nhật thông tin" : "Bắt đầu xử lý Video HLS"}
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

                /* Custom Admin Inputs */
                .admin-search-input.ant-input-affix-wrapper {
                    height: 24px !important;
                    padding: 0 8px !important;
                    border-radius: 4px !important;
                    border: 1px solid #e2e8f0 !important;
                    box-shadow: none !important;
                }
                .admin-search-input .ant-input {
                    font-size: 11px !important;
                    height: 22px !important;
                }
                .admin-filter-select .ant-select-selector {
                    height: 24px !important;
                    padding: 0 8px !important;
                    border-radius: 4px !important;
                    border: 1px solid #e2e8f0 !important;
                    display: flex;
                    align-items: center;
                }
                .admin-filter-select .ant-select-selection-item {
                    font-size: 11px !important;
                    line-height: 22px !important;
                    color: #475569 !important;
                }
            `}</style>
        </div>
    );
}
