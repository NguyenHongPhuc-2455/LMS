import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    BookOutlined, ClockCircleOutlined,
    RocketOutlined
} from '@ant-design/icons';
import { Card, Badge, Typography, Space, message, Skeleton, Empty, Pagination, Select } from 'antd';
const { Option } = Select;
import api from '../../api';
import './CourseList.scss';

const { Title, Text } = Typography;

interface Course {
    id: number;
    title: string;
    description: string;
    level: string;
    thumbnail: string;
    category?: { name: string };
    instructor?: { full_name: string; username: string };
    is_private: boolean;
    created_at: string;
    _count?: { sections: number };
}

export default function CourseList() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const searchQuery = searchParams.get('search') || '';

    // Phân trang
    const [currentPagePrivate, setCurrentPagePrivate] = useState(1);
    const [currentPagePublic, setCurrentPagePublic] = useState(1);
    const [sortBy, setSortBy] = useState('newest');
    const pageSize = 4;

    useEffect(() => {
        // Reset về trang 1 khi tìm kiếm
        setCurrentPagePrivate(1);
        setCurrentPagePublic(1);
    }, [searchQuery]);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setLoading(true);
                const res = await api.get(`/courses${searchQuery ? `?search=${searchQuery}` : ''}`);
                setCourses(res.data);
            } catch (error) {
                message.error('Lỗi khi tải danh sách khóa học');
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, [searchQuery]);

    if (loading) {
        return (
            <div className="loader-container">
                <Skeleton active paragraph={{ rows: 10 }} />
            </div>
        );
    }

    const sortCourses = (list: Course[]) => {
        const sorted = [...list];
        switch (sortBy) {
            case 'newest':
                sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
                break;
            case 'oldest':
                sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
                break;
            case 'az':
                sorted.sort((a, b) => a.title.localeCompare(b.title));
                break;
            case 'za':
                sorted.sort((a, b) => b.title.localeCompare(a.title));
                break;
            case 'level':
                const levels: Record<string, number> = { 'Cơ bản': 1, 'Trung cấp': 2, 'Nâng cao': 3 };
                sorted.sort((a, b) => (levels[a.level] || 99) - (levels[b.level] || 99));
                break;
        }
        return sorted;
    };

    const publicCourses = sortCourses(courses.filter(c => !c.is_private));
    const privateCourses = sortCourses(courses.filter(c => c.is_private));

    // Dữ liệu hiển thị sau khi phân trang
    const displayedPrivateCourses = privateCourses.slice(
        (currentPagePrivate - 1) * pageSize,
        currentPagePrivate * pageSize
    );
    const displayedPublicCourses = publicCourses.slice(
        (currentPagePublic - 1) * pageSize,
        currentPagePublic * pageSize
    );

    return (
        <div className="course-list-container">
            <div className="sort-wrapper">
                <Space>
                    <span className="sort-label">Sắp xếp theo:</span>
                    <Select
                        defaultValue="newest"
                        className="sort-select"
                        onChange={(val) => setSortBy(val)}
                        popupClassName="sort-select-dropdown"
                    >
                        <Option value="newest">Ngày tạo (Mới nhất)</Option>
                        <Option value="oldest">Ngày tạo (Cũ nhất)</Option>
                        <Option value="az">Tên khóa học (A-Z)</Option>
                        <Option value="za">Tên khóa học (Z-A)</Option>
                        <Option value="level">Trình độ (Tăng dần)</Option>
                    </Select>
                </Space>
            </div>
            {/* Mục Khóa học Riêng tư */}
            {privateCourses.length > 0 && (
                <div className="course-section">
                    <div className="section-header">
                        <Title level={2} className="section-title">
                            Khóa học Riêng tư (Cần phê duyệt)
                        </Title>
                        <Badge count="Yêu cầu" className="badge-private" />
                    </div>
                    <div className="course-grid">
                        {displayedPrivateCourses.map(course => (
                            <CourseCard key={course.id} course={course} navigate={navigate} />
                        ))}
                    </div>
                    {privateCourses.length > pageSize && (
                        <div className="pagination-wrapper">
                            <Pagination
                                current={currentPagePrivate}
                                pageSize={pageSize}
                                total={privateCourses.length}
                                onChange={(page) => setCurrentPagePrivate(page)}
                                showSizeChanger={false}
                                itemRender={(_, type, originalElement) => {
                                    const totalPages = Math.ceil(privateCourses.length / pageSize);
                                    if (type === 'prev') {
                                        return (
                                            <div
                                                onClick={() => currentPagePrivate === 1 && setCurrentPagePrivate(totalPages)}
                                                className="page-item-wrapper"
                                            >
                                                {originalElement}
                                            </div>
                                        );
                                    }
                                    if (type === 'next') {
                                        return (
                                            <div
                                                onClick={() => currentPagePrivate === totalPages && setCurrentPagePrivate(1)}
                                                className="page-item-wrapper"
                                            >
                                                {originalElement}
                                            </div>
                                        );
                                    }
                                    return originalElement;
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {/* Mục Khóa học Công khai */}
            {publicCourses.length > 0 && (
                <div className="course-section">
                    <div className="section-header">
                        <Title level={2} className="section-title">
                            Khóa học cộng đồng (Tự động)
                        </Title>
                    </div>
                    <div className="course-grid">
                        {displayedPublicCourses.map(course => (
                            <CourseCard key={course.id} course={course} navigate={navigate} />
                        ))}
                    </div>
                    {publicCourses.length > pageSize && (
                        <div className="pagination-wrapper">
                            <Pagination
                                current={currentPagePublic}
                                pageSize={pageSize}
                                total={publicCourses.length}
                                onChange={(page) => setCurrentPagePublic(page)}
                                showSizeChanger={false}
                                itemRender={(_, type, originalElement) => {
                                    const totalPages = Math.ceil(publicCourses.length / pageSize);
                                    if (type === 'prev') {
                                        return (
                                            <div
                                                onClick={() => currentPagePublic === 1 && setCurrentPagePublic(totalPages)}
                                                className="page-item-wrapper"
                                            >
                                                {originalElement}
                                            </div>
                                        );
                                    }
                                    if (type === 'next') {
                                        return (
                                            <div
                                                onClick={() => currentPagePublic === totalPages && setCurrentPagePublic(1)}
                                                className="page-item-wrapper"
                                            >
                                                {originalElement}
                                            </div>
                                        );
                                    }
                                    return originalElement;
                                }}
                            />
                        </div>
                    )}
                </div>
            )}

            {courses.length === 0 && (
                <Empty description="Chưa có khóa học nào được đăng tải" />
            )}
        </div>
    );
}

// Tách Card thành component con để tái sử dụng
function CourseCard({ course, navigate }: { course: Course, navigate: any }) {
    return (
        <Card
            hoverable
            className="glass-card course-hover-card"
            cover={
                <div className="course-card-cover">
                    {course.thumbnail ? (
                        <img src={course.thumbnail} alt={course.title} className="thumbnail-img" />
                    ) : (
                        <div className="placeholder-icon-wrapper">
                            <BookOutlined />
                        </div>
                    )}
                </div>
            }
            onClick={() => navigate(`/course/${course.id}`)}
        >
            <div className="course-card-header">
                <Badge status="processing" text={<Text className="level-badge-text">{course.level?.toUpperCase() || 'OFFICIAL'}</Text>} />
                <Title level={5} className="course-title">{course.title}</Title>
            </div>

            <div className="course-card-body-row">
                <Space direction="vertical" size={0} className="creator-info">
                    <Text className="creator-label">Người tạo</Text>
                    <Text strong className="creator-name">{course.instructor?.full_name || 'Hệ thống'}</Text>
                </Space>
                <div className="card-badge-container">
                    <Badge
                        count={course.is_private ? "RIÊNG TƯ" : "CÔNG KHAI"}
                        className={course.is_private ? 'badge-private' : 'badge-public'}
                    />
                </div>
            </div>

            <hr className="course-card-divider" />

            <div className="course-card-footer">
                <Space size={4}><ClockCircleOutlined /> Lộ trình</Space>
                <Space size={4}><RocketOutlined /> {course._count?.sections || 0} chương</Space>
            </div>

        </Card>
    );
}
