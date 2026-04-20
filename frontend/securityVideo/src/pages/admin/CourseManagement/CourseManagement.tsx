import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/course.service';
import { uploadService } from '../../../services/upload.service';

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
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await courseService.getAll();
            setCourses(data);
        } catch (e) {
            message.error('Lỗi khi tải danh sách khóa học');
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

    const handleDelete = async (id: number) => {
        try {
            await courseService.delete(id);
            message.success('Đã xóa khóa học');
            fetchData();
        } catch (e) { message.error('Lỗi khi xóa khóa học'); }
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
                <Button type="primary" onClick={() => { setEditingCourse(null); setIsModalOpen(true); }} icon={<Plus size={16} />}>
                    Khóa học mới
                </Button>
            </div>

            <Card className="glass-card">
                <Input
                    placeholder="Tìm kiếm khóa học..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className={styles.searchInput}
                    size="small"
                />
                <CourseTable
                    courses={filteredCourses}
                    loading={loading}
                    onEdit={(c) => { setEditingCourse(c); setIsModalOpen(true); }}
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
            />
        </div>
    );
}


