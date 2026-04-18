import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';
import {
    Trash2, UploadCloud,
    Plus, Edit
} from 'lucide-react';
import {
    Card, Button, Input, Select, Space, Typography,
    Table, Badge, Modal, Form, message, Popconfirm, Upload, Row, Col, DatePicker
} from 'antd';
import { SearchOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import './CourseManagement.scss';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

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
    const [editingId, setEditingId] = useState<number | null>(null);
    const [thumbFile, setThumbFile] = useState<any>(null);
    const [thumbUrl, setThumbUrl] = useState<string>('');
    const [searchText, setSearchText] = useState('');
    const navigate = useNavigate();

    const [form] = Form.useForm();

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (e) {
            message.error('Lỗi khi tải danh sách khóa học');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (values: any) => {
        try {
            let finalThumbnail = values.thumbnail;

            if (thumbFile) {
                const formData = new FormData();
                formData.append('image', thumbFile);
                const uploadRes = await api.post('/upload/image', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalThumbnail = uploadRes.data.url;
            }

            const payload = { ...values, thumbnail: finalThumbnail };

            if (editingId) {
                await api.put(`/courses/${editingId}`, payload);
                message.success('Đã cập nhật khóa học!');
            } else {
                await api.post('/courses', payload);
                message.success('Đã tạo khóa học mới!');
            }
            setIsModalOpen(false);
            setEditingId(null);
            setThumbFile(null);
            setThumbUrl('');
            form.resetFields();
            fetchData();
        } catch (e) { message.error('Lỗi lưu khóa học'); }
    };

    const startEditing = (course: any) => {
        setEditingId(course.id);
        form.setFieldsValue({
            title: course.title,
            description: course.description,
            is_private: course.is_private,
            thumbnail: course.thumbnail,
            intro_video_url: course.intro_video_url,
            learning_outcomes: course.learning_outcomes,
            requirements: course.requirements,
            level: course.level || 'Cơ bản'
        });
        setThumbUrl(course.thumbnail || '');
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/courses/${id}`);
            message.success('Đã xóa khóa học');
            fetchData();
        } catch (e) { message.error('Lỗi khi xóa khóa học'); }
    };

    const filteredCourses = courses.filter(c =>
        c.title.toLowerCase().includes(searchText.toLowerCase())
    );

    const columns = [
        {
            title: 'Khóa học',
            key: 'info',
            render: (c: Course) => (
                <Space
                    size={12}
                    className="course-info-space"
                    onClick={() => navigate(`/admin/sections?courseId=${c.id}`)}
                >
                    <img src={c.thumbnail || 'https://via.placeholder.com/150'} className="course-thumbnail" />
                    <div>
                        <Text strong className="course-title-text">{c.title}</Text>
                        <Text type="secondary" className="course-level-text">{c.level}</Text>
                    </div>
                </Space>
            ),
            filters: [
                { text: 'Cơ bản', value: 'Cơ bản' },
                { text: 'Trung cấp', value: 'Trung cấp' },
                { text: 'Nâng cao', value: 'Nâng cao' },
            ],
            onFilter: (value: any, record: Course) => record.level === value,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'is_private',
            width: 120,
            filters: [
                { text: 'RIÊNG TƯ', value: true },
                { text: 'CÔNG KHAI', value: false },
            ],
            onFilter: (value: any, record: Course) => record.is_private === value,
            render: (isPrivate: boolean) => (
                <Badge
                    count={isPrivate ? 'RIÊNG TƯ' : 'CÔNG KHAI'}
                    className={isPrivate ? "badge-private" : "badge-public"}
                />
            )
        },
        {
            title: 'Học viên',
            key: 'students',
            width: 100,
            render: (c: Course) => (
                <Badge
                    count={c._count?.enrollments || 0}
                    showZero
                    className="badge-students"
                />
            )
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }: any) => (
                <div className="filter-picker-wrapper" onKeyDown={(e) => e.stopPropagation()}>
                    <RangePicker
                        value={selectedKeys[0] ? [dayjs(selectedKeys[0][0]), dayjs(selectedKeys[0][1])] : null}
                        onChange={(dates) => setSelectedKeys(dates ? [[dates[0]?.toISOString(), dates[1]?.toISOString()]] : [])}
                        className="filter-range-picker"
                        size="small"
                    />
                    <Space>
                        <Button
                            type="primary"
                            onClick={() => confirm()}
                            size="small"
                            className="filter-btn"
                        >
                            Lọc
                        </Button>
                        <Button
                            onClick={() => {
                                clearFilters();
                                confirm();
                            }}
                            size="small"
                            className="filter-btn"
                        >
                            Xóa
                        </Button>
                    </Space>
                </div>
            ),
            filterIcon: (filtered: boolean) => (
                <CalendarOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
            ),
            onFilter: (value: any, record: Course) => {
                if (!value || value.length === 0) return true;
                const start = dayjs(value[0][0]).startOf('day');
                const end = dayjs(value[0][1]).endOf('day');
                const recordDate = dayjs(record.created_at);
                return recordDate.isAfter(start) && recordDate.isBefore(end);
            },
            render: (date: string) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Cập nhật',
            dataIndex: 'updated_at',
            width: 150,
            render: (date: string) => new Date(date).toLocaleDateString()
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 120,
            render: (record: Course) => (
                <Space>
                    <Button type="text" icon={<Edit size={16} />} onClick={() => startEditing(record)} />
                    <Popconfirm title="Xóa toàn bộ khóa học?" onConfirm={() => handleDelete(record.id)}>
                        <Button type="text" danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="management-container">
            <div className="management-header">
                <div>
                    <Title level={4} className="header-title">Quản lý Khóa học</Title>
                    <Text type="secondary">Tạo và cấu hình các khóa đào tạo</Text>
                </div>
                <Button type="primary" onClick={() => { setEditingId(null); setThumbUrl(''); form.resetFields(); setIsModalOpen(true); }} icon={<Plus size={16} />}>
                    Khóa học mới
                </Button>
            </div>

            <Card className="glass-card">
                <Input
                    placeholder="Tìm kiếm khóa học..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    className="search-input"
                    size="small"
                />
                <Table
                    dataSource={filteredCourses}
                    columns={columns}
                    rowKey="id"
                    loading={loading}
                    pagination={{ pageSize: 8 }}
                />
            </Card>

            <Modal title={editingId ? "Chỉnh sửa Khóa học" : "Khởi tạo Khóa học"} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={700}>
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="level" label="Trình độ" initialValue="Cơ bản">
                                <Select>
                                    <Option value="Cơ bản">Cơ bản</Option>
                                    <Option value="Trung cấp">Trung cấp</Option>
                                    <Option value="Nâng cao">Nâng cao</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="description" label="Mô tả">
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Form.Item name="is_private" label="Chế độ truy cập" initialValue={false}>
                        <Select>
                            <Option value={false}>Công khai (Tự động cấp quyền)</Option>
                            <Option value={true}>Riêng tư (Cần phê duyệt)</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item label="Hình ảnh khóa học (Thumbnail)">
                        <Space direction="vertical" className="full-width">
                            <Input
                                placeholder="Dán URL ảnh hoặc chọn file"
                                value={thumbUrl}
                                onChange={(e) => setThumbUrl(e.target.value)}
                                suffix={
                                    <Upload
                                        beforeUpload={(file) => {
                                            setThumbFile(file);
                                            const reader = new FileReader();
                                            reader.onload = e => setThumbUrl(e.target?.result as string);
                                            reader.readAsDataURL(file);
                                            return false;
                                        }}
                                        showUploadList={false}
                                    >
                                        <UploadCloud size={18} className="upload-icon" />
                                    </Upload>
                                }
                            />
                            {thumbUrl && <img src={thumbUrl} className="thumb-preview" />}
                        </Space>
                    </Form.Item>

                    <Form.Item name="learning_outcomes" label="Bạn sẽ học được gì? (Mỗi dòng một ý)">
                        <Input.TextArea rows={3} />
                    </Form.Item>

                    <Button type="primary" htmlType="submit" block size="large">Hoàn tất</Button>
                </Form>
            </Modal>
        </div>
    );
}
