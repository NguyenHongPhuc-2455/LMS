import React, { useEffect, useState, useCallback, useMemo, useRef, startTransition } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/course.service';
import { uploadService } from '../../../services/upload.service';
import { categoryService, type Category } from '../../../services/category.service';
import { departmentService } from '../../../services/department.service';
import { positionService } from '../../../services/position.service';
import {
    Plus, Trash2
} from 'lucide-react';
import {
    Card, Button, Input, Typography,
    message, Tooltip, Space, Select,
    Popconfirm
} from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import styles from './CourseManagement.module.scss';

import { type Course } from '../../../types/course';

// New specialized components
import CourseTable from './components/CourseTable';
import CourseFormModal from './components/CourseFormModal';

const { Title, Text } = Typography;

export default function CourseManagement() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [includeInactive, setIncludeInactive] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const navigate = useNavigate();

    // Pagination & filter states
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalCourses, setTotalCourses] = useState<number>(0);
    const [sortField, setSortField] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<'ascend' | 'descend' | null>(null);
    const [privateFilter, setPrivateFilter] = useState<boolean | null>(null);
    const [activeFilter, setActiveFilter] = useState<boolean | null>(null);
    const [levelFilter, setLevelFilter] = useState<string[] | null>(null);

    // Cache dùng ref để không trigger re-render và không vào dependency array
    const pageCacheRef = useRef<Record<string, { courses: Course[]; total: number }>>({});

    const queryKey = useMemo(() => JSON.stringify({
        selectedCategoryId,
        includeInactive,
        page,
        pageSize,
        sortField,
        sortOrder,
        privateFilter,
        activeFilter,
        levelFilter
    }), [selectedCategoryId, includeInactive, page, pageSize, sortField, sortOrder, privateFilter, activeFilter, levelFilter]);

    const fetchCourses = useCallback(async (invalidate = false) => {
        if (invalidate) pageCacheRef.current = {};

        const cached = pageCacheRef.current[queryKey];
        if (cached) {
            setCourses(cached.courses);
            setTotalCourses(cached.total);
            return;
        }

        setLoading(true);
        try {
            const response = await courseService.getAll(
                undefined,
                selectedCategoryId !== null ? selectedCategoryId : undefined,
                includeInactive,
                page,
                pageSize,
                { sortField, sortOrder, privateFilter, activeFilter, levelFilter }
            );

            const normalized = (response && typeof response === 'object' && 'courses' in response)
                ? { courses: response.courses, total: response.total }
                : { courses: response as Course[], total: (response as Course[]).length };

            setCourses(normalized.courses);
            setTotalCourses(normalized.total);
            pageCacheRef.current[queryKey] = normalized;
        } catch {
            message.error('Lỗi khi tải danh sách khóa học');
        } finally {
            setLoading(false);
        }
    // queryKey đã bao gồm tất cả filter deps — không cần liệt kê lại
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [queryKey]);

    /** Prefetch trang kế tiếp sau khi trang hiện tại đã load xong */
    const prefetchNextPage = useCallback(async () => {
        const nextPage = page + 1;
        if (nextPage * pageSize > totalCourses) return;

        const nextKey = JSON.stringify({
            selectedCategoryId, includeInactive, page: nextPage, pageSize,
            sortField, sortOrder, privateFilter, activeFilter, levelFilter
        });
        if (pageCacheRef.current[nextKey]) return;

        try {
            const response = await courseService.getAll(
                undefined,
                selectedCategoryId !== null ? selectedCategoryId : undefined,
                includeInactive,
                nextPage,
                pageSize,
                { sortField, sortOrder, privateFilter, activeFilter, levelFilter }
            );
            if (response && typeof response === 'object' && 'courses' in response) {
                pageCacheRef.current[nextKey] = { courses: response.courses, total: response.total };
            }
        } catch {
            // prefetch failure không cần báo lỗi
        }
    }, [page, pageSize, totalCourses, selectedCategoryId, includeInactive, sortField, sortOrder, privateFilter, activeFilter, levelFilter]);

    const fetchStaticData = useCallback(async () => {
        try {
            const [catData, deptData, posData] = await Promise.all([
                categoryService.getAllCategories(),
                departmentService.getAll(),
                positionService.getAll()
            ]);
            setCategories(catData);
            setDepartments(deptData);
            setPositions(posData);
        } catch {
            message.error('Lỗi khi tải thông tin cấu hình');
        }
    }, []);

    // Load static data once on mount
    useEffect(() => { fetchStaticData(); }, [fetchStaticData]);

    // Load courses khi queryKey thay đổi
    useEffect(() => { fetchCourses(); }, [fetchCourses]);

    // Prefetch trang kế sau khi courses đã load
    useEffect(() => { prefetchNextPage(); }, [courses, prefetchNextPage]);

    const handleSave = async (values: any, thumbFile: File | null): Promise<void> => {
        setSubmitting(true);
        try {
            let finalThumbnail = values.thumbnail; // Lấy URL từ ô input nếu có

            if (thumbFile) {
                const formData = new FormData();
                formData.append('image', thumbFile);
                const uploadRes = await uploadService.image(formData);
                finalThumbnail = uploadRes.url;
            }

            const payload = { ...values, thumbnail: finalThumbnail };

            if (editingCourse) {
                await courseService.update(editingCourse.id, payload);
                message.success('Đã cập nhật khóa học!');
            } else {
                await courseService.create(payload);
                message.success('Đã tạo khóa học mới!');
            }

            setIsModalOpen(false);
            setEditingCourse(null);
            fetchCourses(true);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Lỗi lưu khóa học';
            message.error(errorMsg);
            throw error;
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = useCallback(async (id: number, isPrivate: boolean) => {
        setUpdatingId(id);
        try {
            await courseService.update(id, { is_private: isPrivate });
            setCourses(prev => prev.map(c => c.id === id ? { ...c, is_private: isPrivate } : c));
            message.success('Đã cập nhật trạng thái khóa học');
        } catch (e) {
            message.error('Lỗi khi cập nhật trạng thái');
        } finally {
            setUpdatingId(null);
        }
    }, []);
    
    const handleToggleActive = useCallback(async (id: number, isActive: boolean) => {
        setUpdatingId(id);
        try {
            await courseService.toggleActive(id, isActive);
            setCourses(prev => prev.map(c => c.id === id ? { ...c, deleted_at: isActive ? null : new Date().toISOString() } : c));
            message.success(isActive ? 'Đã khôi phục khóa học thành công' : 'Đã tạm ẩn khóa học thành công');
        } catch (e) {
            message.error('Lỗi khi thay đổi trạng thái');
        } finally {
            setUpdatingId(null);
        }
    }, []);

    const handleDelete = useCallback(async (id: number) => {
        try {
            await courseService.delete(id);
            message.success('Đã xóa khóa học');
            fetchCourses(true);
        } catch (e) { message.error('Lỗi khi xóa khóa học'); }
    }, [fetchCourses]);

    const handleBulkDelete = useCallback(async () => {
        if (selectedRowKeys.length === 0) return;
        
        setLoading(true);
        try {
            const ids = selectedRowKeys.map(key => Number(key));
            await courseService.batchDelete(ids);
            message.success(`Đã xóa thành công ${selectedRowKeys.length} khóa học`);
            setSelectedRowKeys([]);
            fetchCourses(true);
        } catch (error) {
            message.error('Lỗi khi xóa hàng loạt');
        } finally {
            setLoading(false);
        }
    }, [selectedRowKeys, fetchCourses]);

    const handleCategoryChange = useCallback(async (courseId: number, categoryId: number | null) => {
        setUpdatingId(courseId);
        try {
            await courseService.update(courseId, { category_id: categoryId });
            setCourses(prev => prev.map(c => c.id === courseId ? { ...c, category_id: categoryId } : c));
            message.success('Đã cập nhật danh mục khóa học');
        } catch (e) {
            message.error('Lỗi khi cập nhật danh mục');
        } finally {
            setUpdatingId(null);
        }
    }, []);

    const handlePageChange = useCallback((p: number, ps: number) => {
        startTransition(() => {
            setPage((prev) => (prev === p ? prev : p));
            setPageSize((prev) => (prev === ps ? prev : ps));
        });
    }, []);

    const handleTableChange = useCallback((nextPage: number, nextPageSize: number, payload: {
        sortField?: string;
        sortOrder?: 'ascend' | 'descend' | null;
        privateFilter?: boolean | null;
        activeFilter?: boolean | null;
        levelFilter?: string[] | null;
    }) => {
        startTransition(() => {
            setPage((prev) => (prev === nextPage ? prev : nextPage));
            setPageSize((prev) => (prev === nextPageSize ? prev : nextPageSize));
        });
        setSortField(payload.sortField);
        setSortOrder(payload.sortOrder ?? null);
        setPrivateFilter(payload.privateFilter ?? null);
        setActiveFilter(payload.activeFilter ?? null);
        setLevelFilter(payload.levelFilter ?? null);
    }, []);

    const handleEditCourse = useCallback((c: Course) => {
        setEditingCourse(c);
        setIsModalOpen(true);
    }, []);

    const handleNavigateToSections = useCallback((id: number) => {
        navigate(`/admin/sections?courseId=${id}`);
    }, [navigate]);

    const handleCreateCourse = useCallback(() => {
        setEditingCourse(null);
        setIsModalOpen(true);
    }, []);

    const handleModalCancel = useCallback(() => {
        setIsModalOpen(false);
    }, []);

    return (
        <div className={styles.managementContainer}>
            <div className={styles.managementHeader}>
                <div>
                    <Title level={4} className={styles.headerTitle}>Quản lý Khóa học</Title>
                    <Text type="secondary">Tạo và cấu hình các khóa đào tạo</Text>
                </div>
            </div>

            <Card className="glass-card">
                <div className={styles.tableHeaderActions}>
                    <Space size={8}>
                        <Text strong>Danh mục:</Text>
                        <Select
                            placeholder="Tất cả danh mục"
                            allowClear
                            style={{ width: 180 }}
                            value={selectedCategoryId}
                            onChange={(val) => {
                                setSelectedCategoryId(val);
                                setPage(1); // Reset page về 1 khi đổi bộ lọc danh mục
                            }}
                        >
                            <Select.Option value={-1}>Trống (Không danh mục)</Select.Option>
                            {categories.map(cat => (
                                <Select.Option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </Select.Option>
                            ))}
                        </Select>
                        <Select
                            placeholder="Trạng thái"
                            style={{ width: 140 }}
                            value={includeInactive}
                            onChange={(val) => {
                                setIncludeInactive(val);
                                setPage(1); // Reset page về 1 khi đổi trạng thái hiển thị
                            }}
                            options={[
                                { value: false, label: 'Đang mở' },
                                { value: true, label: 'Tất cả (gồm đã đóng)' }
                            ]}
                        />
                        <Tooltip title="Làm mới dữ liệu">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => fetchCourses(true)}
                                loading={loading}
                            />
                        </Tooltip>
                    </Space>
                    <Space size={12}>
                        {selectedRowKeys.length > 0 && (
                            <Popconfirm
                                title={`Xóa vĩnh viễn ${selectedRowKeys.length} khóa học đã chọn?`}
                                onConfirm={handleBulkDelete}
                                okText="Xóa ngay"
                                cancelText="Hủy"
                                okButtonProps={{ danger: true }}
                            >
                                <Button
                                    danger
                                    icon={<Trash2 size={16} />}
                                    loading={loading}
                                >
                                    Xóa {selectedRowKeys.length} đã chọn
                                </Button>
                            </Popconfirm>
                        )}
                        <Button
                            type="primary"
                            onClick={handleCreateCourse}
                            icon={<Plus size={16} />}
                            className={styles.adminAddButton}
                        >
                            Khóa học mới
                        </Button>
                    </Space>
                </div>
                <CourseTable
                    courses={courses}
                    total={totalCourses}
                    page={page}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                    onTableChange={handleTableChange}
                    categories={categories}
                    loading={loading && courses.length === 0}
                    updatingId={updatingId}
                    selectedRowKeys={selectedRowKeys}
                    onSelectionChange={setSelectedRowKeys}
                    onEdit={handleEditCourse}
                    onStatusChange={handleStatusChange}
                    onCategoryChange={handleCategoryChange}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                    onNavigateToSections={handleNavigateToSections}
                />
            </Card>

            {isModalOpen && (
                <CourseFormModal
                    open={isModalOpen}
                    onCancel={handleModalCancel}
                    onSuccess={handleSave}
                    editingId={editingCourse?.id}
                    initialValues={editingCourse}
                    categories={categories}
                    departments={departments}
                    positions={positions}
                    loading={submitting}
                />
            )}
        </div>
    );
}




