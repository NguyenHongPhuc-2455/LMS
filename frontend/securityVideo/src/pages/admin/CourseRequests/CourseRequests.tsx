import { useEffect, useState } from 'react';
import { Table, Button, Space, message, Typography, Card, Tabs, Tag } from 'antd';
import { CheckOutlined, CloseOutlined, UserOutlined, BookOutlined, ApartmentOutlined } from '@ant-design/icons';
import { courseRequestService } from '../../../services/courseRequest.service';
import { programRequestService } from '../../../services/programRequest.service';

import styles from './CourseRequests.module.scss';


const { Title } = Typography;

export default function CourseRequests() {
    const [courseRequests, setCourseRequests] = useState<any[]>([]);
    const [programRequests, setProgramRequests] = useState<any[]>([]);

    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchAllRequests = async () => {
        try {
            setLoading(true);
            const [courseData, programData] = await Promise.all([
                courseRequestService.getAllPending(),
                programRequestService.getAllPending()
            ]);
            setCourseRequests(courseData);
            setProgramRequests(programData);

        } catch (error) {
            message.error('Lỗi khi tải danh sách yêu cầu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllRequests();
    }, []);

    const handleBulkAction = async (type: 'course' | 'program', action: 'approve' | 'reject') => {
        const ids = type === 'course' ? selectedCourseIds : selectedProgramIds;
        if (ids.length === 0) return;

        try {

            if (type === 'course') {
                await courseRequestService.bulkAction(action, ids);
                setSelectedCourseIds([]);
            } else {
                await programRequestService.bulkAction(action, ids);
                setSelectedProgramIds([]);
            }
            message.success(`Đã ${action === 'approve' ? 'phê duyệt' : 'từ chối'} ${ids.length} yêu cầu`);
            fetchAllRequests();
        } catch (error) {

            message.error('Lỗi khi thực hiện thao tác hàng loạt');
        }
    };

    const handleApproveCourse = async (id: number) => {
        try {
            await courseRequestService.approve(id);
            message.success('Đã phê duyệt khóa học');
            fetchAllRequests();
        } catch (error) {

            message.error('Lỗi khi phê duyệt');
        }
    };

    const handleRejectCourse = async (id: number) => {
        try {
            await courseRequestService.reject(id);
            message.success('Đã từ chối khóa học');
            fetchAllRequests();
        } catch (error) {

            message.error('Lỗi khi từ chối');
        }
    };

    const handleApproveProgram = async (id: number) => {
        try {
            await programRequestService.approve(id);
            message.success('Đã phê duyệt lộ trình và mở khóa toàn bộ khóa học liên quan');
            fetchAllRequests();
        } catch (error) {
            message.error('Lỗi khi phê duyệt');
        }
    };

    const handleRejectProgram = async (id: number) => {
        try {
            await programRequestService.reject(id);
            message.success('Đã từ chối lộ trình');
            fetchAllRequests();
        } catch (error) {
            message.error('Lỗi khi từ chối');
        }
    };

    const commonColumns = (type: 'course' | 'program') => [
        {
            title: 'Học viên',
            dataIndex: 'user',
            key: 'user',
            render: (user: any) => (
                <Space>
                    <UserOutlined />
                    <div>
                        <div className={styles.userName} style={{ fontWeight: 600 }}>{user.full_name}</div>
                        <div className={styles.userEmail} style={{ fontSize: '12px', color: '#64748b' }}>{user.email}</div>
                    </div>
                </Space>
            )
        },
        {
            title: type === 'course' ? 'Khóa học' : 'Lộ trình học',
            dataIndex: type,
            key: type,
            render: (item: any) => (
                <Space>
                    {type === 'course' ? <BookOutlined /> : <ApartmentOutlined style={{ color: '#6366f1' }} />}
                    <span className={styles.courseTitle} style={{ fontWeight: 500 }}>{item.title}</span>
                </Space>
            )
        },
        {
            title: 'Lý do',
            dataIndex: 'reason',
            key: 'reason',
            render: (text: string) => text || <i className={styles.emptyReason} style={{ color: '#94a3b8' }}>Không có lý do</i>
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
                        className={styles.approveBtn}
                        onClick={() => type === 'course' ? handleApproveCourse(record.id) : handleApproveProgram(record.id)}
                    // style={{ backgroundColor: '#10b981', borderColor: '#10b981' }}
                    >
                        Duyệt
                    </Button>
                    <Button
                        danger
                        icon={<CloseOutlined />}
                        onClick={() => type === 'course' ? handleRejectCourse(record.id) : handleRejectProgram(record.id)}
                    >
                        Từ chối
                    </Button>
                </Space>
            )
        }
    ];

    const items = [
        {
            key: '1',
            label: (
                <span>
                    <BookOutlined /> Khóa học ({courseRequests.length})
                </span>
            ),
            children: (
                <div>
                    {selectedCourseIds.length > 0 && (
                        <Space style={{ marginBottom: 16 }}>
                            <Button type="primary" onClick={() => handleBulkAction('course', 'approve')} className={styles.approveBtn}>
                                Duyệt ({selectedCourseIds.length})
                            </Button>
                            <Button danger onClick={() => handleBulkAction('course', 'reject')}>
                                Từ chối ({selectedCourseIds.length})
                            </Button>
                        </Space>
                    )}
                    <Table
                        columns={commonColumns('course')}
                        dataSource={courseRequests}
                        rowKey="id"
                        loading={loading}
                        rowSelection={{
                            selectedRowKeys: selectedCourseIds,
                            onChange: (keys: any) => setSelectedCourseIds(keys),
                        }}
                        locale={{ emptyText: 'Không có yêu cầu khóa học nào' }}
                    />
                </div>
            ),
        },
        {
            key: '2',
            label: (
                <span>
                    <ApartmentOutlined /> Lộ trình ({programRequests.length})
                </span>
            ),
            children: (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <Tag color="blue" style={{ marginBottom: 16 }}>
                            Ghi chú: Khi duyệt lộ trình, toàn bộ khóa học bên trong sẽ được tự động mở khóa.
                        </Tag>
                        {selectedProgramIds.length > 0 && (
                            <Space style={{ marginBottom: 16 }}>
                                <Button type="primary" onClick={() => handleBulkAction('program', 'approve')} className={styles.approveBtn}>
                                    Duyệt ({selectedProgramIds.length})
                                </Button>
                                <Button danger onClick={() => handleBulkAction('program', 'reject')}>
                                    Từ chối ({selectedProgramIds.length})
                                </Button>
                            </Space>
                        )}
                    </div>
                    <Table
                        columns={commonColumns('program')}
                        dataSource={programRequests}
                        rowKey="id"
                        loading={loading}
                        rowSelection={{
                            selectedRowKeys: selectedProgramIds,
                            onChange: (keys: any) => setSelectedProgramIds(keys),
                        }}
                        locale={{ emptyText: 'Không có yêu cầu lộ trình nào' }}
                    />
                </div>
            ),
        }
    ];

    return (
        <div className={styles.courseRequestsContainer} style={{ padding: '24px' }}>
            <Card className="glass-card" style={{ borderRadius: '16px' }}>
                <Title level={2} className={styles.requestCardTitle} style={{ marginBottom: '24px' }}>Phê duyệt yêu cầu truy cập</Title>
                <Tabs defaultActiveKey="1" items={items} />
            </Card>
        </div>
    );

}


