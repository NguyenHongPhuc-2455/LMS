import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/course.service';
import { uploadService } from '../../../services/upload.service';
import { categoryService, type Category } from '../../../services/category.service';
import { departmentService } from '../../../services/department.service';
import { positionService } from '../../../services/position.service';
import { userService } from '../../../services/user.service';

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

    // Pagination states
    const [page, setPage] = useState<number>(1);
    const [pageSize, setPageSize] = useState<number>(10);
    const [totalCourses, setTotalCourses] = useState<number>(0);

    const fetchCourses = useCallback(async () => {
        setLoading(true);
        try {
            const response = await courseService.getAll(
                undefined,
                selectedCategoryId !== null ? selectedCategoryId : undefined,
                includeInactive,
                page,
                pageSize
            );
            if (response && typeof response === 'object' && 'courses' in response) {
                setCourses(response.courses);
                setTotalCourses(response.total);
            } else {
                setCourses(response);
                setTotalCourses(response.length);
            }
        } catch (e) {
            message.error('Lỗi khi tải danh sách khóa học');
        } finally {
            setLoading(false);
        }
    }, [selectedCategoryId, includeInactive, page, pageSize]);

    const fetchStaticData = async () => {
        try {
            const [catData, deptData, posData] = await Promise.all([
                categoryService.getAllCategories(),
                departmentService.getAll(),
                positionService.getAll()
            ]);
            setCategories(catData);
            setDepartments(deptData);
            setPositions(posData);
        } catch (e) {
            message.error('Lỗi khi tải thông tin cấu hình');
        }
    };

    // Load static data once on mount
    useEffect(() => {
        fetchStaticData();
    }, []);

    // Load courses when page, pageSize, selectedCategoryId, or includeInactive changes
    useEffect(() => {
        fetchCourses();
    }, [page, pageSize, selectedCategoryId, includeInactive]);

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
            fetchCourses();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Lỗi lưu khóa học';
            message.error(errorMsg);
            throw error;
        } finally {
            setSubmitting(false);
        }
    };

    const handleStatusChange = useCallback(async (id: number, isPrivate: boolean) => {
        try {
            await courseService.update(id, { is_private: isPrivate });
            message.success('Đã cập nhật trạng thái khóa học');
            fetchCourses();
        } catch (e) {
            message.error('Lỗi khi cập nhật trạng thái');
        }
    }, [fetchCourses]);
    
    const handleToggleActive = useCallback(async (id: number, isActive: boolean) => {
        try {
            await courseService.toggleActive(id, isActive);
            message.success(isActive ? 'Đã khôi phục khóa học thành công' : 'Đã tạm ẩn khóa học thành công');
            fetchCourses();
        } catch (e) {
            message.error('Lỗi khi thay đổi trạng thái');
        }
    }, [fetchCourses]);

    const handleDelete = useCallback(async (id: number) => {
        try {
            await courseService.delete(id);
            message.success('Đã xóa khóa học');
            fetchCourses();
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
            fetchCourses();
        } catch (error) {
            message.error('Lỗi khi xóa hàng loạt');
        } finally {
            setLoading(false);
        }
    }, [selectedRowKeys, fetchCourses]);

    const handleCategoryChange = useCallback(async (courseId: number, categoryId: number | null) => {
        try {
            await courseService.update(courseId, { category_id: categoryId });
            message.success('Đã cập nhật danh mục khóa học');
            fetchCourses();
        } catch (e) {
            message.error('Lỗi khi cập nhật danh mục');
        }
    }, [fetchCourses]);

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
                                onClick={fetchCourses}
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
                            onClick={() => { setEditingCourse(null); setIsModalOpen(true); }}
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
                    onPageChange={(p, ps) => {
                        setPage(p);
                        setPageSize(ps);
                    }}
                    categories={categories}
                    loading={loading}
                    selectedRowKeys={selectedRowKeys}
                    onSelectionChange={setSelectedRowKeys}
                    onEdit={(c) => { setEditingCourse(c); setIsModalOpen(true); }}
                    onStatusChange={handleStatusChange}
                    onCategoryChange={handleCategoryChange}
                    onToggleActive={handleToggleActive}
                    onDelete={handleDelete}
                    onNavigateToSections={(id) => navigate(`/admin/sections?courseId=${id}`)}
                />
            </Card>

            <CourseFormModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onSuccess={handleSave}
                editingId={editingCourse?.id}
                initialValues={editingCourse}
                categories={categories}
                departments={departments}
                positions={positions}
                loading={submitting}
            />
        </div>
    );
}



