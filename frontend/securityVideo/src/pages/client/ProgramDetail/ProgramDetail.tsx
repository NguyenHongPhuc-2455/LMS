import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Skeleton, message } from 'antd';
import { programService } from '../../../services/program.service';
import { programRequestService } from '../../../services/programRequest.service';
import styles from './ProgramDetail.module.scss';

// Sub-components
import ProgramHero from './components/ProgramHero';
import ProgramCurriculum from './components/ProgramCurriculum';

interface Course {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    instructor: { full_name: string };
    _count: { sections: number; enrollments: number };
}

interface ProgramCourse {
    order: number;
    course: Course;
    isLocked?: boolean;
    progressPercent?: number;
    isFinished?: boolean;
}

interface Program {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    status: string;
    is_private: boolean;
    instructor: { id: number; full_name: string; username: string };
    courses: ProgramCourse[];
    _count: { enrollments: number; courses: number };
    isEnrolled: boolean;
    requestStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
    currentCourseId?: number | null;
    canAccess?: boolean;
    accessReason?: string | null;
}

export default function ProgramDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [program, setProgram] = useState<Program | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const token = localStorage.getItem('accessToken');

    const fetchDetail = async () => {
        try {
            const data = await programService.getById(id!);
            setProgram(data);
        } catch {
            message.error('Không tìm thấy Lộ trình học');
            navigate('/programs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleEnroll = async () => {
        if (!token) { navigate('/login'); return; }
        setEnrolling(true);
        try {
            await programService.enroll(Number(id));
            message.success('Đăng ký Lộ trình học thành công! Tất cả khóa học đã được mở.');
            setProgram(prev => prev ? { ...prev, isEnrolled: true } : prev);
        } catch (err: any) {
            message.error(err?.response?.data?.message || 'Lỗi khi đăng ký');
        } finally {
            setEnrolling(false);
        }
    };

    const handleRequestAccess = async () => {
        if (!token) { navigate('/login'); return; }
        setSubmitting(true);
        try {
            const data = await programRequestService.submitRequest(Number(id));
            message.success(data.message || 'Gửi yêu cầu thành công, vui lòng chờ Admin phê duyệt');
            fetchDetail(); // Refresh status
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Lỗi khi gửi yêu cầu');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className={styles.loadingContainer}><Skeleton active paragraph={{ rows: 12 }} /></div>;
    if (!program) return null;

    const sortedCourses = [...program.courses].sort((a, b) => a.order - b.order);
    const overallProgress = sortedCourses.length > 0 
        ? Math.round(sortedCourses.reduce((acc, pc) => acc + (pc.progressPercent || 0), 0) / sortedCourses.length)
        : 0;

    return (
        <div className={styles.programDetailContainer}>
            <ProgramHero
                program={program}
                handleEnroll={handleEnroll}
                handleRequestAccess={handleRequestAccess}
                enrolling={enrolling}
                submitting={submitting}
                navigate={navigate}
                sortedCourses={sortedCourses}
                overallProgress={overallProgress}
            />

            <ProgramCurriculum
                sortedCourses={sortedCourses}
                program={program}
                navigate={navigate}
            />
        </div>
    );
}


