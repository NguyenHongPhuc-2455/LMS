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
import { departmentService } from '../../../services/department.service';
import { positionService } from '../../../services/position.service';
import { userService } from '../../../services/user.service';

import styles from './ProgramManagement.module.scss';

// New specialized components
import ProgramTable from './components/ProgramTable';
import ProgramFormModal from './components/ProgramFormModal';
import ProgramCourseDrawer from './components/ProgramCourseDrawer';

const { Title, Text } = Typography;

import { type Course } from '../../../types/course';
import { type Program } from '../../../types/program';

export default function ProgramManagement() {
    const [programs, setPrograms] = useState<Program[]>([]);
    const [allCourses, setAllCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isCourseDrawerOpen, setIsCourseDrawerOpen] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [addingCourseId, setAddingCourseId] = useState<number | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const data = await programService.getAll();
            setPrograms(data);
        } catch {
            message.error('Lỗi khi tải danh sách Lộ trình học');
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

    const fetchMetadata = async () => {
        try {
            const [deptData, posData] = await Promise.all([
                departmentService.getAll(),
                positionService.getAll()
            ]);
            setDepartments(deptData);
            setPositions(posData);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchPrograms();
        fetchAllCourses();
        fetchMetadata();
    }, []);

    const handleSave = async (values: any, thumbFile: File | null): Promise<void> => {
        setSubmitting(true);
        try {
            let finalThumbnail = values.thumbnail; // Lấy URL từ ô input nếu có
            if (thumbFile) {
                const fd = new FormData();
                fd.append('image', thumbFile);
                const up = await uploadService.image(fd);
                finalThumbnail = up.url;
            }

            const payload = { ...values, thumbnail: finalThumbnail };
            if (editingProgram) {
                await programService.update(editingProgram.id, payload);
                message.success('Đã cập nhật Lộ trình học!');
            } else {
                await programService.create(payload);
                message.success('Đã tạo Lộ trình học mới!');
            }

            setIsModalOpen(false);
            setEditingProgram(null);
            fetchPrograms();
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Lỗi khi lưu Lộ trình học';
            message.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await programService.delete(id);
            message.success('Đã xóa Lộ trình học');
            fetchPrograms();
        } catch {
            message.error('Lỗi khi xóa');
        }
    };

    const handleAddCourse = async (courseId: number) => {
        if (!selectedProgram) return;

        // Client-side validation: kiểm tra deadline trước khi gọi API
        const course = allCourses.find(c => c.id === courseId);
        if (
            selectedProgram.is_mandatory &&
            selectedProgram.mandatory_deadline_days != null &&
            course?.is_mandatory &&
            course?.mandatory_deadline_days != null &&
            course.mandatory_deadline_days > selectedProgram.mandatory_deadline_days
        ) {
            message.warning('Khóa học có deadline dài hơn lộ trình');
            return;
        }

        setAddingCourseId(courseId);
        try {
            await programService.addCourse(selectedProgram.id, courseId);
            message.success('Đã thêm khóa học vào chương trình');
            const data = await programService.getAll();
            setPrograms(data);
            setSelectedProgram(data.find((p: Program) => p.id === selectedProgram.id) || null);
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Lỗi khi thêm khóa học';
            message.error(errorMsg);
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
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Lỗi khi xóa khóa học';
            message.error(errorMsg);
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
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Lỗi khi sắp xếp';
            message.error(errorMsg);
        }
    };

    const filtered = programs;

    const currentCourseIds = selectedProgram?.courses.map(pc => pc.course.id) || [];
    const availableCourses = allCourses.filter(c => !currentCourseIds.includes(c.id));

    return (
        <div className={styles.programManagementContainer}>
            <div className={styles.pageHeader}>
                <div className={styles.headerInfo}>
                    <Title level={4} className={styles.title}>Quản lý Lộ trình học</Title>
                    <Text type="secondary">Gom nhiều khóa học thành lộ trình đào tạo</Text>
                </div>
            </div>

            <Card className="glass-card">
                <div className={styles.searchBarWrapper}>
                    <div />
                    <Button
                        type="primary"
                        icon={<Plus size={16} />}
                        onClick={() => { setEditingProgram(null); setIsModalOpen(true); }}
                        className={styles.adminAddButton}
                    >
                        Chương trình mới
                    </Button>
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
                departments={departments}
                positions={positions}
                loading={submitting}
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

