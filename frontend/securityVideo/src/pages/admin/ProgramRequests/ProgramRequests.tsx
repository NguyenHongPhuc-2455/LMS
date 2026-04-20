import { useEffect, useState } from 'react';
import { Table, Button, Space, message, Typography, Card, Tag } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined, ApartmentOutlined } from '@ant-design/icons';
import { programRequestService } from '../../../services/programRequest.service';
import styles from './ProgramRequests.module.scss';

const { Title } = Typography;

export default function ProgramRequests() {
    const [requests, setRequests] = useState<any[]>([]);

    const [loading, setLoading] = useState(false);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const data = await programRequestService.getAllPending();
            setRequests(data);

        } catch (error) {
            message.error('Lỗi khi tải danh sách yêu cầu lộ trình');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleApprove = async (id: number) => {
        try {
            await programRequestService.approve(id);
            message.success('Đã phê duyệt lộ trình. Toàn bộ khóa học liên quan đã được mở khóa.');
            fetchRequests();
        } catch (error) {
            message.error('Lỗi khi phê duyệt');
        }
    };

    const handleReject = async (id: number) => {
        try {
            await programRequestService.reject(id);
            message.success('Đã từ chối yêu cầu lộ trình');
            fetchRequests();
        } catch (error) {
            message.error('Lỗi khi từ chối');
        }
    };

    const programFilters = Array.from(new Set(requests.map((r: any) => r.program.title)))
        .map(title => ({ text: title, value: title }));

    const columns = [
        {
            title: 'Học viên',
            dataIndex: 'user',
            key: 'user',
            render: (user: any) => (
                <Space>
                    <UserOutlined />
                    <div>
                        <div className={styles.userName}>{user.full_name}</div>
                        <div className={styles.userEmail}>{user.email}</div>
                    </div>
                </Space>
            )
        },
        {
            title: 'Lộ trình học',
            dataIndex: 'program',
            key: 'program',
            filters: programFilters,
            onFilter: (value: any, record: any) => record.program.title === value,
            render: (program: any) => (
                <Space>
                    <ApartmentOutlined style={{ color: '#6366f1' }} />
                    <span className={styles.programTitle}>{program.title}</span>
                </Space>
            )
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            render: (text: string) => text || <i style={{ color: '#94a3b8' }}>Không có lý do</i>
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
                        style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
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
        <div className={styles.programRequestsContainer} style={{ padding: '24px' }}>
            <Card className="glass-card" style={{ borderRadius: '16px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}>
                <Title level={3} style={{ marginBottom: '24px' }}>Duyệt yêu cầu Lộ trình học</Title>
                <Tag color="blue" style={{ marginBottom: '24px' }}>Ghi chú: Khi duyệt lộ trình, toàn bộ khóa học bên trong sẽ được tự động mở khóa cho học viên.</Tag>
                <Table
                    columns={columns}
                    dataSource={requests}
                    rowKey="id"
                    loading={loading}
                    locale={{ emptyText: 'Không có yêu cầu lộ trình nào đang chờ' }}
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
}
