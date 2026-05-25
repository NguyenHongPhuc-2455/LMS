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
import React from 'react';

const { Title } = Typography;

export default function CourseRequestManagement() {
    const [courseRequests, setCourseRequests] = useState<any[]>([]);
    const [programRequests, setProgramRequests] = useState<any[]>([]);

    const [coursePage, setCoursePage] = useState(1);
    const [coursePageSize, setCoursePageSize] = useState(10);
    const [courseTotal, setCourseTotal] = useState(0);

    const [programPage, setProgramPage] = useState(1);
    const [programPageSize, setProgramPageSize] = useState(10);
    const [programTotal, setProgramTotal] = useState(0);

    const [selectedCourseIds, setSelectedCourseIds] = useState<number[]>([]);
    const [selectedProgramIds, setSelectedProgramIds] = useState<number[]>([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

    const fetchAllRequests = React.useCallback(async () => {
        try {
            setLoading(true);
            const [courseData, programData, catData] = await Promise.all([
                courseRequestService.getAllPending(coursePage, coursePageSize),
                programRequestService.getAllPending(programPage, programPageSize),
                categoryService.getAllCategories()
            ]);
            
            if (courseData && courseData.data) {
                setCourseRequests(courseData.data);
                setCourseTotal(courseData.total);
            } else {
                setCourseRequests(courseData as any);
                setCourseTotal((courseData as any)?.length || 0);
            }

            if (programData && programData.data) {
                setProgramRequests(programData.data);
                setProgramTotal(programData.total);
            } else {
                setProgramRequests(programData as any);
                setProgramTotal((programData as any)?.length || 0);
            }

            setCategories(catData);
        } catch (error) {
            message.error('Lỗi khi tải danh sách yêu cầu');
        } finally {
            setLoading(false);
        }
    }, [coursePage, coursePageSize, programPage, programPageSize]);

    useEffect(() => {
        fetchAllRequests();
    }, [fetchAllRequests]);

    const handleBulkAction = React.useCallback(async (type: 'course' | 'program', action: 'approve' | 'reject') => {
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
    }, [selectedCourseIds, selectedProgramIds, fetchAllRequests]);

    const handleApprove = React.useCallback(async (type: 'course' | 'program', id: number) => {
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
    }, [fetchAllRequests]);

    const handleReject = React.useCallback(async (type: 'course' | 'program', id: number) => {
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
    }, [fetchAllRequests]);

    const filteredCourseRequests = courseRequests.filter(req =>
        selectedCategoryId === null ||
        (selectedCategoryId === -1 ? !req.course?.category_id : req.course?.category_id === selectedCategoryId)
    );

    const handleApproveCourse = React.useCallback((id: number) => handleApprove('course', id), [handleApprove]);
    const handleRejectCourse = React.useCallback((id: number) => handleReject('course', id), [handleReject]);
    const handleApproveProgram = React.useCallback((id: number) => handleApprove('program', id), [handleApprove]);
    const handleRejectProgram = React.useCallback((id: number) => handleReject('program', id), [handleReject]);

    const handleCoursePageChange = React.useCallback((page: number, pageSize: number) => {
        setCoursePage(page);
        setCoursePageSize(pageSize);
    }, []);

    const handleProgramPageChange = React.useCallback((page: number, pageSize: number) => {
        setProgramPage(page);
        setProgramPageSize(pageSize);
    }, []);

    const items = React.useMemo(() => [
        {
            key: '1',
            label: (
                <span>
                    <BookOutlined /> Khóa học ({courseTotal})
                </span>
            ),
            children: (
                <RequestTabContent
                    type="course"
                    data={filteredCourseRequests}
                    total={courseTotal}
                    page={coursePage}
                    pageSize={coursePageSize}
                    onPageChange={handleCoursePageChange}
                    loading={loading}
                    selectedIds={selectedCourseIds}
                    onSelectionChange={setSelectedCourseIds}
                    onApprove={handleApproveCourse}
                    onReject={handleRejectCourse}
                    handleBulkAction={handleBulkAction}
                />
            ),
        },
        {
            key: '2',
            label: (
                <span>
                    <ApartmentOutlined /> Lộ trình ({programTotal})
                </span>
            ),
            children: (
                <div>
                    <RequestTabContent
                        type="program"
                        data={programRequests}
                        total={programTotal}
                        page={programPage}
                        pageSize={programPageSize}
                        onPageChange={handleProgramPageChange}
                        loading={loading}
                        selectedIds={selectedProgramIds}
                        onSelectionChange={setSelectedProgramIds}
                        onApprove={handleApproveProgram}
                        onReject={handleRejectProgram}
                        handleBulkAction={handleBulkAction}
                    />
                </div>
            ),
        }
    ], [
        filteredCourseRequests,
        programRequests,
        loading,
        selectedCourseIds,
        selectedProgramIds,
        handleApproveCourse,
        handleRejectCourse,
        handleApproveProgram,
        handleRejectProgram,
        handleBulkAction
    ]);

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
