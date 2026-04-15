import { useEffect, useState } from 'react';
import { Table, Button, Space, message, Typography, Card } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined, BookOutlined } from '@ant-design/icons';
import api from '../../api';

const { Title } = Typography;

export default function CourseRequests() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await api.get('/course-requests/pending');
            setRequests(res.data);
        } catch (error) {
            message.error('Lỗi khi tải danh sách yêu cầu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            await api.patch(`/course-requests/${id}/approve`);
            message.success('Đã phê duyệt và cấp quyền truy cập');
            fetchRequests();
        } catch (error) {
            message.error('Lỗi khi phê duyệt');
        }
    };

    const handleReject = async (id: number) => {
        try {
            await api.patch(`/course-requests/${id}/reject`);
            message.success('Đã từ chối yêu cầu');
            fetchRequests();
        } catch (error) {
            message.error('Lỗi khi từ chối');
        }
    };

    const columns = [
        {
            title: 'Học viên',
            dataIndex: 'user',
            key: 'user',
            render: (user: any) => (
                <Space>
                    <UserOutlined />
                    <div>
                        <div style={{ fontWeight: 600 }}>{user.full_name}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{user.email}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Khóa học',
            dataIndex: 'course',
            key: 'course',
            render: (course: any) => (
                <Space>
                    <BookOutlined />
                    <span style={{ fontWeight: 500 }}>{course.title}</span>
                </Space>
            )
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            render: (text: string) => text || <i style={{ color: '#999' }}>Không có lý do</i>
        },
        {
            title: 'Ngày gửi',
            dataIndex: 'created_at',
            key: 'created_at',
            render: (date: string) => new Date(date).toLocaleString('vi-VN')
        },
        {
            title: 'Thao tác',
            key: 'action',
            render: (_: any, record: any) => (
                <Space size="middle">
                    <Button
                        type="primary"
                        icon={<CheckOutlined />}
                        onClick={() => handleApprove(record.id)}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                        Duyệt
                    </Button>
                    <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => handleReject(record.id)}
                    >
                        Từ chối
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div style={{ padding: '24px' }}>
            <Card className="glass-card">
                <Title level={2} style={{ marginBottom: 24 }}>Phê duyệt truy cập khóa học</Title>
                <Table
                    columns={columns}
                    dataSource={requests}
                    rowKey="id"
                    loading={loading}
                    locale={{ emptyText: 'Không có yêu cầu nào đang chờ xử lý' }}
                />
            </Card>
        </div>
    );
}
