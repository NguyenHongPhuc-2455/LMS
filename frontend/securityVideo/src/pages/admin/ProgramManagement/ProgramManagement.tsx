import { useEffect, useState } from 'react';
import {
    Card, Button, Input, Typography,
    message
} from 'antd';
import { Plus } from 'lucide-react';
import { SearchOutlined } from '@ant-design/icons';
import { programService } from '../../../services/program.service';
import { courseService } from '../../../services/course.service';
import { uploadService } from '../../../services/upload.service';

import styles from './ProgramManagement.module.scss';

// New specialized components
import ProgramTable from './components/ProgramTable';
import ProgramFormModal from './components/ProgramFormModal';
import ProgramCourseDrawer from './components/ProgramCourseDrawer';

const { Title, Text } = Typography;

interface Course {
    id: number;
    title: string;
    thumbnail: string;
    level: string;
}

interface Program {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    status: string;
    is_private: boolean;
    created_at: string;
    instructor: { full_name: string };
    courses: { order: number; course: Course }[];
    _count: { enrollments: number; courses: number };
}

export default function ProgramManagement() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCourseDrawerOpen, setIsCourseDrawerOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [searchText, setSearchText] = useState('');
    const [addingCourseId, setAddingCourseId] = useState<number | null>(null);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const data = await programService.getAll();
            setPrograms(data);
        } catch {
            message.error('Lỗi khi tải danh sách chương trình học');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllCourses = async () => {
        try {
            const data = await courseService.getAll();
            setAllCourses(data);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchPrograms();
        fetchAllCourses();
    }, []);

    const handleSave = async (values: any, thumbFile: File | null): Promise<void> => {
        try {
            let finalThumbnail = values.thumbnail;
            if (thumbFile) {
                const fd = new FormData();
                fd.append('image', thumbFile);
                const up = await uploadService.image(fd);
                finalThumbnail = up.url;
            }

            const payload = { ...values, thumbnail: finalThumbnail };
            if (editingProgram) {
                await programService.update(editingProgram.id, payload);
                message.success('Đã cập nhật chương trình học!');
            } else {
                await programService.create(payload);
                message.success('Đã tạo chương trình học mới!');
            }

            setIsModalOpen(false);
            setEditingProgram(null);
            fetchPrograms();
        } catch {
            message.error('Lỗi khi lưu chương trình học');
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await programService.delete(id);
            message.success('Đã xóa chương trình học');
            fetchPrograms();
        } catch {
            message.error('Lỗi khi xóa');
        }
    };

    const handleAddCourse = async (courseId: number) => {
        if (!selectedProgram) return;
        setAddingCourseId(courseId);
        try {
            await programService.addCourse(selectedProgram.id, courseId);
            message.success('Đã thêm khóa học vào chương trình');
            const data = await programService.getAll();
            setPrograms(data);
            setSelectedProgram(data.find((p: Program) => p.id === selectedProgram.id) || null);
        } catch {
            message.error('Lỗi khi thêm khóa học');
        } finally {
            setAddingCourseId(null);
        }
    };

    const handleRemoveCourse = async (courseId: number) => {
        if (!selectedProgram) return;
        try {
            await programService.removeCourse(selectedProgram.id, courseId);
            message.success('Đã xóa khóa học khỏi chương trình');
            const data = await programService.getAll();
            setPrograms(data);
            setSelectedProgram(data.find((p: Program) => p.id === selectedProgram.id) || null);
        } catch {
            message.error('Lỗi khi xóa khóa học');
        }
    };

    const handleReorder = async (direction: 'up' | 'down', index: number) => {
        if (!selectedProgram) return;
        const currentCourses = [...selectedProgram.courses].sort((a, b) => a.order - b.order);
        const newIndex = direction === 'up' ? index - 1 : index + 1;

        if (newIndex < 0 || newIndex >= currentCourses.length) return;

        // Swap
        const [moved] = currentCourses.splice(index, 1);
        currentCourses.splice(newIndex, 0, moved);

        // Map to new order
        const payload = currentCourses.map((c, idx) => ({
            courseId: c.course.id,
            order: idx
        }));

        try {
            await programService.reorderCourses(selectedProgram.id, payload);
            message.success('Đã cập nhật thứ tự');
            const data = await programService.getAll();
            setPrograms(data);
            const fresh = data.find((p: Program) => p.id === selectedProgram.id);
            setSelectedProgram(fresh || null);
        } catch {
            message.error('Lỗi khi sắp xếp');
        }
    };

    const filtered = programs.filter(p => p.title.toLowerCase().includes(searchText.toLowerCase()));

    const currentCourseIds = selectedProgram?.courses.map(pc => pc.course.id) || [];
    const availableCourses = allCourses.filter(c => !currentCourseIds.includes(c.id));

    return (
        <div className={styles.programManagementContainer}>
            <div className={styles.pageHeader}>
                <div className={styles.headerInfo}>
                    <Title level={4} className={styles.title}>Quản lý Chương trình học</Title>
                    <Text type="secondary">Gom nhiều khóa học thành lộ trình đào tạo</Text>
                </div>
                <Button type="primary" icon={<Plus size={16} />}
                    onClick={() => { setEditingProgram(null); setIsModalOpen(true); }}>
                    Chương trình mới
                </Button>
            </div>

            <Card className="glass-card">
                <div className={styles.searchBarWrapper}>
                    <Input placeholder="Tìm kiếm chương trình..." prefix={<SearchOutlined />}
                        value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 300 }} size="small" />
                </div>
                <ProgramTable
                    programs={filtered}
                    loading={loading}
                    onEdit={(p) => { setEditingProgram(p); setIsModalOpen(true); }}
                    onDelete={handleDelete}
                    onOpenCourseDrawer={(p) => { setSelectedProgram(p); setIsCourseDrawerOpen(true); }}
                    onRefresh={fetchPrograms}
                />
            </Card>

            <ProgramFormModal
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onSuccess={handleSave}
                editingId={editingProgram?.id}
                initialValues={editingProgram}
            />

            <ProgramCourseDrawer
                open={isCourseDrawerOpen}
                onClose={() => setIsCourseDrawerOpen(false)}
                program={selectedProgram}
                availableCourses={availableCourses}
                addingCourseId={addingCourseId}
                onAddCourse={handleAddCourse}
                onRemoveCourse={handleRemoveCourse}
                onReorder={handleReorder}
            />
        </div>
    );
}

