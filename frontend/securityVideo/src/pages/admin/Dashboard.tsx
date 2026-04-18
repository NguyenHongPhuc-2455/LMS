import { useEffect, useState } from 'react';
import api from '../../api';
import {
    Trash2, UploadCloud,
    Plus, ShieldCheck, BookOpen,
    FolderOpen, PlayCircle, Edit
} from 'lucide-react';
import {
    Card, Row, Col,
    Button, Input, Select, Space, Typography,
    Table, Badge, Modal, Form, message, Divider, Popconfirm, Upload, Empty
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import './Dashboard.scss';

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
    lessons: Lesson[];
    _count?: { lessons: number };
}

interface Course {
    id: number;
    title: string;
    sections: Section[];
    is_private: boolean;
}

export default function Dashboard() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);

    const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
    const [editingCourseId, setEditingCourseId] = useState<number | null>(null);
    const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<number | null>(null);
    const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
    const [editingLessonId, setEditingLessonId] = useState<number | null>(null);

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
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
            is_private: course.is_private,
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
            let lessonId = editingLessonId;
            if (editingLessonId) {
                // Nếu đang edit, cập nhật title, section_id và content
                await api.put(`/videos/${editingLessonId}`, {
                    title: values.title,
                    section_id: values.section_id,
                    content: values.content
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
                const res = await api.post('/videos/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                lessonId = res.data.data.lessonId;
                message.success({ content: 'Bài giảng đã được đưa vào hàng chờ xử lý!', key: 'hls-upload' });
            }

            // Nếu có tệp đính kèm, thực hiện upload
            if (attachmentFile && lessonId) {
                const attachData = new FormData();
                attachData.append('attachment', attachmentFile);
                await api.post(`/videos/upload-attachment/${lessonId}`, attachData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                message.success('Đã tải lên tài liệu đính kèm!');
            }

            setIsLessonModalOpen(false);
            setEditingLessonId(null);
            setSelectedFile(null);
            setAttachmentFile(null);
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
            section_id: sectionId,
            content: lesson.content
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


    const [searchText, setSearchText] = useState('');
    const [filterLevel, setFilterLevel] = useState('All');

    const filteredCourses = courses.filter(c => {
        const matchesSearch = c.title.toLowerCase().includes(searchText.toLowerCase());
        const matchesLevel = filterLevel === 'All' || (c as any).level === filterLevel;
        return matchesSearch && matchesLevel;
    });

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <div className="header-title-wrapper">
                    <Title level={2} className="premium-title header-title">Quản lý khóa học</Title>
                    <Text className="header-subtitle">Điều hành nội dung và bảo mật video</Text>
                </div>
            </div>

            <Row gutter={24}>
                <Col span={7}>
                    <Card
                        title={<Space><FolderOpen size={16} /> Danh sách Khóa Học</Space>}
                        className="glass-card course-list-card"
                        loading={loading}
                        extra={<Button type="text" onClick={() => { setEditingCourseId(null); courseForm.resetFields(); setIsCourseModalOpen(true); }} icon={<Plus size={14} />} className="purple-text" />}
                    >
                        <Space direction="vertical" className="course-filters" size={4}>
                            <Input
                                placeholder="Tìm khóa học..."
                                prefix={<SearchOutlined />}
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
                                popupClassName="dropdown-radius"
                            >
                                <Option value="All">Tất cả trình độ</Option>
                                <Option value="Cơ bản">Cơ bản</Option>
                                <Option value="Trung cấp">Trung cấp</Option>
                                <Option value="Nâng cao">Nâng cao</Option>
                            </Select>
                        </Space>

                        <div className="course-list-scroll">
                            {filteredCourses.length === 0 ? (
                                <Empty description="Không tìm thấy kết quả" />
                            ) : filteredCourses.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedCourseId(c.id)}
                                    className={`course-item ${selectedCourseId === c.id ? 'selected' : ''}`}
                                >
                                    <div className="course-item-header">
                                        <Text strong className="course-title-text">{c.title}</Text>
                                        <Space size={4}>
                                            <Button type="text" icon={<Edit size={12} />} size="small" onClick={(e) => { e.stopPropagation(); startEditingCourse(c); }} className="indigo-text" />
                                            {selectedCourseId === c.id && (
                                                <Popconfirm title="Xóa toàn bộ khóa học?" onConfirm={() => handleDeleteCourse(c.id)}>
                                                    <Button type="text" danger icon={<Trash2 size={12} />} size="small" onClick={e => e.stopPropagation()} />
                                                </Popconfirm>
                                            )}
                                        </Space>
                                    </div>
                                    <div className="course-item-footer">
                                        <div className="course-stats">{c.sections.length} chương nội dung</div>
                                        <Badge
                                            count={c.is_private ? 'RIÊNG TƯ' : 'CÔNG KHAI'}
                                            className={c.is_private ? 'badge-private' : 'badge-public'}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </Col>

                <Col span={17}>
                    {selectedCourse ? (
                        <Card
                            title={<Title level={4} className="course-main-title">{selectedCourse.title}</Title>}
                            className="glass-card"
                            extra={
                                <Space>
                                    <Button icon={<Plus size={14} />} onClick={() => setIsSectionModalOpen(true)}>Thêm Chương</Button>
                                    <Button type="primary" icon={<UploadCloud size={14} />} onClick={() => setIsLessonModalOpen(true)} className="btn-primary-fixed">Đăng Bài Giảng</Button>
                                </Space>
                            }
                        >
                            <Table
                                dataSource={selectedCourse.sections}
                                rowKey="id"
                                pagination={false}
                                columns={[
                                    { title: 'Thứ tự', dataIndex: 'order', width: 80, sorter: (a: any, b: any) => a.order - b.order },
                                    { title: 'Chương Học', dataIndex: 'title', render: (t) => <Text className="section-title-text">{t}</Text> },
                                    {
                                        title: 'Số bài giảng',
                                        key: 'stats',
                                        render: (record) => <Badge count={record.lessons?.length || 0} color="#6366f1" />
                                    },
                                    {
                                        render: (record) => (
                                            <Space>
                                                <Button type="text" icon={<Edit size={14} />} onClick={() => startEditingSection(record)} className="indigo-text" />
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
                                                    title: <span className="lesson-title-col">Tên bài giảng</span>,
                                                    dataIndex: 'title',
                                                    render: (t) => <Space align="center" size={10} className="lesson-item-wrapper"><PlayCircle size={14} color="#a855f7" /> <Text className="lesson-name-text">{t}</Text></Space>
                                                },
                                                {
                                                    title: <span className="lesson-title-col">ID</span>,
                                                    dataIndex: 'id',
                                                    width: 80,
                                                    render: (id) => <Text className="lesson-id-text">{id}</Text>
                                                },
                                                {
                                                    title: <span className="lesson-title-col">Hành động</span>,
                                                    width: 100,
                                                    align: 'center',
                                                    render: (lesson) => (
                                                        <Space>
                                                            <Button type="text" icon={<Edit size={14} />} onClick={() => startEditingLesson(lesson, record.id)} className="indigo-text" />
                                                            <Popconfirm title="Xóa bài giảng này?" onConfirm={() => handleDeleteLesson(lesson.id)}>
                                                                <Button type="text" danger icon={<Trash2 size={14} />} className="flex-center" />
                                                            </Popconfirm>
                                                        </Space>
                                                    )
                                                }
                                            ]}
                                            className="lesson-table-expanded"
                                        />
                                    ),
                                    rowExpandable: (record) => record.lessons.length > 0,
                                }}
                            />
                        </Card>
                    ) : (
                        <div className="empty-dashboard-placeholder">
                            <BookOpen size={48} className="placeholder-icon" />
                            <Title level={4} className="placeholder-text">Chọn khóa học để điều hành nội dung</Title>
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
                    <Form.Item name="is_private" label="Chế độ truy cập" initialValue={false} rules={[{ required: true }]}>
                        <Select>
                            <Option value={false}>Công khai (Tự động cấp quyền)</Option>
                            <Option value={true}>Riêng tư (Cần phê duyệt)</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="thumbnail" label="Hình ảnh khóa học (Thumbnail)">
                        <Space direction="vertical" className="full-width">
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
                                        <div className="upload-trigger-icon" title="Tải ảnh lên">
                                            <UploadCloud size={18} />
                                        </div>
                                    </Upload>
                                }
                                className="thumbnail-input"
                            />
                            {thumbUrl && (
                                <div className="thumbnail-preview-container">
                                    <img src={thumbUrl} className="thumbnail-img" alt="Preview" />
                                    <Button
                                        type="primary"
                                        danger
                                        size="small"
                                        shape="circle"
                                        icon={<Trash2 size={12} />}
                                        className="delete-thumb-btn"
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
                    <Form.Item name="content" label="Nội dung bài học (Dưới dạng văn bản)">
                        <Input.TextArea rows={4} placeholder="Nhập nội dung giảng dạy, hướng dẫn..." />
                    </Form.Item>
                    <div className="file-input-section">
                        <label className="file-input-label">Tài liệu đính kèm (PDF - Tùy chọn)</label>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                            className="file-input-custom"
                        />
                        {attachmentFile && <Text className="success-text">✓ {attachmentFile.name}</Text>}
                    </div>

                    {!editingLessonId && (
                        <div className="file-input-section">
                            <label className="file-input-label">Tệp Video (MP4 - Bắt buộc khi tạo mới)</label>
                            <input
                                type="file"
                                accept="video/mp4"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className="file-input-custom"
                            />
                            {selectedFile && <Text className="success-text">✓ {selectedFile.name}</Text>}
                        </div>
                    )}
                    <Divider />
                    <Button type="primary" htmlType="submit" icon={editingLessonId ? <Edit size={18} /> : <ShieldCheck size={18} />} block className="btn-primary">
                        {editingLessonId ? "Cập nhật thông tin" : "Bắt đầu xử lý Video HLS"}
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
