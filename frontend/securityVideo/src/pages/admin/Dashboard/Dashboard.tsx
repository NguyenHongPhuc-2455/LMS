import { useEffect, useState } from 'react';
import { courseService } from '../../../services/course.service';
import { contentService } from '../../../services/content.service';
import { videoService } from '../../../services/video.service';
import { uploadService } from '../../../services/upload.service';

import styles from './Dashboard.module.scss';
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
            const data = await courseService.getAll();
            const detailedCourses = await Promise.all(
                data.map((c: any) => courseService.getById(c.id))
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
                const uploadRes = await uploadService.image(formData);
                finalThumbnail = uploadRes.url;
            }


            const payload = { ...values, thumbnail: finalThumbnail };

            if (editingCourseId) {
                await courseService.update(editingCourseId, payload);
                message.success('Đã cập nhật khóa học!');
            } else {
                await courseService.create(payload);
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
                await contentService.updateSection(editingSectionId, values);
                message.success('Đã cập nhật chương!');
            } else {
                await contentService.createSection({ ...values, course_id: selectedCourseId });
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
                await videoService.update(editingLessonId, {
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
                const data = await videoService.upload(formData);
                lessonId = data.data.lessonId;

                message.success({ content: 'Bài giảng đã được đưa vào hàng chờ xử lý!', key: 'hls-upload' });
            }

            // Nếu có tệp đính kèm, thực hiện upload
            if (attachmentFile && lessonId) {
                const attachData = new FormData();
                attachData.append('attachment', attachmentFile);
                await videoService.uploadAttachment(lessonId, attachData);
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
            await videoService.delete(id);
            message.success('Đã xóa bài giảng');
            fetchData();
        } catch (e) { message.error('Không thể xóa bài giảng'); }
    };

    const handleDeleteSection = async (id: number) => {
        try {
            // Cần endpoint xóa section, giả định là backend có
            await contentService.deleteSection(id);
            message.success('Đã xóa chương');
            fetchData();
        } catch (e) { message.error('Lỗi khi xóa chương'); }
    };

    const handleDeleteCourse = async (id: number) => {
        try {
            await courseService.delete(id);
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
        <div className={styles.dashboardContainer}>
            <div className={styles.dashboardHeader}>
                <div className={styles.headerTitleWrapper}>
                    <Title level={2} className={styles.headerTitle}>Hệ thống Quản trị</Title>
                    <Text className={styles.headerSubtitle}>Quản lý học liệu, học viên và bài giảng bảo mật</Text>
                </div>
            </div>

            <Row gutter={24}>
                <Col span={7}>
                    <Card
                        title={<Space><FolderOpen size={16} /> Danh sách Khóa Học</Space>}
                        className={`glass-card ${styles.courseListCard}`}
                        loading={loading}
                        extra={<Button type="text" onClick={() => { setEditingCourseId(null); courseForm.resetFields(); setIsCourseModalOpen(true); }} icon={<Plus size={14} />} className="purple-text" />}
                    >
                        <Space direction="vertical" className={styles.courseFilters} size={4}>
                            <Input
                                placeholder="Tìm khóa học..."
                                prefix={<SearchOutlined />}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                className={styles.adminSearchInput}
                            />
                            <Select
                                defaultValue="All"
                                onChange={(v) => setFilterLevel(v)}
                                size="small"
                                variant="borderless"
                                className={styles.adminFilterSelect}
                                popupClassName="dropdown-radius"
                            >
                                <Option value="All">Tất cả trình độ</Option>
                                <Option value="Cơ bản">Cơ bản</Option>
                                <Option value="Trung cấp">Trung cấp</Option>
                                <Option value="Nâng cao">Nâng cao</Option>
                            </Select>
                        </Space>

                        <div className={styles.courseListScroll}>
                            {filteredCourses.length === 0 ? (
                                <Empty description="Không tìm thấy kết quả" />
                            ) : filteredCourses.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => setSelectedCourseId(c.id)}
                                    className={`${styles.courseItem} ${selectedCourseId === c.id ? styles.selected : ''}`}
                                >
                                    <div className={styles.courseItemHeader}>
                                        <Text strong className={styles.courseTitleText}>{c.title}</Text>
                                        <Space size={4}>
                                            <Button type="text" icon={<Edit size={12} />} size="small" onClick={(e) => { e.stopPropagation(); startEditingCourse(c); }} className="indigo-text" />
                                            {selectedCourseId === c.id && (
                                                <Popconfirm title="Xóa toàn bộ khóa học?" onConfirm={() => handleDeleteCourse(c.id)}>
                                                    <Button type="text" danger icon={<Trash2 size={12} />} size="small" onClick={e => e.stopPropagation()} />
                                                </Popconfirm>
                                            )}
                                        </Space>
                                    </div>
                                    <div className={styles.courseItemFooter}>
                                        <div className={styles.courseStats}>{c.sections.length} chương nội dung</div>
                                        <Badge
                                            count={c.is_private ? 'RIÊNG TƯ' : 'CÔNG KHAI'}
                                            className={c.is_private ? styles.badgePrivate : styles.badgePublic}
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
                                        <div className={styles.lessonTableExpanded}>
                                            <Table
                                                dataSource={record.lessons}
                                                rowKey="id"
                                                pagination={false}
                                                columns={[
                                                    {
                                                        title: <span className={styles.lessonTitleCol}>Tên bài giảng</span>,
                                                        dataIndex: 'title',
                                                        render: (t) => <Space align="center" size={10} className={styles.lessonItemWrapper}><PlayCircle size={14} color="#a855f7" /> <Text className={styles.lessonNameText}>{t}</Text></Space>
                                                    },
                                                    {
                                                        title: <span className={styles.lessonTitleCol}>ID</span>,
                                                        dataIndex: 'id',
                                                        width: 80,
                                                        render: (id) => <Text className={styles.lessonIdText}>{id}</Text>
                                                    },
                                                    {
                                                        title: <span className={styles.lessonTitleCol}>Hành động</span>,
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
                                            />
                                        </div>
                                    ),
                                    rowExpandable: (record) => record.lessons.length > 0,
                                }}
                            />
                        </Card>
                    ) : (
                        <div className={styles.emptyDashboardPlaceholder}>
                            <BookOpen size={48} className={styles.placeholderIcon} />
                            <Title level={4} className={styles.placeholderText}>Chọn khóa học để điều hành nội dung</Title>
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
                                        <div className={styles.uploadTriggerIcon} title="Tải ảnh lên">
                                            <UploadCloud size={18} />
                                        </div>
                                    </Upload>
                                }
                                className="thumbnail-input"
                            />
                            {thumbUrl && (
                                <div className={styles.thumbnailPreviewContainer}>
                                    <img src={thumbUrl} className={styles.thumbnailImg} alt="Preview" />
                                    <Button
                                        type="primary"
                                        danger
                                        size="small"
                                        shape="circle"
                                        icon={<Trash2 size={12} />}
                                        className={styles.deleteThumbBtn}
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
                    <div className={styles.fileInputSection}>
                        <label className={styles.fileInputLabel}>Tài liệu đính kèm (PDF - Tùy chọn)</label>
                        <input
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
                            className={styles.fileInputCustom}
                        />
                        {attachmentFile && <Text className={styles.successText}>✓ {attachmentFile.name}</Text>}
                    </div>

                    {!editingLessonId && (
                        <div className={styles.fileInputSection}>
                            <label className={styles.fileInputLabel}>Tệp Video (MP4 - Bắt buộc khi tạo mới)</label>
                            <input
                                type="file"
                                accept="video/mp4"
                                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                className={styles.fileInputCustom}
                            />
                            {selectedFile && <Text className={styles.successText}>✓ {selectedFile.name}</Text>}
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

