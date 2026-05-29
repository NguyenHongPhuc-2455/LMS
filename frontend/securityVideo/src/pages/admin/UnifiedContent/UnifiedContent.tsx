import React, { useState, useEffect, useCallback, startTransition } from 'react';
import { 
    Card, Typography, Button, Space, Breadcrumb, 
    App, Select, Tooltip, Empty, 
    Popconfirm, Skeleton
} from 'antd';
import { 
    ArrowLeftOutlined, 
    PlusOutlined, 
    ReloadOutlined,
    BookOutlined,
    FolderOutlined,
    FileTextOutlined
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';

import { courseService } from '../../../services/course.service';
import { contentService } from '../../../services/content.service';
import { categoryService } from '../../../services/category.service';
import { uploadService } from '../../../services/upload.service';
import { quizService } from '../../../services/quiz.service';
import { departmentService } from '../../../services/department.service';
import { positionService } from '../../../services/position.service';
import { userService } from '../../../services/user.service';
import { ROUTES } from '../../../constants/routes';

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
    const { message } = App.useApp();
    // ✅ Dùng useParams thay vì useSearchParams
    const { courseId, sectionId } = useParams<{ courseId?: string; sectionId?: string }>();
    const navigate = useNavigate();

    const viewMode: ViewMode = sectionId ? 'LESSON' : (courseId ? 'SECTION' : 'COURSE');

    const [categories, setCategories] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [includeInactive, setIncludeInactive] = useState<boolean>(false);
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [total, setTotal] = useState(0);
    
    // Navigation State for Breadcrumbs
    const [currentCourse, setCurrentCourse] = useState<any>(null);
    const [currentSection, setCurrentSection] = useState<any>(null);
    
    // Data State
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingData, setEditingData] = useState<any>(null);
    const [editingQuizId, setEditingQuizId] = useState<number | null>(null);
    const [lessonType, setLessonType] = useState<'VIDEO' | 'QUIZ'>('VIDEO');
    const [submitting, setSubmitting] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

    // Fetch Metadata
    useEffect(() => {
        Promise.all([
            categoryService.getAllCategories(),
            departmentService.getAll(),
            positionService.getAll()
        ]).then(([cats, depts, pos]) => {
            setCategories(cats);
            setDepartments(depts);
            setPositions(pos);
        }).catch(() => message.error('Lỗi tải dữ liệu metadata'));
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

    const lastViewParams = React.useRef({ courseId, sectionId });

    const fetchData = useCallback(async () => {
        setLoading(true);
        // Chỉ reset dữ liệu khi chuyển đổi giữa các chế độ xem (Ví dụ: từ Khóa học sang Chương học)
        if (lastViewParams.current.courseId !== courseId || lastViewParams.current.sectionId !== sectionId) {
            setData([]);
            lastViewParams.current = { courseId, sectionId };
        }
        try {
            if (sectionId) {
                const lessonsData = await contentService.getLessonsBySection(Number(sectionId));
                setData(lessonsData || []);
                setTotal(lessonsData?.length || 0);
            } else if (courseId) {
                const courseData = await courseService.getById(Number(courseId));
                setData(courseData.sections || []);
                setTotal(courseData.sections?.length || 0);
            } else {
                const response = await courseService.getAll('', selectedCategoryId || undefined, includeInactive, page, pageSize);
                if (response && response.courses) {
                    setData(response.courses);
                    setTotal(response.total);
                } else {
                    setData(response as any);
                    setTotal((response as any)?.length || 0);
                }
            }
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [courseId, sectionId, selectedCategoryId, includeInactive, page, pageSize]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handlePageChange = useCallback((newPage: number, newPageSize: number) => {
        startTransition(() => {
            setPage(newPage);
            setPageSize(newPageSize);
        });
    }, []);

    const handleCourseClick = useCallback((course: any) => {
        setCurrentCourse(course);
        navigate(`${ROUTES.ADMIN_COURSES}/${course.id}/sections`);
    }, [navigate]);

    const handleNavigateToSections = useCallback((id: number) => {
        const course = data.find(c => c.id === id);
        if (course) handleCourseClick(course);
    }, [data, handleCourseClick]);

    const handleSectionClick = useCallback((section: any) => {
        setCurrentSection(section);
        navigate(`${ROUTES.ADMIN_COURSES}/${courseId}/sections/${section.id}/lessons`);
    }, [navigate, courseId]);

    const handleBack = useCallback(() => {
        if (viewMode === 'LESSON') {
            navigate(`${ROUTES.ADMIN_COURSES}/${courseId}/sections`);
        } else if (viewMode === 'SECTION') {
            setPage(1);
            navigate(ROUTES.ADMIN_COURSES);
        }
    }, [viewMode, navigate, courseId]);

    const handleBreadcrumbClick = useCallback((mode: ViewMode) => {
        if (mode === 'COURSE') {
            setPage(1);
            navigate(ROUTES.ADMIN_COURSES);
        }
        if (mode === 'SECTION') navigate(`${ROUTES.ADMIN_COURSES}/${courseId}/sections`);
    }, [navigate, courseId]);

    // Modal Handlers
    const handleAdd = useCallback(() => {
        setEditingData(null);
        setEditingQuizId(null);
        setLessonType('VIDEO');
        setIsModalOpen(true);
    }, []);

    const handleEdit = useCallback(async (record: any) => {
        if (viewMode === 'LESSON' && record.type === 'QUIZ') {
            try {
                message.loading({ content: 'Đang tải dữ liệu bài thi...', key: 'quiz-loading' });
                const quizRes = await quizService.getByLesson(record.id);
                const quizData = quizRes.data;
                
                setEditingQuizId(quizData.id);
                setEditingData({
                    ...record,
                    description: quizData.description,
                    pass_score: quizData.pass_score,
                    time_limit: quizData.time_limit,
                    questions: quizData.questions || []
                });
                setLessonType('QUIZ');
                message.success({ content: 'Hoàn tất', key: 'quiz-loading', duration: 1 });
            } catch (e) {
                message.error({ content: 'Không tải được nội dung bài thi', key: 'quiz-loading' });
                setEditingData(record);
                setEditingQuizId(null);
                setLessonType('QUIZ');
            }
        } else {
            if (viewMode === 'LESSON') {
                setEditingData({
                    ...record,
                    duration_min: record.duration ? Math.floor(record.duration / 60) : 0,
                    duration_sec: record.duration ? (record.duration % 60) : 0,
                });
                setLessonType(record.type);
            } else {
                setEditingData(record);
            }
            setEditingQuizId(null);
        }
        setIsModalOpen(true);
    }, [viewMode, message]);

    const handleDelete = useCallback(async (record: any) => {
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
    }, [viewMode, message, fetchData]);

    const handleBulkDelete = async () => {
        if (selectedRowKeys.length === 0) return;
        
        setLoading(true);
        try {
            const ids = selectedRowKeys.map(key => Number(key));
            if (viewMode === 'COURSE') {
                await courseService.batchDelete(ids);
                message.success(`Đã xóa thành công ${selectedRowKeys.length} khóa học`);
            }
            setSelectedRowKeys([]);
            fetchData();
        } catch (error) {
            message.error('Lỗi khi xóa hàng loạt');
        } finally {
            setLoading(false);
        }
    };

    const handleCourseStatusChange = useCallback(async (id: number, isPrivate: boolean) => {
        setUpdatingId(id);
        try {
            await courseService.update(id, { is_private: isPrivate });
            setData(prev => prev.map(c => c.id === id ? { ...c, is_private: isPrivate } : c));
            message.success('Đã cập nhật trạng thái');
        } catch (e) {
            message.error('Lỗi khi cập nhật trạng thái');
        } finally {
            setUpdatingId(null);
        }
    }, [message]);

    const handleCourseToggleActive = useCallback(async (id: number, isActive: boolean) => {
        setUpdatingId(id);
        try {
            await courseService.toggleActive(id, isActive);
            setData(prev => prev.map(c => c.id === id ? { ...c, deleted_at: isActive ? null : new Date().toISOString() } : c));
            message.success(isActive ? 'Đã khôi phục khóa học' : 'Đã tạm ẩn khóa học');
        } catch (e) {
            message.error('Lỗi khi thay đổi trạng thái');
        } finally {
            setUpdatingId(null);
        }
    }, [message]);

    const handleCourseCategoryChange = useCallback(async (id: number, catId: number | null) => {
        setUpdatingId(id);
        const resolvedCatId = catId === -1 ? null : catId;
        try {
            await courseService.update(id, { category_id: resolvedCatId });
            setData(prev => prev.map(c => c.id === id ? { ...c, category_id: resolvedCatId } : c));
            message.success('Đã cập nhật danh mục');
        } catch (e) {
            message.error('Lỗi khi cập nhật danh mục');
        } finally {
            setUpdatingId(null);
        }
    }, [message]);

    const handleModalSuccess = useCallback(async (values: any, ...args: any[]) => {
        setSubmitting(true);
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
                else await contentService.createSection({ ...values, course_id: Number(courseId) });
            } else {
                // Lesson / Quiz logic
                if (lessonType === 'QUIZ') {
                    if (editingQuizId) {
                        await quizService.update(editingQuizId, values);
                    } else {
                        await quizService.create({
                            ...values,
                            section_id: Number(sectionId)
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
                        formData.append('section_id', String(values.section_id || sectionId));
                        formData.append('content', values.content || '');
                        formData.append('order', String(values.order || '0'));
                        formData.append('duration', String(totalDuration));
                        formData.append('anti_seek', String(values.anti_seek !== undefined ? values.anti_seek : true));

                        if (values.attachment_url) {
                            formData.append('attachment_url', values.attachment_url);
                        }

                        // Determine video source type
                        const videoSourceType = values.video_url ? 'LINK' : 'UPLOAD';
                        if (videoSourceType === 'UPLOAD') {
                            if (args[0]) {
                                formData.append('video', args[0]); // selectedFile
                            } else if (values.hls_video_url) {
                                formData.append('hls_video_url', values.hls_video_url);
                            }
                        } else {
                            formData.append('video_url', values.video_url);
                        }

                        const data = await contentService.createLesson(formData);
                        
                        // Upload attachment file if selected
                        const newLessonId = data.data?.lessonId;
                        if (newLessonId && args[1]) { // attachmentFile
                            const attachData = new FormData();
                            attachData.append('attachment', args[1]);
                            await contentService.uploadAttachment(newLessonId, attachData);
                        }
                    }
                }
            }
            
            message.success('Đã lưu thành công');
            setIsModalOpen(false);
            fetchData();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Lỗi khi lưu dữ liệu';
            message.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    }, [viewMode, editingData, editingQuizId, lessonType, courseId, sectionId, message, fetchData]);

    // Render Helpers
    const getAddButtonText = useCallback(() => {
        if (viewMode === 'LESSON') return 'Thêm Bài học mới';
        if (viewMode === 'SECTION') return 'Thêm Chương mới';
        return 'Tạo Khóa học mới';
    }, [viewMode]);

    const isFirstLoad = loading && data.length === 0;

    if (isFirstLoad) {
        return (
            <div className={styles.unifiedContainer}>
                <Card className="glass-card" style={{ minHeight: 680 }}>
                    {/* Header Toolbar Skeleton */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
                        <Space size={16}>
                            <Skeleton.Button active style={{ width: 40, height: 32, borderRadius: 5 }} />
                            <Skeleton.Input active style={{ width: 180, height: 32, borderRadius: 5 }} />
                            <Skeleton.Button active style={{ width: 40, height: 32, borderRadius: 5 }} />
                        </Space>
                        <Space size={16}>
                            <Skeleton.Input active style={{ width: 160, height: 32, borderRadius: 5 }} />
                            <Skeleton.Input active style={{ width: 140, height: 32, borderRadius: 5 }} />
                            <Skeleton.Button active style={{ width: 140, height: 32, borderRadius: 5 }} />
                        </Space>
                    </div>
                    {/* Table Headers Skeleton */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
                        <Skeleton.Input active size="small" style={{ width: '15%', height: 20 }} />
                        <Skeleton.Input active size="small" style={{ width: '25%', height: 20 }} />
                        <Skeleton.Input active size="small" style={{ width: '20%', height: 20 }} />
                        <Skeleton.Input active size="small" style={{ width: '15%', height: 20 }} />
                        <Skeleton.Input active size="small" style={{ width: '15%', height: 20 }} />
                    </div>
                    {/* Table Rows Skeleton */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 16 }}>
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                                <Skeleton.Input active size="small" style={{ width: '12%', height: 16 }} />
                                <Skeleton.Input active size="small" style={{ width: '22%', height: 16 }} />
                                <Skeleton.Input active size="small" style={{ width: '18%', height: 16 }} />
                                <Skeleton.Input active size="small" style={{ width: '12%', height: 16 }} />
                                <Skeleton.Input active size="small" style={{ width: '10%', height: 16 }} />
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className={styles.unifiedContainer}>
            {/* <div className={styles.managementHeader}>
                <div>
                    <Title level={4} className={styles.headerTitle}>Quản lý Nội dung</Title>
                    <Text type="secondary">Gộp chung quản lý Khóa học, Chương học và Bài giảng</Text>
                </div>
            </div> */}

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
                        <Breadcrumb 
                            className={styles.breadcrumb}
                            items={[
                                {
                                    title: (
                                        <span onClick={() => handleBreadcrumbClick('COURSE')} style={{ cursor: 'pointer' }}>
                                            <BookOutlined /> Khóa học
                                        </span>
                                    ),
                                },
                                ...(currentCourse ? [{
                                    title: (
                                        <span onClick={() => handleBreadcrumbClick('SECTION')} style={{ cursor: 'pointer' }}>
                                            <FolderOutlined /> {currentCourse.title}
                                        </span>
                                    ),
                                }] : []),
                                ...(currentSection ? [{
                                    title: (
                                        <span>
                                            <FileTextOutlined /> {currentSection.title}
                                        </span>
                                    ),
                                }] : [])
                            ]}
                        />
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
                                <Select
                                    placeholder="Trạng thái"
                                    style={{ width: 160 }}
                                    value={includeInactive}
                                    onChange={setIncludeInactive}
                                    options={[
                                        { value: false, label: 'Đang mở' },
                                        { value: true, label: 'Tất cả (gồm đã đóng)' }
                                    ]}
                                />
                            </Space>
                        )}
                        {viewMode === 'COURSE' && selectedRowKeys.length > 0 && (
                            <Popconfirm
                                title={`Xóa vĩnh viễn ${selectedRowKeys.length} khóa học đã chọn?`}
                                onConfirm={handleBulkDelete}
                                okText="Xóa ngay"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    danger
                                    loading={loading}
                                >
                                    Xóa {selectedRowKeys.length} đã chọn
                                </Button>
                            </Popconfirm>
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

                {(!loading && data.length === 0) ? (
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
                                total={total}
                                page={page}
                                pageSize={pageSize}
                                onPageChange={handlePageChange}
                                categories={categories}
                                loading={loading && data.length === 0}
                                updatingId={updatingId}
                                selectedRowKeys={selectedRowKeys}
                                onSelectionChange={setSelectedRowKeys}
                                onEdit={handleEdit} 
                                onDelete={handleDelete}
                                onNavigateToSections={handleNavigateToSections}
                                onStatusChange={handleCourseStatusChange}
                                onCategoryChange={handleCourseCategoryChange}
                                onToggleActive={handleCourseToggleActive}
                                
                            />
                        )}
                        {viewMode === 'SECTION' && (
                            <SectionTable 
                                sections={data} 
                                loading={loading}
                                onEdit={handleEdit} 
                                onDelete={handleDelete}
                                onNavigateLessons={handleSectionClick}
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
            {viewMode === 'COURSE' && isModalOpen && (
                <CourseFormModal
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                    editingId={editingData?.id}
                    initialValues={editingData}
                    categories={categories}
                    departments={departments}
                    positions={positions}
                    loading={submitting}
                />
            )}
            {viewMode === 'SECTION' && isModalOpen && (
                <SectionFormModal
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                    editingId={editingData?.id}
                    initialValues={editingData || { order: data.length }}
                    loading={submitting}
                />
            )}
            {viewMode === 'LESSON' && isModalOpen && (
                <LessonFormModal
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                    editingId={editingData?.id}
                    initialValues={editingData || { section_id: Number(sectionId), order: data.length }}
                    sections={currentSection ? [currentSection] : []}
                    lessonType={lessonType}
                    setLessonType={setLessonType}
                    loading={submitting}
                />
            )}
        </div>
    );
};

export default UnifiedContent;
