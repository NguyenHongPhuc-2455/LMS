import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Row, Col, Statistic, Table, Select, DatePicker, Segmented, Space, Button, Input, Empty, Tooltip as AntdTooltip } from 'antd';
import * as XLSX from 'xlsx';
import { 
    ClockCircleOutlined, 
    BookOutlined, 
    UserAddOutlined, 
    DownloadOutlined, 
    SearchOutlined, 
    ReloadOutlined 
} from '@ant-design/icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import dayjs from 'dayjs';
import { statsService } from '../../../../services/stats.service';
import { departmentService } from '../../../../services/department.service';
import { courseService } from '../../../../services/course.service';

const { RangePicker } = DatePicker;

export default function LearningActivityReport() {
    // Current User checks
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const userRoles = user?.roles || [];
    const roleNames = userRoles.map((r: any) => (typeof r === 'string' ? r : r.name).toLowerCase());
    const isManagerOnly = roleNames.includes('manager') && !roleNames.includes('admin');
    const managerDeptId = user?.department_id;

    // Filters State
    const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
    const [period, setPeriod] = useState<string>('last_7_days');
    const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
    const [departmentId, setDepartmentId] = useState<number | undefined>(
        isManagerOnly ? Number(managerDeptId) : undefined
    );
    const [courseId, setCourseId] = useState<number | undefined>(undefined);

    // 3-level cascading dept state
    const [selectedLevel1, setSelectedLevel1] = useState<number | null | undefined>(undefined);
    const [selectedLevel2, setSelectedLevel2] = useState<number | null | undefined>(undefined);
    const [selectedLevel3, setSelectedLevel3] = useState<number | null | undefined>(undefined);

    // Data State
    const [reportData, setReportData] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [departments, setDepartments] = useState<any[]>([]);
    const [courses, setCourses] = useState<any[]>([]);
    const [searchText, setSearchText] = useState<string>('');
    const [activeMetric, setActiveMetric] = useState<'hours' | 'enrollments' | 'completions'>('hours');

    // Fetch initial list of courses and departments
    useEffect(() => {
        const loadFilterOptions = async () => {
            try {
                const [depts, allCourses] = await Promise.all([
                    departmentService.getAll(),
                    courseService.getAll()
                ]);
                setDepartments(depts);
                setCourses(allCourses);
            } catch (error) {
                console.error('Error loading filter options:', error);
            }
        };
        loadFilterOptions();
    }, []);

    // 3-level handlers
    const handleDeptChange = (val: number | undefined) => setDepartmentId(val);

    const handleLevel1Change = (val: number | null | undefined) => {
        setSelectedLevel1(val);
        setSelectedLevel2(null);
        setSelectedLevel3(null);
        handleDeptChange(val === null ? undefined : val);
    };

    const handleLevel2Change = (val: number | null | undefined) => {
        setSelectedLevel2(val);
        setSelectedLevel3(null);
        const actual = val === null ? undefined : val;
        handleDeptChange(actual ?? (selectedLevel1 === null ? undefined : selectedLevel1));
    };

    const handleLevel3Change = (val: number | null | undefined) => {
        setSelectedLevel3(val);
        const actual = val === null ? undefined : val;
        handleDeptChange(actual ?? (selectedLevel2 === null ? undefined : selectedLevel2));
    };

    // Load main report data
    const fetchReport = useCallback(async () => {
        setLoading(true);
        try {
            const params: any = {
                groupBy,
                period,
                ...(departmentId && { departmentId }),
                ...(courseId && { courseId })
            };

            if (period === 'custom' && dateRange) {
                params.startDate = dateRange[0].format('YYYY-MM-DD');
                params.endDate = dateRange[1].format('YYYY-MM-DD');
            }

            const data = await statsService.getLearningReport(params);
            setReportData(data);
        } catch (error) {
            console.error('Failed to load learning report:', error);
        } finally {
            setLoading(false);
        }
    }, [groupBy, period, dateRange, departmentId, courseId]);

    useEffect(() => {
        fetchReport();
    }, [fetchReport]);

    const handlePeriodChange = (val: string) => {
        setPeriod(val);
        if (val !== 'custom') {
            setDateRange(null);
        } else {
            setDateRange([dayjs().subtract(7, 'days'), dayjs()]);
        }
    };

    // Client-side search and filtering for table
    const filteredTableData = reportData?.tableData?.filter((item: any) => {
        const text = searchText.toLowerCase();
        return (
            item.fullName.toLowerCase().includes(text) ||
            item.employeeId.toLowerCase().includes(text) ||
            item.departmentName.toLowerCase().includes(text)
        );
    }) || [];

    // Export Table Data to XLSX
    const handleExportXLSX = () => {
        if (!filteredTableData || filteredTableData.length === 0) return;

        const data = filteredTableData.map((row: any) => ({
            'Mã nhân sự': row.employeeId,
            'Họ và tên': row.fullName,
            'Phòng ban': row.departmentName,
            'Thời lượng học (Giờ)': row.learningHours,
            'Số bài đăng ký': row.enrollments,
            'Khóa học hoàn thành': row.completions
        }));

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Hoạt động học tập');

        XLSX.writeFile(workbook, `bao_cao_hoat_dong_hoc_tap_${dayjs().format('YYYYMMDD')}.xlsx`);
    };

    // Table structure
    const columns = [
        {
            title: 'Mã NV',
            dataIndex: 'employeeId',
            key: 'employeeId',
            sorter: (a: any, b: any) => a.employeeId.localeCompare(b.employeeId),
        },
        {
            title: 'Họ và tên',
            dataIndex: 'fullName',
            key: 'fullName',
            sorter: (a: any, b: any) => a.fullName.localeCompare(b.fullName),
        },
        {
            title: 'Phòng ban',
            dataIndex: 'departmentName',
            key: 'departmentName',
            sorter: (a: any, b: any) => a.departmentName.localeCompare(b.departmentName),
        },
        {
            title: 'Thời gian học (Giờ)',
            dataIndex: 'learningHours',
            key: 'learningHours',
            sorter: (a: any, b: any) => a.learningHours - b.learningHours,
            render: (val: number) => <strong>{val} h</strong>,
        },
        {
            title: 'Khóa đăng ký',
            dataIndex: 'enrollments',
            key: 'enrollments',
            sorter: (a: any, b: any) => a.enrollments - b.enrollments,
        },
        {
            title: 'Khóa học hoàn thành',
            dataIndex: 'completions',
            key: 'completions',
            sorter: (a: any, b: any) => a.completions - b.completions,
        }
    ];

    // Chart metric config
    const metricConfigs = {
        hours: {
            title: 'Thời lượng học (Giờ)',
            color: '#C72127',
            dataKey: 'hours',
            label: 'Số giờ học'
        },
        enrollments: {
            title: 'Lượt đăng ký mới',
            color: '#1890ff',
            dataKey: 'enrollments',
            label: 'Lượt đăng ký'
        },
        completions: {
            title: 'Khóa học hoàn thành',
            color: '#52c41a',
            dataKey: 'completions',
            label: 'Khóa hoàn thành'
        }
    };

    return (
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
            {/* Filters Card */}
            <Card bordered={false} style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.02)', borderRadius: 12 }}>
                <Row gutter={[16, 16]} align="middle">
                    <Col xs={24} sm={12} md={6}>
                        <div style={{ fontWeight: 500, marginBottom: 8 }}>Gom nhóm theo</div>
                        <Segmented
                            value={groupBy}
                            onChange={(val: any) => setGroupBy(val)}
                            options={[
                                { label: 'Ngày', value: 'day' },
                                { label: 'Tuần', value: 'week' },
                                { label: 'Tháng', value: 'month' }
                            ]}
                            block
                        />
                    </Col>

                    <Col xs={24} sm={12} md={6}>
                        <div style={{ fontWeight: 500, marginBottom: 8 }}>Khoảng thời gian</div>
                        <Select
                            value={period}
                            onChange={handlePeriodChange}
                            style={{ width: '100%' }}
                            options={[
                                { label: '7 ngày qua', value: 'last_7_days' },
                                { label: '30 ngày qua', value: 'last_30_days' },
                                { label: 'Tháng này', value: 'this_month' },
                                { label: 'Tháng trước', value: 'last_month' },
                                { label: '3 tháng qua', value: 'last_3_months' },
                                { label: 'Tùy chọn', value: 'custom' }
                            ]}
                        />
                    </Col>

                    {period === 'custom' && (
                        <Col xs={24} sm={24} md={6}>
                            <div style={{ fontWeight: 500, marginBottom: 8 }}>Chọn ngày</div>
                            <RangePicker
                                value={dateRange}
                                onChange={(dates: any) => setDateRange(dates)}
                                format="DD/MM/YYYY"
                                style={{ width: '100%' }}
                            />
                        </Col>
                    )}

                    {/* Department 3-level cascading dropdowns */}
                    {isManagerOnly ? (
                        <Col xs={24} sm={12} md={6}>
                            <div style={{ fontWeight: 500, marginBottom: 8 }}>Phòng ban</div>
                            <span style={{ padding: '0 8px', color: '#666', fontStyle: 'italic', fontSize: 13 }}>
                                <strong style={{ color: '#C72127' }}>
                                    {departments.find((d: any) => d.id === departmentId)?.name || '...'}
                                </strong>
                            </span>
                        </Col>
                    ) : (
                        <>
                            <Col xs={24} sm={8} md={4}>
                                <div style={{ fontWeight: 500, marginBottom: 8 }}>Khối</div>
                                <Select
                                    placeholder="Tất cả khối"
                                    style={{ width: '100%' }}
                                    allowClear
                                    value={selectedLevel1}
                                    onChange={handleLevel1Change}
                                    options={[
                                        { value: null as any, label: 'Tất cả' },
                                        ...departments.filter((d: any) => !d.parent_id).map((d: any) => ({ value: d.id, label: d.name }))
                                    ]}
                                />
                            </Col>
                            <Col xs={24} sm={8} md={4}>
                                <div style={{ fontWeight: 500, marginBottom: 8 }}>Phòng ban</div>
                                <Select
                                    placeholder="Chọn phòng ban"
                                    style={{ width: '100%' }}
                                    allowClear
                                    disabled={!selectedLevel1}
                                    value={selectedLevel2}
                                    onChange={handleLevel2Change}
                                    options={[
                                        { value: null as any, label: 'Tất cả' },
                                        ...departments.filter((d: any) => d.parent_id === selectedLevel1).map((d: any) => ({ value: d.id, label: d.name }))
                                    ]}
                                />
                            </Col>
                            <Col xs={24} sm={8} md={4}>
                                <div style={{ fontWeight: 500, marginBottom: 8 }}>Tổ/Nhóm</div>
                                <Select
                                    placeholder="Chọn tổ/nhóm"
                                    style={{ width: '100%' }}
                                    allowClear
                                    disabled={!selectedLevel2}
                                    value={selectedLevel3}
                                    onChange={handleLevel3Change}
                                    options={[
                                        { value: null as any, label: 'Tất cả' },
                                        ...departments.filter((d: any) => d.parent_id === selectedLevel2).map((d: any) => ({ value: d.id, label: d.name }))
                                    ]}
                                />
                            </Col>
                        </>
                    )}

                    <Col xs={24} sm={12} md={period === 'custom' ? 24 : 6}>
                        <div style={{ fontWeight: 500, marginBottom: 8 }}>Khóa học</div>
                        <Select
                            placeholder="Tất cả khóa học"
                            value={courseId}
                            onChange={(val) => setCourseId(val)}
                            style={{ width: '100%' }}
                            allowClear
                            showSearch
                            optionFilterProp="label"
                            options={courses.map(course => ({ value: course.id, label: course.title }))}
                        />
                    </Col>
                </Row>
            </Card>

            {/* Overview Summary Widgets */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={8}>
                    <Card bordered={false} loading={loading} style={{ borderLeft: '4px solid #C72127', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <Statistic
                            title="Tổng thời lượng học"
                            value={reportData?.summary?.totalHours || 0}
                            precision={1}
                            suffix=" giờ"
                            prefix={<ClockCircleOutlined style={{ color: '#C72127', marginRight: 8 }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} loading={loading} style={{ borderLeft: '4px solid #1890ff', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <Statistic
                            title="Lượt đăng ký mới"
                            value={reportData?.summary?.totalEnrollments || 0}
                            prefix={<UserAddOutlined style={{ color: '#1890ff', marginRight: 8 }} />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={8}>
                    <Card bordered={false} loading={loading} style={{ borderLeft: '4px solid #52c41a', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                        <Statistic
                            title="Khóa học hoàn thành"
                            value={reportData?.summary?.totalCompletions || 0}
                            prefix={<BookOutlined style={{ color: '#52c41a', marginRight: 8 }} />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Chart Card */}
            <Card 
                bordered={false} 
                loading={loading} 
                title="Xu hướng hoạt động học tập" 
                style={{ borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
                extra={
                    <Segmented
                        value={activeMetric}
                        onChange={(val: any) => setActiveMetric(val)}
                        options={[
                            { label: 'Thời lượng học', value: 'hours' },
                            { label: 'Đăng ký mới', value: 'enrollments' },
                            { label: 'Khóa học hoàn thành', value: 'completions' }
                        ]}
                    />
                }
            >
                {reportData?.chartData && reportData.chartData.length > 0 ? (
                    <div style={{ width: '100%', height: 350 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={reportData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis 
                                    dataKey="label" 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                                    dy={10}
                                />
                                <YAxis 
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 11 }}
                                />
                                <RechartsTooltip 
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                                    cursor={{ fill: '#f1f5f9' }}
                                />
                                <Bar 
                                    dataKey={metricConfigs[activeMetric].dataKey} 
                                    name={metricConfigs[activeMetric].label}
                                    fill={metricConfigs[activeMetric].color}
                                    radius={[4, 4, 0, 0]}
                                    barSize={groupBy === 'month' ? 40 : 25}
                                >
                                    {reportData.chartData.map((entry: any, index: number) => (
                                        <Cell 
                                            key={`cell-${index}`} 
                                            fill={metricConfigs[activeMetric].color}
                                            fillOpacity={0.85}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <Empty description="Không có dữ liệu trong khoảng thời gian này" />
                )}
            </Card>

            {/* Detailed Table Card */}
            <Card 
                bordered={false} 
                loading={loading}
                title="Bảng thống kê chi tiết theo nhân sự" 
                style={{ borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}
                extra={
                    <Space size={12}>
                        <Input
                            placeholder="Tìm nhân viên, phòng ban..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            style={{ width: 220, borderRadius: 8 }}
                            allowClear
                        />
                        <Button 
                            type="primary" 
                            icon={<DownloadOutlined />} 
                            onClick={handleExportXLSX}
                            disabled={filteredTableData.length === 0}
                            style={{ background: '#B8121A', borderColor: '#B8121A', borderRadius: 8 }}
                        >
                            Xuất Excel (.xlsx)
                        </Button>
                    </Space>
                }
            >
                <div style={{ overflowX: 'auto' }}>
                    <Table
                        dataSource={filteredTableData}
                        columns={columns}
                        rowKey="userId"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng số ${total} học viên`
                        }}
                        style={{ borderRadius: 8 }}
                    />
                </div>
            </Card>
        </Space>
    );
}
