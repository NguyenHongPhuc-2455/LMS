import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../../api';
import {
    Trash2, Plus, Edit, FolderOpen
} from 'lucide-react';
import {
    Card, Button, Input, Select, Space, Typography,
    Table, Modal, Form, message, Popconfirm
} from 'antd';
import './SectionManagement.scss';

const { Title, Text } = Typography;
const { Option } = Select;

interface Section {
    id: number;
    title: string;
    order: number;
    _count?: { lessons: number };
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
    const [form] = Form.useForm();

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
            if (res.data.length > 0 && !selectedCourseId) {
                // Tự động chọn khóa học đầu tiên nếu chưa chọn
                // setSelectedCourseId(res.data[0].id);
            }
        } catch (e) { message.error('Lỗi tải danh sách khóa học'); }
    };

    const fetchSections = async (courseId: number) => {
        setLoading(true);
        try {
            const res = await api.get(`/courses/${courseId}`);
            setSections(res.data.sections || []);
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
                await api.put(`/courses/sections/${editingId}`, values);
                message.success('Đã cập nhật chương!');
            } else {
                await api.post('/courses/sections', { ...values, course_id: selectedCourseId });
                message.success('Đã tạo chương mới!');
            }
            setIsModalOpen(false);
            setEditingId(null);
            form.resetFields();
            fetchSections(selectedCourseId);
        } catch (e) { message.error('Lỗi lưu chương'); }
    };

    const startEditing = (section: any) => {
        setEditingId(section.id);
        form.setFieldsValue({
            title: section.title,
            order: section.order
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/courses/sections/${id}`);
            message.success('Đã xóa chương');
            if (selectedCourseId) fetchSections(selectedCourseId);
        } catch (e) { message.error('Lỗi khi xóa chương'); }
    };

    return (
        <div className="section-management-container">
            <div className="section-management-header">
                <div>
                    <Title level={4} className="header-title">Quản lý Chương Học</Title>
                    <Text type="secondary">Phân bổ cấu trúc bài học cho từng khóa</Text>
                </div>
                <Button
                    type="primary"
                    disabled={!selectedCourseId}
                    onClick={() => { setEditingId(null); form.resetFields(); setIsModalOpen(true); }}
                    icon={<Plus size={16} />}
                >
                    Thêm chương mới
                </Button>
            </div>

            <Card className="glass-card">
                <div className="course-selector-wrapper">
                    <Text strong>Chọn khóa học:</Text>
                    <Select
                        showSearch
                        placeholder="Chọn khóa học để xem chương..."
                        className="course-select"
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

                {!selectedCourseId ? (
                    <div className="empty-section-wrapper">
                        <FolderOpen size={40} className="empty-icon" />
                        <Text type="secondary" className="empty-text">Vui lòng chọn một khóa học bên trên để quản lý chương</Text>
                    </div>
                ) : (
                    <Table
                        dataSource={sections}
                        loading={loading}
                        rowKey="id"
                        columns={[
                            { title: 'Thứ tự', dataIndex: 'order', width: 100, sorter: (a, b) => a.order - b.order },
                            {
                                title: 'Tiêu đề chương',
                                dataIndex: 'title',
                                render: (text, record) => (
                                    <span
                                        className="section-title-link"
                                        onClick={() => navigate(`/admin/lessons?courseId=${selectedCourseId}&sectionId=${record.id}`)}
                                    >
                                        {text}
                                    </span>
                                )
                            },
                            { title: 'Số bài giảng', key: 'lessons', render: (record) => record.lessons?.length || 0 },
                            {
                                title: 'Hành động',
                                key: 'actions',
                                width: 150,
                                render: (record) => (
                                    <Space>
                                        <Button type="text" icon={<Edit size={16} />} onClick={() => startEditing(record)} />
                                        <Popconfirm title="Xóa chương này?" onConfirm={() => handleDelete(record.id)}>
                                            <Button type="text" danger icon={<Trash2 size={16} />} />
                                        </Popconfirm>
                                    </Space>
                                )
                            }
                        ]}
                    />
                )}
            </Card>

            <Modal title={editingId ? "Chỉnh sửa Chương" : "Thêm Chương Mới"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null}>
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Form.Item name="title" label="Tiêu đề chương" rules={[{ required: true }]}>
                        <Input placeholder="Ví dụ: Chương 1: Giới thiệu" />
                    </Form.Item>
                    <Form.Item name="order" label="Thứ tự hiển thị" initialValue={0}>
                        <Input type="number" />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large">Hoàn tất</Button>
                </Form>
            </Modal>
        </div>
    );
}

