import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api';
import {
    Trash2,
    Plus, ShieldCheck, PlayCircle, Edit
} from 'lucide-react';
import {
    Card, Button, Input, Select, Space, Typography,
    Table, Modal, Form, message, Divider, Popconfirm, Badge, Segmented, Radio, InputNumber, Row, Col
} from 'antd';
import { QuestionCircleOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import './LessonManagement.scss';

const { Title, Text } = Typography;
const { Option } = Select;

interface Lesson {
    id: number;
    title: string;
    video_url: string;
    attachment_url?: string;
    attachment_name?: string;
    content?: string;
    type: 'VIDEO' | 'DOCUMENT' | 'QUIZ';
    order?: number;
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
    const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [lessonType, setLessonType] = useState<'VIDEO' | 'QUIZ'>('VIDEO');
    const [videoSourceType, setVideoSourceType] = useState<'UPLOAD' | 'LINK'>('UPLOAD');

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
            const res = await api.get(`/courses/sections/${sectionId}`);
            setLessons(res.data.lessons || []);
        } catch (e) {
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

            if (isFirstLoad.current) {
                const sId = searchParams.get('sectionId');
                if (sId) {
                    setSelectedSectionId(Number(sId));
                }
                isFirstLoad.current = false;
            } else {
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

            if (lessonType === 'QUIZ') {
                if (editingId && editingQuizId) {
                    await api.put(`/quizzes/${editingQuizId}`, {
                        title: values.title,
                        section_id: values.section_id,
                        description: values.description,
                        pass_score: values.pass_score,
                        time_limit: values.time_limit,
                        questions: values.questions,
                        order: values.order
                    });
                    message.success('Đã cập nhật bài trắc nghiệm!');
                } else {
                    // Create quiz
                    await api.post('/quizzes', {
                        title: values.title,
                        section_id: values.section_id,
                        description: values.description,
                        pass_score: values.pass_score,
                        time_limit: values.time_limit,
                        questions: values.questions,
                        order: values.order
                    });
                    message.success('Đã tạo bài trắc nghiệm!');
                }
            } else {
                if (editingId) {
                    await api.put(`/videos/${editingId}`, {
                        title: values.title,
                        section_id: values.section_id,
                        content: values.content,
                        order: values.order
                    });
                    message.success('Đã cập nhật bài giảng!');
                } else {
                    if (videoSourceType === 'UPLOAD' && !selectedFile) return message.error('Vui lòng chọn tệp video');
                    const formData = new FormData();
                    formData.append('title', values.title);
                    formData.append('section_id', values.section_id);
                    formData.append('order', values.order || '0');
                    if (videoSourceType === 'UPLOAD') {
                        formData.append('video', selectedFile!);
                        message.loading({ content: 'Đang xử lý video HLS...', key: 'hls-up' });
                    } else {
                        formData.append('video_url', values.video_url);
                        message.loading({ content: 'Đang lưu bài giảng...', key: 'hls-up' });
                    }

                    const res = await api.post('/videos/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' } // Multer in backend still processes it correctly because fields are appended
                    });
                    lessonId = res.data.data.lessonId;
                    message.success({ content: videoSourceType === 'UPLOAD' ? 'Video đang được băm bảo mật...' : 'Đã tải lên thành công!', key: 'hls-up' });
                }

                if (attachmentFile && lessonId) {
                    const attachData = new FormData();
                    attachData.append('attachment', attachmentFile);
                    await api.post(`/videos/upload-attachment/${lessonId}`, attachData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    message.success('Đã đính kèm tài liệu!');
                }
            }

            setIsModalOpen(false);
            setEditingId(null);
            setEditingQuizId(null);
            setSelectedFile(null);
            setAttachmentFile(null);
            form.resetFields();
            if (selectedSectionId) fetchLessons(selectedSectionId);
        } catch (e: any) {
            message.error({ content: e.response?.data?.error || e.message || 'Lỗi xử lý', key: 'hls-up' });
        }
    };

    const startEditing = async (lesson: Lesson) => {
        setEditingId(lesson.id);

        if (lesson.type === 'QUIZ') {
            setLessonType('QUIZ');
            form.resetFields();
            try {
                message.loading({ content: 'Đang tải dữ liệu bài thi...', key: 'quiz-loading' });
                const res = await api.get(`/quizzes/lesson/${lesson.id}`);
                const quizData = res.data.data;
                setEditingQuizId(quizData.id);
                form.setFieldsValue({
                    title: lesson.title,
                    section_id: selectedSectionId,
                    order: lesson.order || 0,
                    description: quizData.description,
                    pass_score: quizData.pass_score,
                    time_limit: quizData.time_limit,
                    questions: quizData.questions
                });
                message.success({ content: 'Hoàn tất', key: 'quiz-loading', duration: 1 });
            } catch (e) {
                message.error({ content: 'Không tải được nội dung bài thi', key: 'quiz-loading' });
            }
        } else {
            setLessonType('VIDEO');
            form.setFieldsValue({
                title: lesson.title,
                section_id: selectedSectionId,
                content: lesson.content,
                order: lesson.order || 0
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (lesson: Lesson) => {
        try {
            if (lesson.type === 'QUIZ') {
                // Must get quizId from somewhere, or just use lesson delete endpoint if backend deletes quiz via cascade.
                // Our video delete endpoint actually deletes lesson:
                await api.delete(`/videos/${lesson.id}`);
            } else {
                await api.delete(`/videos/${lesson.id}`);
            }
            message.success('Đã xóa bài giảng');
            if (selectedSectionId) fetchLessons(selectedSectionId);
        } catch (e) { message.error('Lỗi khi xóa'); }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setEditingQuizId(null);
        setLessonType('VIDEO');
        setVideoSourceType('UPLOAD');
        form.resetFields();
        const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order || 0)) + 1 : 0;
        form.setFieldsValue({ section_id: selectedSectionId, order: nextOrder });
        setIsModalOpen(true);
    };

    return (
        <div className="lesson-management-container">
            <div className="lesson-management-header">
                <div>
                    <Title level={4} className="header-title">Quản lý Bài Giảng</Title>
                    <Text type="secondary">Cập nhật nội dung video, trắc nghiệm và tài liệu học tập</Text>
                </div>
                <Button
                    type="primary"
                    disabled={!selectedSectionId}
                    onClick={openCreateModal}
                    icon={<Plus size={16} />}
                >
                    Đăng bài giảng mới
                </Button>
            </div>

            <Card className="glass-card filter-card">
                <Space size={24}>
                    <Space>
                        <Text strong>Khóa học:</Text>
                        <Select
                            placeholder="Chọn khóa học..."
                            className="filter-select"
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
                            className="filter-select"
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
                    <div className="empty-lesson-wrapper">
                        <PlayCircle size={40} className="empty-icon" />
                        <Text type="secondary" className="empty-text">Vui lòng chọn Khóa học và Chương để quản lý bài giảng</Text>
                    </div>
                ) : (
                    <Table
                        dataSource={lessons}
                        loading={loading}
                        rowKey="id"
                        columns={[
                            { title: 'ID', dataIndex: 'id', width: 80 },
                            {
                                title: 'Tên bài giảng',
                                dataIndex: 'title',
                                render: (t, r) => (
                                    <Space>
                                        {r.type === 'QUIZ' ? <QuestionCircleOutlined className="quiz-icon" /> : <PlayCircle size={14} color="#6366f1" />}
                                        {t}
                                    </Space>
                                )
                            },
                            {
                                title: 'Phân loại',
                                dataIndex: 'type',
                                render: (t) => t === 'QUIZ' ? <Badge status="warning" text="Trắc nghiệm" /> : <Badge status="processing" text="Video/Tài liệu" />
                            },
                            {
                                title: 'Hành động',
                                key: 'actions',
                                width: 150,
                                render: (record) => (
                                    <Space>
                                        <Button type="text" icon={<Edit size={16} />} onClick={() => startEditing(record)} />
                                        <Popconfirm title="Xóa bài giảng?" onConfirm={() => handleDelete(record)}>
                                            <Button type="text" danger icon={<Trash2 size={16} />} />
                                        </Popconfirm>
                                    </Space>
                                )
                            }
                        ]}
                    />
                )}
            </Card>

            <Modal
                title={editingId ? "Chỉnh sửa Bài Giảng" : "Đăng Bài Giảng Mới"}
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
                width={800} // Increased width to fit quiz form
                destroyOnClose
            >
                {!editingId && (
                    <div className="segmented-wrapper">
                        <Segmented
                            options={[
                                { label: 'Video bài học', value: 'VIDEO' },
                                { label: 'Bài trắc nghiệm', value: 'QUIZ' }
                            ]}
                            value={lessonType}
                            onChange={(v) => {
                                setLessonType(v as 'VIDEO' | 'QUIZ');
                            }}
                        />
                    </div>
                )}

                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="section_id" label="Chương học" rules={[{ required: true }]} initialValue={selectedSectionId}>
                        <Select>
                            {sections.map(s => <Option key={s.id} value={s.id}>{s.title}</Option>)}
                        </Select>
                    </Form.Item>

                    <Row gutter={16}>
                        <Col span={18}>
                            <Form.Item name="title" label={lessonType === 'QUIZ' ? "Tiêu đề bài trắc nghiệm" : "Tiêu đề bài giảng"} rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="order" label="Thứ tự hiển thị">
                                <InputNumber min={0} className="full-width" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {lessonType === 'VIDEO' && (
                        <>
                            <Form.Item name="content" label="Nội dung văn bản">
                                <Input.TextArea rows={4} />
                            </Form.Item>

                            <div className="attachment-wrapper">
                                <Text strong className="attachment-title">Tài liệu đính kèm (PDF - Tùy chọn)</Text>
                                <input type="file" accept="application/pdf" onChange={e => setAttachmentFile(e.target.files?.[0] || null)} />
                                {attachmentFile && <Text type="success" className="attachment-success"><br />✓ {attachmentFile.name}</Text>}
                            </div>

                            {!editingId && (
                                <div className="video-source-wrapper">
                                    <Radio.Group value={videoSourceType} onChange={e => setVideoSourceType(e.target.value)} className="video-source-radio">
                                        <Radio value="UPLOAD">Upload Video MP4 (HLS)</Radio>
                                        <Radio value="LINK">Dùng Link (Youtube/Server)</Radio>
                                    </Radio.Group>

                                    {videoSourceType === 'UPLOAD' ? (
                                        <div>
                                            <Text strong className="attachment-title">Tệp Video (MP4 - Bắt buộc)</Text>
                                            <input type="file" accept="video/mp4" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                                            {selectedFile && <Text type="success" className="attachment-success"><br />✓ {selectedFile.name}</Text>}
                                        </div>
                                    ) : (
                                        <Form.Item name="video_url" label="Link Video (Youtube hoặc link trực tiếp)" rules={[{ required: true }]}>
                                            <Input placeholder="Ví dụ: https://www.youtube.com/watch?v=..." />
                                        </Form.Item>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {lessonType === 'QUIZ' && (
                        <>
                            <Form.Item name="description" label="Hướng dẫn / Mô tả bài thi">
                                <Input.TextArea rows={2} />
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="pass_score" label="Xác mức điểm Đạt (%)" initialValue={80}>
                                        <InputNumber min={0} max={100} className="full-width" />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="time_limit" label="Thời gian (Giây) - Để trống = Không hạn" initialValue={null}>
                                        <InputNumber min={0} className="full-width" />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Divider>Danh sách câu hỏi</Divider>

                            <Form.List name="questions">
                                {(fields, { add, remove }) => (
                                    <>
                                        {fields.map(({ key, name, ...restField }, index) => (
                                            <Card size="small" key={key} className="quiz-question-card" title={`Câu ${index + 1}`}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'content']}
                                                    label="Nội dung câu hỏi"
                                                    rules={[{ required: true, message: 'Nhập câu hỏi' }]}
                                                >
                                                    <Input />
                                                </Form.Item>

                                                <Text strong>Các lựa chọn (Đánh dấu vào đáp án đúng)</Text>
                                                <Form.List name={[name, 'options']}>
                                                    {(optFields, { add: addOpt, remove: removeOpt }) => (
                                                        <div className="quiz-options-wrapper">
                                                            {optFields.map((optField, oIdx) => (
                                                                <Row key={optField.key} gutter={8} align="middle" className="quiz-option-row">
                                                                    <Col span={3}>
                                                                        <Form.Item {...optField} name={[optField.name, 'is_correct']} valuePropName="checked" noStyle>
                                                                            <Radio
                                                                                onChange={() => {
                                                                                    const currentQuestions = form.getFieldValue('questions');
                                                                                    if (currentQuestions && currentQuestions[name] && currentQuestions[name].options) {
                                                                                        const newOptions = currentQuestions[name].options.map((o: any, idx: number) => ({
                                                                                            ...o,
                                                                                            is_correct: idx === oIdx
                                                                                        }));
                                                                                        form.setFieldValue(['questions', name, 'options'], newOptions);
                                                                                    }
                                                                                }}
                                                                            >
                                                                                Đúng
                                                                            </Radio>
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={20}>
                                                                        <Form.Item {...optField} name={[optField.name, 'content']} noStyle rules={[{ required: true }]}>
                                                                            <Input placeholder={`Lựa chọn ${oIdx + 1}`} />
                                                                        </Form.Item>
                                                                    </Col>
                                                                    <Col span={1}>
                                                                        <DeleteOutlined className="quiz-option-delete" onClick={() => removeOpt(optField.name)} />
                                                                    </Col>
                                                                </Row>
                                                            ))}
                                                            {optFields.length < 5 && (
                                                                <Button type="dashed" onClick={() => addOpt({ is_correct: false })} block icon={<PlusOutlined />}>
                                                                    Thêm lựa chọn
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )}
                                                </Form.List>

                                                <Divider className="quiz-divider" />

                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'explanation']}
                                                    label="Giải thích đáp án (tùy chọn)"
                                                    className="quiz-explanation-item"
                                                >
                                                    <Input placeholder="Giải thích vì sao lại chọn đáp án này..." />
                                                </Form.Item>

                                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} className="quiz-question-delete">
                                                    Xóa câu này
                                                </Button>
                                            </Card>
                                        ))}
                                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="add-question-btn">
                                            Thêm câu hỏi
                                        </Button>
                                    </>
                                )}
                            </Form.List>
                        </>
                    )}

                    <Divider />
                    <Button type="primary" htmlType="submit" block size="large" icon={lessonType === 'VIDEO' ? <ShieldCheck size={18} /> : undefined}>
                        {editingId ? "Cập nhật" : (lessonType === 'VIDEO' ? "Bắt đầu băm video HLS" : "Lưu bài trắc nghiệm")}
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
