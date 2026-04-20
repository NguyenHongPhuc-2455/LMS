import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { courseService } from '../../../services/course.service';
import { contentService } from '../../../services/content.service';

import { Plus } from 'lucide-react';
import {
    Card, Button, Select, Typography,
    message
} from 'antd';
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
    const [courses, setCourses] = useState<Course[]>([]);
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editingSection, setEditingSection] = useState<any>(null);

    const fetchCourses = async () => {
        try {
            const data = await courseService.getAll();
            setCourses(data);
        } catch (e) { message.error('Lỗi tải danh sách khóa học'); }
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
        fetchCourses();
        const courseIdFromUrl = searchParams.get('courseId');
        if (courseIdFromUrl) {
            setSelectedCourseId(Number(courseIdFromUrl));
        }
    }, [searchParams]);

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
                <Button
                    type="primary"
                    disabled={!selectedCourseId}
                    onClick={() => { setEditingId(null); setEditingSection(null); setIsModalOpen(true); }}
                    icon={<Plus size={16} />}
                >
                    Thêm chương mới
                </Button>
            </div>

            <Card className="glass-card">
                <div className={styles.courseSelectorWrapper}>
                    <Text strong>Chọn khóa học:</Text>
                    <Select
                        showSearch
                        placeholder="Chọn khóa học để xem chương..."
                        className={styles.courseSelect}
                        size="small"
                        value={selectedCourseId}
                        onChange={(v) => setSelectedCourseId(v)}
                        optionFilterProp="children"
                        filterOption={(input, option) =>
                            (option?.children as unknown as string).toLowerCase().includes(input.toLowerCase())
                        }
                    >
                        {courses.map(c => <Option key={c.id} value={c.id}>{c.title}</Option>)}
                    </Select>
                </div>

                <SectionTable
                    sections={sections}
                    loading={loading}
                    courseSelected={!!selectedCourseId}
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


