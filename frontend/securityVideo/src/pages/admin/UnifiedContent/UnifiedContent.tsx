import React, { useState, useEffect, useCallback } from 'react';
import { 
    Card, Typography, Button, Space, Breadcrumb, 
    App, Select, Tooltip, Empty, 
    Popconfirm
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
    const [users, setUsers] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [includeInactive, setIncludeInactive] = useState<boolean>(false);
    
    // Navigation State for Breadcrumbs
    const [currentCourse, setCurrentCourse] = useState<any>(null);
    const [currentSection, setCurrentSection] = useState<any>(null);
    
    // Data State
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    
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
            positionService.getAll(),
            userService.getAll({ limit: 1000, page: 1 })
        ]).then(([cats, depts, pos, userResp]) => {
            setCategories(cats);
            setDepartments(depts);
            setPositions(pos);
            setUsers(userResp.users || []);
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
                const courses = await courseService.getAll('', selectedCategoryId || undefined, includeInactive);
                setData(courses);
            }
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    }, [courseId, sectionId, selectedCategoryId, includeInactive]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // ✅ Navigation Handlers - Dùng navigate() thay vì setSearchParams()
    const handleCourseClick = (course: any) => {
        setCurrentCourse(course);
        navigate(`${ROUTES.ADMIN_COURSES}/${course.id}/sections`);
    };

    const handleSectionClick = (section: any) => {
        setCurrentSection(section);
        navigate(`${ROUTES.ADMIN_COURSES}/${courseId}/sections/${section.id}/lessons`);
    };

    const handleBack = () => {
        if (viewMode === 'LESSON') {
            navigate(`${ROUTES.ADMIN_COURSES}/${courseId}/sections`);
        } else if (viewMode === 'SECTION') {
            navigate(ROUTES.ADMIN_COURSES);
        }
    };

    const handleBreadcrumbClick = (mode: ViewMode) => {
        if (mode === 'COURSE') navigate(ROUTES.ADMIN_COURSES);
        if (mode === 'SECTION') navigate(`${ROUTES.ADMIN_COURSES}/${courseId}/sections`);
    };

    // Modal Handlers
    const handleAdd = () => {
        setEditingData(null);
        setEditingQuizId(null);
        setLessonType('VIDEO');
        setIsModalOpen(true);
    };

    const handleEdit = async (record: any) => {
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
            setEditingData(record);
            setEditingQuizId(null);
            if (viewMode === 'LESSON') setLessonType(record.type);
        }
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

    const handleCourseStatusChange = async (id: number, isPrivate: boolean) => {
        try {
            await courseService.update(id, { is_private: isPrivate });
            message.success('Đã cập nhật trạng thái');
            fetchData();
        } catch (e) {
            message.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const handleCourseToggleActive = async (id: number, isActive: boolean) => {
        try {
            await courseService.toggleActive(id, isActive);
            message.success(isActive ? 'Đã khôi phục khóa học' : 'Đã tạm ẩn khóa học');
            fetchData();
        } catch (e) {
            message.error('Lỗi khi thay đổi trạng thái');
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
                                selectedRowKeys={selectedRowKeys}
                                onSelectionChange={setSelectedRowKeys}
                                onEdit={handleEdit} 
                                onDelete={handleDelete}
                                onNavigateToSections={(id) => handleCourseClick(data.find(c => c.id === id))}
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
                    departments={departments}
                    positions={positions}
                    users={users}
                    loading={submitting}
                />
            )}
            {viewMode === 'SECTION' && (
                <SectionFormModal
                    open={isModalOpen}
                    onCancel={() => setIsModalOpen(false)}
                    onSuccess={handleModalSuccess}
                    editingId={editingData?.id}
                    initialValues={editingData || { order: data.length }}
                    loading={submitting}
                />
            )}
            {viewMode === 'LESSON' && (
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
