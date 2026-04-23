import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/course.service';
import { uploadService } from '../../../services/upload.service';
import { categoryService, type Category } from '../../../services/category.service';

import {
    Plus
} from 'lucide-react';
import {
    Card, Button, Input, Typography,
    message
} from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import styles from './CourseManagement.module.scss';

// New specialized components
import CourseTable from './components/CourseTable';
import CourseFormModal from './components/CourseFormModal';

const { Title, Text } = Typography;

interface Course {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    is_private: boolean;
    level: string;
    intro_video_url?: string;
    learning_outcomes?: string;
    requirements?: string;
    category_id?: number | null;
    created_at: string;
    updated_at: string;
    _count?: { sections: number, enrollments: number };
}

export default function CourseManagement() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    const [searchText, setSearchText] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const [courseData, catData] = await Promise.all([
                courseService.getAll(),
                categoryService.getAllCategories()
            ]);
            setCourses(courseData);
            setCategories(catData);
        } catch (e) {
            message.error('Lỗi khi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (values: any, thumbFile: File | null): Promise<void> => {
        try {
            let finalThumbnail = values.thumbnail;

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
            fetchData();
        } catch (e) {
            message.error('Lỗi lưu khóa học');
            throw e;
        }
    };

    const handleStatusChange = async (id: number, isPrivate: boolean) => {
        try {
            await courseService.update(id, { is_private: isPrivate });
            message.success('Đã cập nhật trạng thái khóa học');
            fetchData();
        } catch (e) {
            message.error('Lỗi khi cập nhật trạng thái');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await courseService.delete(id);
            message.success('Đã xóa khóa học');
            fetchData();
        } catch (e) { message.error('Lỗi khi xóa khóa học'); }
    };

    const handleCategoryChange = async (courseId: number, categoryId: number | null) => {
        try {
            await courseService.update(courseId, { category_id: categoryId });
            message.success('Đã cập nhật danh mục khóa học');
            fetchData();
        } catch (e) {
            message.error('Lỗi khi cập nhật danh mục');
        }
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchText.toLowerCase())
    );

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
                    <Input
                        placeholder="Tìm kiếm khóa học..."
                        prefix={<SearchOutlined />}
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className={styles.searchInput}
                        size="small"
                    />
                    <Button
                        type="primary"
                        onClick={() => { setEditingCourse(null); setIsModalOpen(true); }}
                        icon={<Plus size={16} />}
                        className={styles.adminAddButton}
                    >
                        Khóa học mới
                    </Button>
                </div>
                <CourseTable
                    courses={filteredCourses}
                    categories={categories}
                    loading={loading}
                    onEdit={(c) => { setEditingCourse(c); setIsModalOpen(true); }}
                    onStatusChange={handleStatusChange}
                    onCategoryChange={handleCategoryChange}
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
            />
        </div>
    );
}


