import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, Card, Space, Avatar, Tag, Modal, Input as AntdInput, Segmented, message, Statistic, Row, Col } from 'antd';
import { UserOutlined, BellOutlined, ReloadOutlined, WarningOutlined, HourglassOutlined, BookOutlined } from '@ant-design/icons';
import { managerService, type InactiveEmployee } from '@/services/manager.service';
import styles from './ManagerInactiveReport.module.scss';

const { Title, Text } = Typography;

export default function ManagerInactiveReport() {
    const [inactiveEmployees, setInactiveEmployees] = useState<InactiveEmployee[]>([]);
    const [days, setDays] = useState<number>(7);
    const [loading, setLoading] = useState(false);

    // Reminder modal
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [reminderModalOpen, setReminderModalOpen] = useState(false);
    const [reminderText, setReminderText] = useState('');
    const [reminderLoading, setReminderLoading] = useState(false);

    useEffect(() => {
        fetchInactive();
    }, [days]);

    const fetchInactive = async () => {
        setLoading(true);
        try {
            const data = await managerService.getInactiveEmployees(days);
            setInactiveEmployees(data.employees);
        } catch (err) {
            message.error('Không thể tải báo cáo nhân sự không học tập');
        } finally {
            setLoading(false);
        }
    };

    const handleSendReminder = async () => {
        if (!selectedEmployeeId) return;
        setReminderLoading(true);
        try {
            await managerService.sendReminder(selectedEmployeeId, reminderText);
            message.success('Đã gửi nhắc nhở học tập thành công!');
            setReminderModalOpen(false);
        } catch (err) {
            message.error('Gửi nhắc nhở thất bại. Vui lòng thử lại.');
        } finally {
            setReminderLoading(false);
        }
    };

    const columns = [
        {
            title: 'Học viên',
            key: 'employee',
            render: (emp: InactiveEmployee) => (
                <Space>
                    <Avatar src={emp.avatar} icon={<UserOutlined />} style={{ border: '2px solid rgba(250, 140, 22, 0.1)' }} />
                    <div>
                        <Text strong style={{ display: 'block', fontSize: '14px' }}>{emp.full_name}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>ID: {emp.employee_id || 'Chưa cập nhật'}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Chức vụ',
            dataIndex: 'position',
            key: 'position',
            render: (pos: string) => <Tag color="blue">{pos}</Tag>
        },
        {
            title: 'Khóa bắt buộc đang học',
            dataIndex: 'total_mandatory_courses',
            key: 'total_mandatory_courses',
            align: 'center' as const,
            render: (count: number) => <Tag color="red" style={{ fontWeight: 'bold' }}>{count} khóa</Tag>
        },
        {
            title: 'Số bài học đã xong',
            dataIndex: 'total_completed_lessons',
            key: 'total_completed_lessons',
            align: 'center' as const,
            render: (count: number) => <Tag color="green">{count} bài</Tag>
        },
        {
            title: days === 1 ? 'Thời gian học (24 giờ qua)' : `Thời gian học (${days} ngày qua)`,
            dataIndex: 'total_duration_minutes',
            key: 'total_duration_minutes',
            align: 'center' as const,
            render: (min: number) => (
                <Space>
                    <HourglassOutlined style={{ color: '#fa8c16' }} />
                    <Text strong style={{ color: '#fa8c16' }}>{min} phút</Text>
                </Space>
            )
        },
        {
            title: 'Hành động đôn đốc',
            key: 'actions',
            align: 'center' as const,
            render: (emp: InactiveEmployee) => (
                <Button 
                    type="primary" 
                    danger 
                    size="small" 
                    icon={<BellOutlined />} 
                    onClick={() => {
                        setSelectedEmployeeId(emp.id);
                        setReminderText(`Chào bạn ${emp.full_name}, hệ thống ghi nhận bạn chưa phát sinh thời gian học trong ${days === 1 ? '24 giờ' : `${days} ngày`} qua. Vui lòng sắp xếp thời gian hoàn thành các khóa học nhé!`);
                        setReminderModalOpen(true);
                    }}
                    style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
                >
                    Nhắc nhở học
                </Button>
            )
        }
    ];

    return (
        <div className={styles.container}>
            {/* <div className={styles.pageHeader}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Nhân sự không học tập</Title>
                    <Text type="secondary">Danh sách nhân sự chưa phát sinh giờ học hoặc bài giảng trong kỳ</Text>
                </div>
            </div> */}

            <Row gutter={24} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <Card className="glass-card" style={{ height: '100%', background: 'rgba(250, 140, 22, 0.03)', borderColor: 'rgba(250, 140, 22, 0.15)' }}>
                        <Statistic
                            title={<Text strong style={{ color: '#fa8c16' }}><WarningOutlined style={{ marginRight: 8 }} />Số lượng Inactive</Text>}
                            value={inactiveEmployees.length}
                            suffix="nhân sự"
                            valueStyle={{ color: '#fa8c16', fontWeight: 'bold', fontSize: 32 }}
                        />
                    </Card>
                </Col>
                <Col span={16}>
                    <Card className="glass-card" style={{ height: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%', padding: '4px 0' }}>
                            <div>
                                <Text strong style={{ display: 'block', fontSize: 15, marginBottom: 4 }}>Khoảng thời gian báo cáo</Text>
                                <Text type="secondary" style={{ fontSize: 13 }}>Lựa chọn số ngày để hệ thống kết xuất báo cáo nhanh</Text>
                            </div>
                            <Space size={16}>
                                <Segmented
                                    options={[
                                        { label: '24 giờ qua', value: 1 },
                                        { label: '7 ngày qua', value: 7 },
                                        { label: '30 ngày qua', value: 30 },
                                        { label: '90 ngày qua', value: 90 }
                                    ]}
                                    value={days}
                                    onChange={(v) => setDays(Number(v))}
                                />
                                <Button icon={<ReloadOutlined />} onClick={fetchInactive} loading={loading} />
                            </Space>
                        </div>
                    </Card>
                </Col>
            </Row>

            <Card className="glass-card">
                <Table
                    columns={columns}
                    dataSource={inactiveEmployees}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        pageSize: 10,
                        itemRender: (current: number, type: string, originalElement: any) => {
                            if (type === 'page') {
                                return React.cloneElement(originalElement, {
                                    className: 'page-number',
                                    children: current < 10 ? `0${current}` : current
                                });
                            }
                            return originalElement;
                        }
                    } as any}
                    bordered
                    locale={{ emptyText: `Tuyệt vời! Không có nhân sự nào lười học trong ${days === 1 ? '24 giờ' : `${days} ngày`} qua` }}
                />
            </Card>

            {/* Modal Nhắc nhở */}
            <Modal
                title="Gửi Nhắc Nhở Học Tập Cho Nhân Viên"
                open={reminderModalOpen}
                onCancel={() => setReminderModalOpen(false)}
                onOk={handleSendReminder}
                confirmLoading={reminderLoading}
                okText="Gửi nhắc nhở"
                cancelText="Hủy bỏ"
                destroyOnClose
            >
                <div style={{ padding: '8px 0' }}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>Nội dung thông báo (Hiển thị real-time trên tài khoản học viên):</Text>
                    <AntdInput.TextArea
                        rows={4}
                        value={reminderText}
                        onChange={e => setReminderText(e.target.value)}
                        placeholder="Nhập lời nhắc nhở nhẹ nhàng nhưng đầy động lực..."
                    />
                </div>
            </Modal>
        </div>
    );
}
