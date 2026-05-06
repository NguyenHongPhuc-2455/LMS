import React, { useState, useEffect, useCallback } from 'react';
import { 
    Card, Typography, Button, Space, Breadcrumb, 
    message, Select, Tooltip, Empty 
} from 'antd';
import { 
    ArrowLeftOutlined, 
    PlusOutlined, 
    ReloadOutlined,
    BookOutlined,
    FolderOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';

import { courseService } from '../../../services/course.service';
import { contentService } from '../../../services/content.service';
import { categoryService } from '../../../services/category.service';
import { uploadService } from '../../../services/upload.service';
import { quizService } from '../../../services/quiz.service';

import CourseTable from '../CourseManagement/components/CourseTable';
import CourseFormModal from '../CourseManagement/components/CourseFormModal';
import SectionTable from '../SectionManagement/components/SectionTable';
import SectionFormModal from '../SectionManagement/components/SectionFormModal';
import LessonTable from '../LessonManagement/components/LessonTable';
import LessonFormModal from '../LessonManagement/components/LessonFormModal';

import styles from './UnifiedContent.module.scss';

const { Title, Text } = Typography;
const { Option } = Select;

type ViewMode = 'COURSE' | 'SECTION' | 'LESSON';

const UnifiedContent: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    
    const courseId = searchParams.get('courseId');
    const sectionId = searchParams.get('sectionId');
    const viewMode: ViewMode = sectionId ? 'LESSON' : (courseId ? 'SECTION' : 'COURSE');

    const [categories, setCategories] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    
    // Navigation State for Breadcrumbs
    const [currentCourse, setCurrentCourse] = useState<any>(null);
    const [currentSection, setCurrentSection] = useState<any>(null);
    
    // Data State
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingData, setEditingData] = useState<any>(null);
    const [lessonType, setLessonType] = useState<'VIDEO' | 'QUIZ'>('VIDEO');

    // Fetch Categories
    useEffect(() => {
        categoryService.getAllCategories().then(setCategories).catch(() => message.error('Lỗi tải danh mục'));
    }, []);

    // Sync Breadcrumb Names
    useEffect(() => {
        if (courseId) {
            courseService.getById(Number(courseId)).then(courseData => {
                setCurrentCourse(courseData);
                if (sectionId) {
                    const section = courseData.sections?.find((s: any) => s.id === Number(sectionId));
                    setCurrentSection(section);
                } else {
                    setCurrentSection(null);
                }
            }).catch(() => {});
        } else {
            setCurrentCourse(null);
            setCurrentSection(null);
        }
    }, [courseId, sectionId]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            if (sectionId) {
                const lessonsData = await contentService.getLessonsBySection(Number(sectionId));
                setData(lessonsData || []);
            } else if (courseId) {
                const courseData = await courseService.getById(Number(courseId));
                setData(courseData.sections || []);
            } else {
                const courses = await courseService.getAll('', selectedCategoryId || undefined);
                setData(courses);
            }
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [courseId, sectionId, selectedCategoryId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Navigation Handlers
    const handleCourseClick = (course: any) => {
        setCurrentCourse(course);
        setSearchParams({ courseId: course.id.toString() });
    };

    const handleSectionClick = (section: any) => {
        setCurrentSection(section);
        setSearchParams({ 
            courseId: searchParams.get('courseId')!, 
            sectionId: section.id.toString() 
        });
    };

    const handleBack = () => {
        if (viewMode === 'LESSON') {
            setSearchParams({ courseId: searchParams.get('courseId')! });
        } else if (viewMode === 'SECTION') {
            setSearchParams({});
        }
    };

    const handleBreadcrumbClick = (mode: ViewMode) => {
        if (mode === 'COURSE') setSearchParams({});
        if (mode === 'SECTION') setSearchParams({ courseId: searchParams.get('courseId')! });
    };

    // Modal Handlers
    const handleAdd = () => {
        setEditingData(null);
        setIsModalOpen(true);
    };

    const handleEdit = (record: any) => {
        setEditingData(record);
        if (viewMode === 'LESSON') setLessonType(record.type);
        setIsModalOpen(true);
    };

    const handleDelete = async (record: any) => {
        const id = typeof record === 'object' ? record.id : record;
        try {
            if (viewMode === 'COURSE') await courseService.delete(id);
            else if (viewMode === 'SECTION') await contentService.deleteSection(id);
            else await contentService.deleteLesson(id);
            
            message.success('Đã xóa thành công');
            fetchData();
        } catch (e) {
            message.error('Lỗi khi xóa');
        }
    };

    const handleCourseStatusChange = async (id: number, isPrivate: boolean) => {
        try {
            await courseService.update(id, { is_private: isPrivate });
            message.success('Đã cập nhật trạng thái');
            fetchData();
        } catch (e) {
            message.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const handleCourseCategoryChange = async (id: number, catId: number | null) => {
        try {
            await courseService.update(id, { category_id: catId === -1 ? null : catId });
            message.success('Đã cập nhật danh mục');
            fetchData();
        } catch (e) {
            message.error('Lỗi khi cập nhật danh mục');
        }
    };

    const handleModalSuccess = async (values: any, ...args: any[]) => {
        try {
            if (viewMode === 'COURSE') {
                const thumbFile = args[0];
                let finalThumbnail = values.thumbnail;
                
                if (thumbFile) {
                    const formData = new FormData();
                    formData.append('image', thumbFile);
                    const uploadRes = await uploadService.image(formData);
                    finalThumbnail = uploadRes.url;
                }
                
                const payload = { ...values, thumbnail: finalThumbnail };

                if (editingData) await courseService.update(editingData.id, payload);
                else await courseService.create(payload);
            } else if (viewMode === 'SECTION') {
                if (editingData) await contentService.updateSection(editingData.id, values);
                else await contentService.createSection({ ...values, course_id: Number(searchParams.get('courseId')) });
            } else {
                // Lesson / Quiz logic
                if (lessonType === 'QUIZ') {
                    if (editingData) {
                        await quizService.update(editingData.id, values);
                    } else {
                        await quizService.create({
                            ...values,
                            section_id: Number(searchParams.get('sectionId'))
                        });
                    }
                } else {
                    if (editingData) {
                        const totalDuration = (Number(values.duration_min || 0) * 60) + Number(values.duration_sec || 0);
                        await contentService.updateLesson(editingData.id, {
                            ...values,
                            duration: totalDuration,
                        });
                    } else {
                        const totalDuration = (Number(values.duration_min || 0) * 60) + Number(values.duration_sec || 0);
                        const formData = new FormData();
                        formData.append('title', values.title);
                        formData.append('section_id', searchParams.get('sectionId')!);
                        formData.append('content', values.content || '');
                        formData.append('order', values.order || '0');
                        formData.append('duration', String(totalDuration));
                        
                        if (args[0]) formData.append('video', args[0]); // selectedFile
                        if (args[1]) formData.append('attachment', args[1]); // attachmentFile
                        if (values.video_url) formData.append('video_url', values.video_url);

                        await contentService.createLesson(formData);
                    }
                }
            }
            
            message.success('Đã lưu thành công');
            setIsModalOpen(false);
            fetchData();
        } catch (e) {
            message.error('Lỗi khi lưu dữ liệu');
        }
    };

    // Render Helpers
    const getAddButtonText = () => {
        if (viewMode === 'LESSON') return 'Thêm Bài học mới';
        if (viewMode === 'SECTION') return 'Thêm Chương mới';
        return 'Tạo Khóa học mới';
    };

    return (
        <div className={styles.unifiedContainer}>
            <div className={styles.managementHeader}>
                <div>
                    <Title level={4} className={styles.headerTitle}>Quản lý Nội dung</Title>
                    <Text type="secondary">Gộp chung quản lý Khóa học, Chương học và Bài giảng</Text>
                </div>
            </div>

            <Card className="glass-card">
                <div className={styles.tableToolbar}>
                    <Space size={16} align="center">
                        {viewMode !== 'COURSE' && (
                            <Button 
                                icon={<ArrowLeftOutlined />} 
                                onClick={handleBack}
                                className={styles.backBtn}
                            />
                        )}
                        <Breadcrumb className={styles.breadcrumb}>
                            <Breadcrumb.Item onClick={() => handleBreadcrumbClick('COURSE')} className={styles.clickable}>
                                <BookOutlined /> Khóa học
                            </Breadcrumb.Item>
                            {currentCourse && (
                                <Breadcrumb.Item onClick={() => handleBreadcrumbClick('SECTION')} className={styles.clickable}>
                                    <FolderOutlined /> {currentCourse.title}
                                </Breadcrumb.Item>
                            )}
                            {currentSection && (
                                <Breadcrumb.Item>
                                    <FileTextOutlined /> {currentSection.title}
                                </Breadcrumb.Item>
                            )}
                        </Breadcrumb>
                        <Tooltip title="Làm mới dữ liệu">
                            <Button icon={<ReloadOutlined />} onClick={fetchData} loading={loading} />
                        </Tooltip>
                    </Space>

                    <Space size={16}>
                        {viewMode === 'COURSE' && (
                            <Space>
                                <Text strong>Danh mục:</Text>
                                <Select
                                    placeholder="Tất cả danh mục"
                                    allowClear
                                    style={{ width: 200 }}
                                    value={selectedCategoryId}
                                    onChange={setSelectedCategoryId}
                                >
                                    <Option value={-1}>Trống (Chưa phân mục)</Option>
                                    {categories.map(cat => (
                                        <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                                    ))}
                                </Select>
                            </Space>
                        )}
                        <Button 
                            type="primary" 
                            icon={<PlusOutlined />} 
                            onClick={handleAdd}
                            className={styles.addBtn}
                        >
                            {getAddButtonText()}
                        </Button>
                    </Space>
                </div>

                {loading ? (
                    <div style={{ padding: '100px 0', textAlign: 'center' }}>
                        <ReloadOutlined spin style={{ fontSize: 24, color: '#C72127' }} />
                        <div style={{ marginTop: 16 }}>Đang tải dữ liệu...</div>
                    </div>
                ) : data.length === 0 ? (
                    <Empty 
                        image={Empty.PRESENTED_IMAGE_SIMPLE} 
                        description={
                            <span>
                                {viewMode === 'LESSON' ? 'Chưa có bài giảng nào trong chương này' : 
                                 viewMode === 'SECTION' ? 'Khóa học này chưa có chương nào' : 
                                 'Không tìm thấy dữ liệu'}
                            </span>
                        }
                    >
                        <Button type="primary" onClick={handleAdd}>
                            {getAddButtonText()} ngay
                        </Button>
                    </Empty>
                ) : (
                    <>
                        {viewMode === 'COURSE' && (
                            <CourseTable 
                                courses={data} 
                                categories={categories}
                                loading={loading}
                                onEdit={handleEdit} 
                                onDelete={handleDelete}
                                onNavigateToSections={(id) => handleCourseClick(data.find(c => c.id === id))}
                                onStatusChange={handleCourseStatusChange}
                                onCategoryChange={handleCourseCategoryChange}
                            />
                        )}
                        {viewMode === 'SECTION' && (
                            <SectionTable 
                                sections={data} 
                                loading={loading}
                                onEdit={handleEdit} 
                                onDelete={handleDelete}
                                onNavigateLessons={(sid) => handleSectionClick(data.find(s => s.id === sid))}
                            />
                        )}
                        {viewMode === 'LESSON' && (
                            <LessonTable 
                                lessons={data} 
                                loading={loading}
                                onEdit={handleEdit} 
                                onDelete={handleDelete} 
                            />
                        )}
                    </>
                )}
            </Card>

            {/* Modals */}
            {viewMode === 'COURSE' && (
                <CourseFormModal
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                    editingId={editingData?.id}
                    initialValues={editingData}
                    categories={categories}
                />
            )}
            {viewMode === 'SECTION' && (
                <SectionFormModal
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                    editingId={editingData?.id}
                    initialValues={editingData || { order: data.length }}
                />
            )}
            {viewMode === 'LESSON' && (
                <LessonFormModal
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                    editingId={editingData?.id}
                    initialValues={editingData || { section_id: Number(sectionId), order: data.length }}
                    sections={currentSection ? [currentSection] : []} // Only the current section context
                    lessonType={lessonType}
                    setLessonType={setLessonType}
                />
            )}
        </div>
    );
};

export default UnifiedContent;
