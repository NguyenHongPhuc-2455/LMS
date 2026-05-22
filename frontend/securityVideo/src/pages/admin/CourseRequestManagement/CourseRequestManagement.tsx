import { useEffect, useState } from 'react';
import { Card, Tabs, Typography, message } from 'antd';
import { BookOutlined, ApartmentOutlined } from '@ant-design/icons';
import { courseRequestService } from '../../../services/courseRequest.service';
import { programRequestService } from '../../../services/programRequest.service';
import { categoryService, type Category } from '../../../services/category.service';
import { Space, Select, Tooltip, Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';

import styles from './CourseRequests.module.scss';
import RequestTabContent from './components/RequestTabContent';

const { Title } = Typography;

export default function CourseRequestManagement() {
    const [courseRequests, setCourseRequests] = useState<any[]>([]);
    const [programRequests, setProgramRequests] = useState<any[]>([]);

    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const fetchAllRequests = async () => {
        try {
            setLoading(true);
            const [courseData, programData, catData] = await Promise.all([
                courseRequestService.getAllPending(),
                programRequestService.getAllPending(),
                categoryService.getAllCategories()
            ]);
            setCourseRequests(courseData);
            setProgramRequests(programData);
            setCategories(catData);
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

    const handleApprove = async (type: 'course' | 'program', id: number) => {
        try {
            if (type === 'course') {
                await courseRequestService.approve(id);
                message.success('Đã phê duyệt khóa học');
            } else {
                await programRequestService.approve(id);
                message.success('Đã phê duyệt lộ trình và mở khóa toàn bộ khóa học liên quan');
            }
            fetchAllRequests();
        } catch (error) {
            message.error('Lỗi khi phê duyệt');
        }
    };

    const handleReject = async (type: 'course' | 'program', id: number) => {
        try {
            if (type === 'course') {
                await courseRequestService.reject(id);
                message.success('Đã từ chối khóa học');
            } else {
                await programRequestService.reject(id);
                message.success('Đã từ chối lộ trình');
            }
            fetchAllRequests();
        } catch (error) {
            message.error('Lỗi khi từ chối');
        }
    };

    const filteredCourseRequests = courseRequests.filter(req =>
        selectedCategoryId === null ||
        (selectedCategoryId === -1 ? !req.course?.category_id : req.course?.category_id === selectedCategoryId)
    );

    const items = [
        {
            key: '1',
            label: (
                <span>
                    <BookOutlined /> Khóa học ({filteredCourseRequests.length})
                </span>
            ),
            children: (
                <RequestTabContent
                    type="course"
                    data={filteredCourseRequests}
                    loading={loading}
                    selectedIds={selectedCourseIds}
                    onSelectionChange={setSelectedCourseIds}
                    onApprove={(id) => handleApprove('course', id)}
                    onReject={(id) => handleReject('course', id)}
                    handleBulkAction={handleBulkAction}
                />
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
                    <RequestTabContent
                        type="program"
                        data={programRequests}
                        loading={loading}
                        selectedIds={selectedProgramIds}
                        onSelectionChange={setSelectedProgramIds}
                        onApprove={(id) => handleApprove('program', id)}
                        onReject={(id) => handleReject('program', id)}
                        handleBulkAction={handleBulkAction}
                    />
                </div>
            ),
        }
    ];

    return (
        <div className={styles.courseRequestsContainer}>
            {/* <div style={{ marginBottom: 20 }}>
                <Title level={4} style={{ margin: 0, marginBottom: 0 }}>Duyệt yêu cầu truy cập</Title>
                <Typography.Text type="secondary">Phê duyệt quyền tham gia khóa học và lộ trình của nhân sự</Typography.Text>
            </div> */}

            <Card className="glass-card" style={{ borderRadius: '16px' }}>
                <div style={{ marginBottom: 16 }}>
                    <Space size={12}>
                        <Typography.Text strong>Lọc theo danh mục:</Typography.Text>
                        <Select
                            placeholder="Tất cả danh mục"
                            allowClear
                            style={{ width: 180 }}
                            value={selectedCategoryId}
                            onChange={setSelectedCategoryId}
                        >
                            <Select.Option value={-1}>Trống (Không danh mục)</Select.Option>
                            {categories.map(cat => (
                                <Select.Option key={cat.id} value={cat.id}>
                                    {cat.name}
                                </Select.Option>
                            ))}
                        </Select>
                        <Tooltip title="Làm mới dữ liệu">
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={fetchAllRequests}
                                loading={loading}
                            />
                        </Tooltip>
                    </Space>
                </div>
                <Tabs defaultActiveKey="1" items={items} />
            </Card>
        </div>
    );
}
