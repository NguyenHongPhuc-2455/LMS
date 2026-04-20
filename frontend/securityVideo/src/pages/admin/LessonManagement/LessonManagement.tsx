import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { courseService } from '../../../services/course.service';
import { contentService } from '../../../services/content.service';
import { quizService } from '../../../services/quiz.service';
import { videoService } from '../../../services/video.service';

import {
    Plus, PlayCircle
} from 'lucide-react';
import {
    Card, Button, Typography,
    message
} from 'antd';
import styles from './LessonManagement.module.scss';

// New specialized components
import LessonTable from './components/LessonTable';
import LessonFormModal from './components/LessonFormModal';
import LessonFilter from './components/LessonFilter';

const { Title, Text } = Typography;

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
    const [editingLesson, setEditingLesson] = useState<any | null>(null);
    const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
    const [lessonType, setLessonType] = useState<'VIDEO' | 'QUIZ'>('VIDEO');

    const fetchCourses = async () => {
        try {
            const data = await courseService.getAll();
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

    const handleSave = async (values: any, selectedFile: File | null, attachmentFile: File | null): Promise<void> => {
        try {
            let lessonId = editingLesson?.id;

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
                if (editingLesson) {
                    await videoService.update(editingLesson.id, {
                        title: values.title,
                        section_id: values.section_id,
                        content: values.content,
                        order: values.order
                    });
                    message.success('Đã cập nhật bài giảng!');
                } else {
                    const videoSourceType = values.video_url ? 'LINK' : 'UPLOAD';
                    if (videoSourceType === 'UPLOAD' && !selectedFile) {
                        message.error('Vui lòng chọn tệp video');
                        return;
                    }

                    const formData = new FormData();
                    formData.append('title', values.title);
                    formData.append('section_id', String(values.section_id));
                    formData.append('order', String(values.order || '0'));
                    formData.append('content', values.content || '');

                    if (videoSourceType === 'UPLOAD') {
                        formData.append('video', selectedFile!);
                        message.loading({ content: 'Đang xử lý video HLS...', key: 'hls-up' });
                    } else {
                        formData.append('video_url', values.video_url);
                        message.loading({ content: 'Đang lưu bài giảng...', key: 'hls-up' });
                    }

                    const data = await videoService.upload(formData);
                    lessonId = data.data.lessonId;
                    message.success({ content: videoSourceType === 'UPLOAD' ? 'Video đang được băm bảo mật...' : 'Đã tải lên thành công!', key: 'hls-up' });
                }

                if (attachmentFile && lessonId) {
                    const attachData = new FormData();
                    attachData.append('attachment', attachmentFile);
                    await videoService.uploadAttachment(lessonId, attachData);
                    message.success('Đã đính kèm tài liệu!');
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
        setEditingLesson(lesson);

        if (lesson.type === 'QUIZ') {
            setLessonType('QUIZ');
            try {
                message.loading({ content: 'Đang tải dữ liệu bài thi...', key: 'quiz-loading' });
                const data = await quizService.getByLesson(lesson.id);
                const quizData = data.data;
                setEditingQuizId(quizData.id);

                setEditingLesson({
                    ...lesson,
                    section_id: selectedSectionId,
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
            setEditingLesson({
                ...lesson,
                section_id: selectedSectionId
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
                <Button
                    type="primary"
                    disabled={!selectedSectionId}
                    onClick={() => {
                        setEditingLesson(null);
                        setEditingQuizId(null);
                        setLessonType('VIDEO');
                        setIsModalOpen(true);
                    }}
                    icon={<Plus size={16} />}
                >
                    Đăng bài giảng mới
                </Button>
            </div>

            <LessonFilter
                courses={courses}
                sections={sections}
                selectedCourseId={selectedCourseId}
                selectedSectionId={selectedSectionId}
                onCourseChange={setSelectedCourseId}
                onSectionChange={setSelectedSectionId}
            />

            <Card className="glass-card">
                {!selectedSectionId ? (
                    <div className={styles.emptyLessonWrapper}>
                        <PlayCircle size={40} className={styles.emptyIcon} />
                        <Text type="secondary" className={styles.emptyText}>Vui lòng chọn Khóa học và Chương để quản lý bài giảng</Text>
                    </div>
                ) : (
                    <LessonTable
                        lessons={lessons}
                        loading={loading}
                        onEdit={startEditing}
                        onDelete={handleDelete}
                    />
                )}
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
