import { useEffect, useState } from 'react';
import {
    Card, Button, Input, Select, Space, Typography,
    Table, Badge, Modal, Form, message, Popconfirm, Upload, Row, Col, Tag, Drawer, List, Avatar
} from 'antd';
import { Plus, Edit, Trash2, UploadCloud, BookOpen, X } from 'lucide-react';
import { SearchOutlined } from '@ant-design/icons';
import api from '../../../api';

const { Title, Text } = Typography;
const { Option } = Select;

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
    const [editingId, setEditingId] = useState<number | null>(null);
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [thumbFile, setThumbFile] = useState<any>(null);
    const [thumbUrl, setThumbUrl] = useState('');
    const [searchText, setSearchText] = useState('');
    const [addingCourseId, setAddingCourseId] = useState<number | null>(null);
    const [form] = Form.useForm();

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const res = await api.get('/programs');
            setPrograms(res.data);
        } catch {
            message.error('Lỗi khi tải danh sách chương trình học');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllCourses = async () => {
        try {
            const res = await api.get('/courses');
            setAllCourses(res.data);
        } catch { /* ignore */ }
    };

    useEffect(() => {
        fetchPrograms();
        fetchAllCourses();
    }, []);

    const handleSave = async (values: any) => {
        try {
            let finalThumbnail = values.thumbnail || thumbUrl;
            if (thumbFile) {
                const fd = new FormData();
                fd.append('image', thumbFile);
                const up = await api.post('/upload/image', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                finalThumbnail = up.data.url;
            }
            const payload = { ...values, thumbnail: finalThumbnail };
            if (editingId) {
                await api.put(`/programs/${editingId}`, payload);
                message.success('Đã cập nhật chương trình học!');
            } else {
                await api.post('/programs', payload);
                message.success('Đã tạo chương trình học mới!');
            }
            setIsModalOpen(false);
            setEditingId(null);
            setThumbFile(null);
            setThumbUrl('');
            form.resetFields();
            fetchPrograms();
        } catch {
            message.error('Lỗi khi lưu chương trình học');
        }
    };

    const startEditing = (p: Program) => {
        setEditingId(p.id);
        setThumbUrl(p.thumbnail || '');
        form.setFieldsValue({ title: p.title, description: p.description, level: p.level, status: p.status, is_private: p.is_private });
        setIsModalOpen(true);
    };

    const handleDelete = async (id: number) => {
        try {
            await api.delete(`/programs/${id}`);
            message.success('Đã xóa chương trình học');
            fetchPrograms();
        } catch {
            message.error('Lỗi khi xóa');
        }
    };

    const openCourseDrawer = (p: Program) => {
        setSelectedProgram(p);
        setIsCourseDrawerOpen(true);
    };

    const handleAddCourse = async (courseId: number) => {
        if (!selectedProgram) return;
        setAddingCourseId(courseId);
        try {
            await api.post(`/programs/${selectedProgram.id}/courses`, { course_id: courseId });
            message.success('Đã thêm khóa học vào chương trình');
            const res = await api.get('/programs');
            setPrograms(res.data);
            setSelectedProgram(res.data.find((p: Program) => p.id === selectedProgram.id) || null);
        } catch {
            message.error('Lỗi khi thêm khóa học');
        } finally {
            setAddingCourseId(null);
        }
    };

    const handleRemoveCourse = async (courseId: number) => {
        if (!selectedProgram) return;
        try {
            await api.delete(`/programs/${selectedProgram.id}/courses/${courseId}`);
            message.success('Đã xóa khóa học khỏi chương trình');
            const res = await api.get('/programs');
            setPrograms(res.data);
            setSelectedProgram(res.data.find((p: Program) => p.id === selectedProgram.id) || null);
        } catch {
            message.error('Lỗi khi xóa khóa học');
        }
    };

    const currentCourseIds = selectedProgram?.courses.map(pc => pc.course.id) || [];
    const availableCourses = allCourses.filter(c => !currentCourseIds.includes(c.id));

    const filtered = programs.filter(p => p.title.toLowerCase().includes(searchText.toLowerCase()));

    const statusColor: Record<string, string> = { PUBLISHED: '#28a745', DRAFT: '#faad14', ARCHIVED: '#8c8c8c' };
    const statusLabel: Record<string, string> = { PUBLISHED: 'Phát hành', DRAFT: 'Nháp', ARCHIVED: 'Lưu trữ' };

    const columns = [
        {
            title: 'Chương trình học',
            key: 'info',
            render: (p: Program) => (
                <Space size={12}>
                    <img src={p.thumbnail || 'https://via.placeholder.com/80x45'} style={{ width: 80, height: 45, borderRadius: 4, objectFit: 'cover' }} />
                    <div>
                        <Text strong style={{ display: 'block' }}>{p.title}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{p.level}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Trạng thái',
            key: 'status',
            width: 130,
            render: (p: Program) => (
                <Space direction="vertical" size={4}>
                    <Badge count={statusLabel[p.status] || p.status} style={{ backgroundColor: statusColor[p.status] || '#8c8c8c' }} />
                    <Badge count={p.is_private ? 'RIÊNG TƯ' : 'CÔNG KHAI'} style={{ backgroundColor: p.is_private ? '#7064f9' : '#28a745' }} />
                </Space>
            )
        },
        {
            title: 'Khóa học',
            key: 'courses',
            width: 100,
            render: (p: Program) => (
                <Button type="link" onClick={() => openCourseDrawer(p)} style={{ padding: 0 }}>
                    <Tag color="blue">{p._count?.courses || 0} khóa</Tag>
                </Button>
            )
        },
        {
            title: 'Học viên',
            key: 'enroll',
            width: 90,
            render: (p: Program) => <Badge count={p._count?.enrollments || 0} showZero style={{ backgroundColor: '#52c41a' }} />
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'created_at',
            width: 120,
            render: (d: string) => new Date(d).toLocaleDateString('vi-VN')
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 100,
            render: (p: Program) => (
                <Space>
                    <Button type="text" icon={<Edit size={16} />} onClick={() => startEditing(p)} />
                    <Popconfirm title="Xóa chương trình học này?" onConfirm={() => handleDelete(p.id)}>
                        <Button type="text" danger icon={<Trash2 size={16} />} />
                    </Popconfirm>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Quản lý Chương trình học</Title>
                    <Text type="secondary">Gom nhiều khóa học thành lộ trình đào tạo</Text>
                </div>
                <Button type="primary" icon={<Plus size={16} />}
                    onClick={() => { setEditingId(null); setThumbUrl(''); form.resetFields(); setIsModalOpen(true); }}>
                    Chương trình mới
                </Button>
            </div>

            <Card className="glass-card">
                <div style={{ marginBottom: 20 }}>
                    <Input placeholder="Tìm kiếm chương trình..." prefix={<SearchOutlined />}
                        value={searchText} onChange={e => setSearchText(e.target.value)} style={{ width: 300 }} size="small" />
                </div>
                <Table dataSource={filtered} columns={columns} rowKey="id" loading={loading} pagination={{ pageSize: 8 }} />
            </Card>

            {/* Modal tạo/sửa */}
            <Modal title={editingId ? 'Chỉnh sửa Chương trình học' : 'Tạo Chương trình học mới'}
                open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={640}>
                <Form form={form} layout="vertical" onFinish={handleSave}>
                    <Row gutter={16}>
                        <Col span={14}>
                            <Form.Item name="title" label="Tiêu đề" rules={[{ required: true, message: 'Nhập tiêu đề' }]}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
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
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="status" label="Trạng thái" initialValue="DRAFT">
                                <Select>
                                    <Option value="DRAFT">Nháp</Option>
                                    <Option value="PUBLISHED">Phát hành</Option>
                                    <Option value="ARCHIVED">Lưu trữ</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="is_private" label="Chế độ truy cập" initialValue={false}>
                                <Select>
                                    <Option value={false}>Công khai</Option>
                                    <Option value={true}>Riêng tư</Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item label="Ảnh bìa">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Input placeholder="Dán URL hoặc upload file" value={thumbUrl}
                                onChange={e => setThumbUrl(e.target.value)}
                                suffix={
                                    <Upload beforeUpload={file => {
                                        setThumbFile(file);
                                        const reader = new FileReader();
                                        reader.onload = e => setThumbUrl(e.target?.result as string);
                                        reader.readAsDataURL(file);
                                        return false;
                                    }} showUploadList={false}>
                                        <UploadCloud size={18} style={{ cursor: 'pointer', color: '#6366f1' }} />
                                    </Upload>
                                }
                            />
                            {thumbUrl && <img src={thumbUrl} style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }} />}
                        </Space>
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block size="large">Hoàn tất</Button>
                </Form>
            </Modal>

            {/* Drawer quản lý khóa học trong chương trình */}
            <Drawer
                title={<Space><BookOpen size={18} /><span>Khóa học trong: {selectedProgram?.title}</span></Space>}
                open={isCourseDrawerOpen}
                onClose={() => setIsCourseDrawerOpen(false)}
                width={520}
            >
                {selectedProgram && (
                    <>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>Đang có ({currentCourseIds.length} khóa)</Text>
                        <List
                            dataSource={selectedProgram.courses.sort((a, b) => a.order - b.order)}
                            locale={{ emptyText: 'Chưa có khóa học nào' }}
                            renderItem={pc => (
                                <List.Item actions={[
                                    <Button type="text" danger size="small" icon={<X size={14} />}
                                        onClick={() => handleRemoveCourse(pc.course.id)} />
                                ]}>
                                    <List.Item.Meta
                                        avatar={<Avatar src={pc.course.thumbnail} shape="square" size={40} style={{ borderRadius: 4 }} />}
                                        title={pc.course.title}
                                        description={<Tag>{pc.course.level}</Tag>}
                                    />
                                </List.Item>
                            )}
                        />

                        {availableCourses.length > 0 && (
                            <>
                                <div style={{ margin: '16px 0 8px', borderTop: '1px solid #f0f0f0', paddingTop: 16 }}>
                                    <Text strong>Thêm khóa học</Text>
                                </div>
                                <List
                                    dataSource={availableCourses}
                                    renderItem={c => (
                                        <List.Item actions={[
                                            <Button type="primary" size="small" loading={addingCourseId === c.id}
                                                onClick={() => handleAddCourse(c.id)}>Thêm</Button>
                                        ]}>
                                            <List.Item.Meta
                                                avatar={<Avatar src={c.thumbnail} shape="square" size={40} style={{ borderRadius: 4 }} />}
                                                title={c.title}
                                                description={<Tag>{c.level}</Tag>}
                                            />
                                        </List.Item>
                                    )}
                                />
                            </>
                        )}
                    </>
                )}
            </Drawer>
        </div>
    );
}

