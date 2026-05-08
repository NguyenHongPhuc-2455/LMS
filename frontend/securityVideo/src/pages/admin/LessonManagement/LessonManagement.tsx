import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { courseService } from '../../../services/course.service';
import { contentService } from '../../../services/content.service';
import { quizService } from '../../../services/quiz.service';
import { videoService } from '../../../services/video.service';
import { categoryService } from '../../../services/category.service';

import {
    Plus
} from 'lucide-react';
import {
    Card, Button, Typography,
    message, Tooltip
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import styles from './LessonManagement.module.scss';

// New specialized components
import LessonTable from './components/LessonTable';
import LessonFormModal from './components/LessonFormModal';
import LessonFilter from './components/LessonFilter';

const { Title, Text } = Typography;

interface Lesson {
    id: number;
    section_id: number;
    title: string;
    video_url: string;
    attachment_url?: string;
    attachment_name?: string;
    content?: string;
    type: 'VIDEO' | 'DOCUMENT' | 'QUIZ';
    order?: number;
    duration?: number;
    anti_seek?: boolean;
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
    const [categories, setCategories] = useState<any[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [sections, setSections] = useState<Section[]>([]);
    const [lessons, setLessons] = useState<Lesson[]>([]);

    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [selectedSectionId, setSelectedSectionId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const isFirstLoad = useRef(true);
    const isInitializing = useRef(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<any | null>(null);
    const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
    const [lessonType, setLessonType] = useState<'VIDEO' | 'QUIZ'>('VIDEO');


    const fetchCourses = async (categoryId: number) => {
        try {
            const data = await courseService.getAll('', categoryId);
            setCourses(data);
        } catch (e) { message.error('Lỗi tải khóa học'); }
    };

    const fetchSections = async (courseId: number) => {
        try {
            const data = await courseService.getById(courseId);
            setSections(data.sections || []);
        } catch (e) { message.error('Lỗi tải chương'); }
    };

    const fetchLessons = async (sectionId: number) => {
        setLoading(true);
        try {
            const data = await contentService.getLessonsBySection(sectionId);
            setLessons(data || []);
        } catch (e) {
            // Error handled
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initFromUrl = async () => {
            const allCategories = await categoryService.getAllCategories().catch(() => []);
            setCategories(allCategories);

            const cId = searchParams.get('courseId');
            const sId = searchParams.get('sectionId');

            if (cId) {
                isInitializing.current = true;
                isFirstLoad.current = true;
                const courseData = await courseService.getById(cId).catch(() => null);
                if (courseData) {
                    const catId = courseData.category?.id;
                    if (catId) {
                        setSelectedCategoryId(catId);
                        const coursesData = await courseService.getAll('', catId).catch(() => []);
                        setCourses(coursesData);
                    }
                    const sortedSections = (courseData.sections || []).sort(
                        (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
                    );
                    setSections(sortedSections);
                    setSelectedCourseId(Number(cId));
                    if (sId) {
                        setSelectedSectionId(Number(sId));
                        await fetchLessons(Number(sId)); // directly call, don't rely on useEffect
                    }
                }
                isInitializing.current = false;
                isFirstLoad.current = false;
            } else {
                isFirstLoad.current = false;
            }
        };
        initFromUrl();
    }, []);

    useEffect(() => {
        if (isInitializing.current) return;
        if (selectedCategoryId) {
            fetchCourses(selectedCategoryId);
            setSelectedCourseId(null);
            setSections([]);
            setSelectedSectionId(null);
            setLessons([]);
        }
    }, [selectedCategoryId]);

    useEffect(() => {
        if (isInitializing.current) return;
        if (selectedCourseId) {
            fetchSections(selectedCourseId);
            setSelectedSectionId(null);
            setLessons([]);
        }
    }, [selectedCourseId]);

    useEffect(() => {
        if (isInitializing.current) return;
        if (selectedSectionId) {
            fetchLessons(selectedSectionId);
        } else {
            setLessons([]);
        }
    }, [selectedSectionId]);

    const handleSave = async (values: any, selectedFile: File | null, attachmentFile: File | null): Promise<void> => {
        try {
            let lessonId = editingLesson?.id;
            const totalDuration = (Number(values.duration_min || 0) * 60) + Number(values.duration_sec || 0);

            if (lessonType === 'QUIZ') {
                if (editingQuizId) {
                    await quizService.update(editingQuizId, values);
                    message.success('Đã cập nhật bài trắc nghiệm!');
                } else {
                    await quizService.create({
                        ...values,
                        section_id: selectedSectionId,
                        order: values.order
                    });
                    message.success('Đã tạo bài trắc nghiệm!');
                }
            } else {
                if (editingLesson?.id) {
                    await videoService.update(editingLesson.id, {
                        title: values.title,
                        section_id: values.section_id,
                        content: values.content,
                        order: values.order,
                        duration: totalDuration,
                        anti_seek: values.anti_seek !== undefined ? values.anti_seek : true
                    });
                    message.success('Đã cập nhật bài giảng!');
                } else {
                    const videoSourceType = values.video_url ? 'LINK' : 'UPLOAD';
                    const isHlsUrl = videoSourceType === 'UPLOAD' && !!values.hls_video_url;

                    if (videoSourceType === 'UPLOAD' && !selectedFile && !isHlsUrl) {
                        message.error('Vui lòng chọn tệp video hoặc nhập link video HLS');
                        return;
                    }

                    const formData = new FormData();
                    formData.append('title', values.title);
                    formData.append('section_id', String(values.section_id));
                    formData.append('order', String(values.order || '0'));
                    formData.append('content', values.content || '');
                    formData.append('anti_seek', String(values.anti_seek !== undefined ? values.anti_seek : true));
                    if (totalDuration > 0) {
                        formData.append('duration', String(totalDuration));
                    }
                    if (values.attachment_url) {
                        formData.append('attachment_url', values.attachment_url);
                    }

                    if (videoSourceType === 'UPLOAD') {
                        if (selectedFile) {
                            formData.append('video', selectedFile);
                        } else if (isHlsUrl) {
                            formData.append('hls_video_url', values.hls_video_url);
                        }
                        message.loading({ content: 'Đang xử lý video HLS...', key: 'hls-up' });
                    } else {
                        formData.append('video_url', values.video_url);
                        message.loading({ content: 'Đang lưu bài giảng...', key: 'hls-up' });
                    }

                    const data = await videoService.upload(formData);
                    lessonId = data.data.lessonId;
                    message.success({ content: videoSourceType === 'UPLOAD' ? 'Video đang được băm bảo mật...' : 'Đã tải lên thành công!', key: 'hls-up' });
                }

                if (lessonId) {
                    // Nếu có file đính kèm mới -> Upload lên server/cloud
                    if (attachmentFile) {
                        const attachData = new FormData();
                        attachData.append('attachment', attachmentFile);
                        await videoService.uploadAttachment(lessonId, attachData);
                        message.success('Đã tải lên tài liệu mới!');
                    }
                    // Nếu không có file mới nhưng có nhập URL (như GG Drive) -> Cập nhật URL vào DB
                    else if (values.attachment_url) {
                        await videoService.update(lessonId, {
                            attachment_url: values.attachment_url,
                            attachment_name: values.attachment_url.split('/').pop()?.substring(0, 30) || 'Document'
                        });
                        message.success('Đã lưu link tài liệu!');
                    }
                }
            }

            setIsModalOpen(false);
            setEditingLesson(null);
            setEditingQuizId(null);
            if (selectedSectionId) fetchLessons(selectedSectionId);
        } catch (e: any) {
            message.error({ content: e.response?.data?.error || e.message || 'Lỗi xử lý', key: 'hls-up' });
            throw e;
        }
    };

    const startEditing = async (lesson: Lesson) => {
        // Cài đặt loại bài học trước để modal biết render form nào
        const type = lesson.type === 'QUIZ' ? 'QUIZ' : 'VIDEO';
        setLessonType(type);

        if (lesson.type === 'QUIZ') {
            try {
                message.loading({ content: 'Đang tải dữ liệu bài thi...', key: 'quiz-loading' });
                const data = await quizService.getByLesson(lesson.id);
                const quizData = data.data;
                setEditingQuizId(quizData.id);

                setEditingLesson({
                    ...lesson,
                    section_id: lesson.section_id || selectedSectionId,
                    description: quizData.description,
                    pass_score: quizData.pass_score,
                    time_limit: quizData.time_limit,
                    questions: quizData.questions
                });
                message.success({ content: 'Hoàn tất', key: 'quiz-loading', duration: 1 });
            } catch (e) {
                message.error({ content: 'Không tải được nội dung bài thi', key: 'quiz-loading' });
                setEditingLesson({
                    ...lesson,
                    section_id: lesson.section_id || selectedSectionId
                });
            }
        } else {
            setEditingLesson({
                ...lesson,
                section_id: lesson.section_id || selectedSectionId,
                duration_min: lesson.duration ? Math.floor(lesson.duration / 60) : 0,
                duration_sec: lesson.duration ? (lesson.duration % 60) : 0,
                anti_seek: lesson.anti_seek !== undefined ? lesson.anti_seek : true,
                attachment_url: lesson.attachment_url
            });
        }
        setIsModalOpen(true);
    };

    const handleDelete = async (lesson: Lesson) => {
        try {
            await videoService.delete(lesson.id);
            message.success('Đã xóa bài giảng');
            if (selectedSectionId) fetchLessons(selectedSectionId);
        } catch (e) { message.error('Lỗi khi xóa'); }
    };

    return (
        <div className={styles.lessonManagementContainer}>
            <div className={styles.lessonManagementHeader}>
                <div>
                    <Title level={4} className={styles.headerTitle}>Quản lý Bài Giảng</Title>
                    <Text type="secondary">Cập nhật nội dung video, trắc nghiệm và tài liệu học tập</Text>
                </div>
            </div>

            <Card className="glass-card">
                <LessonFilter
                    categories={categories}
                    courses={courses}
                    sections={sections}
                    selectedCategoryId={selectedCategoryId}
                    selectedCourseId={selectedCourseId}
                    selectedSectionId={selectedSectionId}
                    onCategoryChange={setSelectedCategoryId}
                    onCourseChange={setSelectedCourseId}
                    onSectionChange={setSelectedSectionId}
                >
                    <Tooltip title="Làm mới dữ liệu">
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => selectedSectionId && fetchLessons(selectedSectionId)}
                            loading={loading}
                            disabled={!selectedSectionId}
                        />
                    </Tooltip>
                    <Button
                        type="primary"
                        disabled={!selectedSectionId}
                        onClick={() => {
                            const nextOrder = lessons.length > 0 ? Math.max(...lessons.map(l => l.order || 0)) + 1 : 1;
                            setEditingLesson({
                                order: nextOrder,
                                section_id: selectedSectionId
                            });
                            setEditingQuizId(null);
                            setLessonType('VIDEO');
                            setIsModalOpen(true);
                        }}
                        icon={<Plus size={16} />}
                        className={styles.adminAddButton}
                    >
                        Đăng bài giảng mới
                    </Button>
                </LessonFilter>

                <LessonTable
                    lessons={lessons}
                    loading={loading}
                    onEdit={startEditing}
                    onDelete={handleDelete}
                />
            </Card>

            <LessonFormModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onSuccess={handleSave}
                editingId={editingLesson?.id}
                initialValues={editingLesson}
                sections={sections}
                lessonType={lessonType}
                setLessonType={setLessonType}
            />
        </div>
    );
}
