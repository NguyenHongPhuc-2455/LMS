import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/course.service';
import { contentService } from '../../../services/content.service';

import { Plus } from 'lucide-react';
import {
    Card, Button, Select, Typography, Space,
    message, Tooltip
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { categoryService } from '../../../services/category.service';
import styles from './SectionManagement.module.scss';

// New specialized components
import SectionTable from './components/SectionTable';
import SectionFormModal from './components/SectionFormModal';

const { Title, Text } = Typography;
const { Option } = Select;

interface Section {
    id: number;
    title: string;
    order: number;
    lessons?: any[];
}

interface Course {
    id: number;
    title: string;
}

export default function SectionManagement() {
    const [categories, setCategories] = useState<any[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingCategories] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingSection, setEditingSection] = useState<any>(null);


    const fetchCourses = async (categoryId: number) => {
        setLoadingCourses(true);
        try {
            const data = await courseService.getAll('', categoryId);
            setCourses(data);
        } catch (e) { message.error('Lỗi tải danh sách khóa học'); }
        finally { setLoadingCourses(false); }
    };

    const fetchSections = async (courseId: number) => {
        setLoading(true);
        try {
            const data = await courseService.getById(courseId);
            setSections(data.sections || []);
        } catch (e) {
            message.error('Lỗi tải danh chương');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const initFromUrl = async () => {
            const allCategories = await categoryService.getAllCategories().catch(() => []);
            setCategories(allCategories);

            const cId = searchParams.get('courseId');
            if (cId) {
                const courseData = await courseService.getById(cId).catch(() => null);
                if (courseData) {
                    const catId = courseData.category?.id;
                    if (catId) {
                        setSelectedCategoryId(catId);
                        const coursesData = await courseService.getAll('', catId).catch(() => []);
                        setCourses(coursesData);
                    }
                    setSelectedCourseId(Number(cId));
                    // fetchSections will be triggered by selectedCourseId useEffect
                }
            }
        };
        initFromUrl();
    }, []);

    useEffect(() => {
        if (selectedCategoryId) {
            fetchCourses(selectedCategoryId);
            setSelectedCourseId(null);
            setSections([]);
        }
    }, [selectedCategoryId]);

    useEffect(() => {
        if (selectedCourseId) {
            fetchSections(selectedCourseId);
        } else {
            setSections([]);
        }
    }, [selectedCourseId]);

    const handleSave = async (values: any) => {
        if (!selectedCourseId) return;
        try {
            if (editingId) {
                await contentService.updateSection(editingId, values);
                message.success('Đã cập nhật chương!');
            } else {
                await contentService.createSection({ ...values, course_id: selectedCourseId });
                message.success('Đã tạo chương mới!');
            }

            setIsModalOpen(false);
            setEditingId(null);
            setEditingSection(null);
            fetchSections(selectedCourseId);
        } catch (e) { message.error('Lỗi lưu chương'); }
    };

    const handleDelete = async (id: number) => {
        try {
            await contentService.deleteSection(id);
            message.success('Đã xóa chương');
            if (selectedCourseId) fetchSections(selectedCourseId);
        } catch (e) { message.error('Lỗi xóa chương'); }
    };

    return (
        <div className={styles.sectionManagementContainer}>
            <div className={styles.sectionManagementHeader}>
                <div>
                    <Title level={4} className={styles.headerTitle}>Quản lý Chương Học</Title>
                    <Text type="secondary">Phân bổ cấu trúc bài học cho từng khóa</Text>
                </div>
            </div>

            <Card className="glass-card">
                <div className={styles.courseSelectorWrapper}>
                    <Space size={20} wrap>
                        <Space size={8}>
                            <Text strong>Danh mục:</Text>
                            <Select
                                placeholder="Chọn danh mục"
                                style={{ width: 180 }}
                                onChange={setSelectedCategoryId}
                                loading={loadingCategories}
                                showSearch
                                optionFilterProp="children"
                                value={selectedCategoryId}
                            >
                                <Option value={-1}>Trống (Không danh mục)</Option>
                                {categories.map(cat => (
                                    <Option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </Option>
                                ))}
                            </Select>
                        </Space>

                        <Space size={8}>
                            <Text strong>Khóa học:</Text>
                            <Select
                                showSearch
                                placeholder={selectedCategoryId ? "Chọn khóa học" : "Chọn danh mục trước"}
                                style={{ width: 220 }}
                                value={selectedCourseId}
                                loading={loadingCourses}
                                disabled={!selectedCategoryId}
                                onChange={(v) => setSelectedCourseId(v)}
                                optionFilterProp="children"
                            >
                                {courses.map(c => <Option key={c.id} value={c.id}>{c.title}</Option>)}
                            </Select>
                        </Space>

                        <Tooltip title="Làm mới dữ liệu">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => selectedCourseId && fetchSections(selectedCourseId)}
                                loading={loading}
                                disabled={!selectedCourseId}
                            />
                        </Tooltip>

                        <Button
                            type="primary"
                            disabled={!selectedCourseId}
                            onClick={() => { setEditingId(null); setEditingSection(null); setIsModalOpen(true); }}
                            icon={<Plus size={16} />}
                            className={styles.adminAddButton}
                        >
                            Thêm chương mới
                        </Button>
                    </Space>
                </div>

                <SectionTable
                    sections={sections}
                    loading={loading}
                    onEdit={(s) => { setEditingId(s.id); setEditingSection(s); setIsModalOpen(true); }}
                    onDelete={handleDelete}
                    onNavigateLessons={(sid) => navigate(`/admin/lessons?courseId=${selectedCourseId}&sectionId=${sid}`)}
                />
            </Card>

            <SectionFormModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onSuccess={handleSave}
                editingId={editingId}
                initialValues={editingSection}
            />
        </div>
    );
}


