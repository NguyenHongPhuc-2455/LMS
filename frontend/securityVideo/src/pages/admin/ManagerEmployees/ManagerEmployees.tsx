import React, { useState, useEffect } from 'react';
import { Table, Input, Select, Button, Typography, Card, Space, Avatar, Progress, Tooltip, Drawer, Tabs, Tag, Modal, Input as AntdInput, message } from 'antd';
import { UserOutlined, SearchOutlined, ReloadOutlined, BellOutlined, BookOutlined, CalendarOutlined, CheckCircleOutlined, InfoCircleOutlined, DownloadOutlined } from '@ant-design/icons';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { managerService, type Employee, type CourseProgress } from '@/services/manager.service';
import { positionService } from '@/services/position.service';
import { departmentService } from '@/services/department.service';
import styles from './ManagerEmployees.module.scss';

const { Title, Text } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

export default function ManagerEmployees() {
    const userStr = localStorage.getItem('user');
    const currentUser = userStr ? JSON.parse(userStr) : null;
    const managerDeptId = currentUser?.department_id;

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [selectedPosition, setSelectedPosition] = useState<number | undefined>(undefined);

    // Cascading states
    const [selectedLevel1, setSelectedLevel1] = useState<number | undefined>();
    const [selectedLevel2, setSelectedLevel2] = useState<number | undefined>();
    const [selectedLevel3, setSelectedLevel3] = useState<number | undefined>();
    const [filterDeptId, setFilterDeptId] = useState<number | undefined>(managerDeptId);

    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Detail Drawer & Reminder
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
    const [employeeDetail, setEmployeeDetail] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Reminder Modal
    const [reminderModalOpen, setReminderModalOpen] = useState(false);
    const [reminderText, setReminderText] = useState('Chào bạn, tôi vừa kiểm tra tiến độ học tập và thấy bạn có một số khóa học bắt buộc sắp đến hạn. Vui lòng tập trung hoàn thành đúng hạn nhé!');
    const [reminderLoading, setReminderLoading] = useState(false);

    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        fetchPositions();
        fetchDepartments();
    }, []);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [search]);

    useEffect(() => {
        fetchEmployees();
    }, [page, selectedPosition, filterDeptId, debouncedSearch]);

    const fetchDepartments = async () => {
        try {
            const data = await departmentService.getAll();
            setDepartments(data);
        } catch (err) {
            console.error('Lỗi tải phòng ban:', err);
        }
    };

    const fetchPositions = async () => {
        try {
            const data = await positionService.getAll();
            setPositions(data);
        } catch (err) {
            console.error('Lỗi tải vị trí:', err);
        }
    };

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const data = await managerService.getEmployees({
                page,
                limit: 10,
                search: debouncedSearch,
                positionId: selectedPosition,
                departmentId: filterDeptId
            });
            setEmployees(data.employees);
            setTotal(data.total);
        } catch (err) {
            message.error('Không thể tải danh sách nhân sự phòng ban');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setSearch('');
        setSelectedPosition(undefined);
        setFilterDeptId(managerDeptId);
        setPage(1);
    };

    const handleExportXLSX = async () => {
        try {
            // Lấy toàn bộ dữ liệu (không phân trang) để xuất
            const data = await managerService.getEmployees({
                page: 1,
                limit: 9999,
                search: debouncedSearch,
                positionId: selectedPosition,
                departmentId: filterDeptId
            });

            const exportData = data.employees.map((emp: Employee) => ({
                'Mã nhân sự': emp.employee_id || '',
                'Họ và tên': emp.full_name || emp.username,
                'Email': emp.email || '',
                'Chức vụ': emp.position || 'Chưa thiết lập',
                'Ngày tham gia': emp.join_date ? dayjs(emp.join_date).format('DD/MM/YYYY') : 'Chưa cập nhật',
                'Số khóa học': emp.total_courses || 0
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh sách nhân sự');
            XLSX.writeFile(workbook, `nhan_su_phong_ban_${dayjs().format('YYYYMMDD')}.xlsx`);
        } catch (err) {
            message.error('Không thể xuất danh sách nhân sự');
        }
    };

    const handleOpenDetail = async (empId: number) => {
        setSelectedEmployeeId(empId);
        setDrawerOpen(true);
        setDetailLoading(true);
        try {
            const data = await managerService.getEmployeeProgress(empId);
            setEmployeeDetail(data);
        } catch (err) {
            message.error('Không thể lấy chi tiết tiến độ nhân viên');
            setDrawerOpen(false);
        } finally {
            setDetailLoading(false);
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

    // Lấy thông tin cây phòng ban của manager
    useEffect(() => {
        if (!managerDeptId || departments.length === 0) return;
        const currentDept = departments.find(d => d.id === managerDeptId);
        if (!currentDept) return;

        if (!currentDept.parent_id) {
            setSelectedLevel1(currentDept.id);
            setSelectedLevel2(undefined);
            setSelectedLevel3(undefined);
        } else {
            const parentDept = departments.find(d => d.id === currentDept.parent_id);
            if (parentDept) {
                if (!parentDept.parent_id) {
                    setSelectedLevel1(parentDept.id);
                    setSelectedLevel2(currentDept.id);
                    setSelectedLevel3(undefined);
                } else {
                    const grandParentDept = departments.find(d => d.id === parentDept.parent_id);
                    if (grandParentDept) {
                        setSelectedLevel1(grandParentDept.id);
                        setSelectedLevel2(parentDept.id);
                        setSelectedLevel3(currentDept.id);
                    }
                }
            }
        }
    }, [managerDeptId, departments]);

    const handleLevel1Change = (val: number | undefined) => {
        // Manager Cấp 1 có thể đổi con
        setSelectedLevel1(val);
        setSelectedLevel2(undefined);
        setSelectedLevel3(undefined);
        setFilterDeptId(val || managerDeptId);
        setPage(1);
    };

    const handleLevel2Change = (val: number | undefined) => {
        setSelectedLevel2(val);
        setSelectedLevel3(undefined);
        setFilterDeptId(val || selectedLevel1 || managerDeptId);
        setPage(1);
    };

    const handleLevel3Change = (val: number | undefined) => {
        setSelectedLevel3(val);
        setFilterDeptId(val || selectedLevel2 || managerDeptId);
        setPage(1);
    };

    const isLevel1Locked = true; // Luôn khóa Khối (vì manager chỉ xem trong khối của mình)
    const isLevel2Locked = !!departments.find(d => d.id === managerDeptId)?.parent_id; // Nếu manager ở Cấp 2 hoặc 3 -> khóa Cấp 2
    const isLevel3Locked = !!departments.find(d => d.id === managerDeptId && d.parent_id && departments.find(p => p.id === d.parent_id)?.parent_id); // Nếu manager ở Cấp 3 -> khóa Cấp 3

    const level1Options = departments.filter(d => !d.parent_id);
    const level2Options = departments.filter(d => selectedLevel1 ? d.parent_id === selectedLevel1 : false);
    const level3Options = departments.filter(d => selectedLevel2 ? d.parent_id === selectedLevel2 : false);

    const columns = [
        {
            title: 'Học viên',
            key: 'employee',
            render: (emp: Employee) => (
                <Space>
                    <Avatar src={emp.avatar} icon={<UserOutlined />} style={{ border: '2px solid rgba(199, 33, 39, 0.1)' }} />
                    <div>
                        <Text strong style={{ display: 'block', fontSize: '14px' }}>{emp.full_name || emp.username}</Text>
                        <Text type="secondary" style={{ fontSize: '12px' }}>ID: {emp.employee_id || 'Chưa cập nhật'}</Text>
                    </div>
                </Space>
            )
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
            render: (email: string) => <Text copyable style={{ fontSize: '13px' }}>{email}</Text>
        },
        {
            title: 'Chức vụ',
            dataIndex: 'position',
            key: 'position',
            render: (pos: string) => <Tag color="blue">{pos}</Tag>
        },
        {
            title: 'Ngày tham gia',
            dataIndex: 'join_date',
            key: 'join_date',
            render: (date: string) => date ? new Date(date).toLocaleDateString('vi-VN') : 'Chưa cập nhật'
        },
        {
            title: 'Khóa học tham gia',
            dataIndex: 'total_courses',
            key: 'total_courses',
            align: 'center' as const,
            render: (count: number) => <Tag color="volcano" style={{ fontWeight: 'bold' }}>{count} khóa</Tag>
        },
        {
            title: 'Hành động',
            key: 'actions',
            align: 'center' as const,
            render: (emp: Employee) => (
                <Space>
                    <Button
                        type="primary"
                        size="small"
                        icon={<InfoCircleOutlined />}
                        onClick={() => handleOpenDetail(emp.id)}
                        className={styles.detailBtn}
                    >
                        Xem tiến độ
                    </Button>
                    <Button
                        type="dashed"
                        danger
                        size="small"
                        icon={<BellOutlined />}
                        onClick={() => {
                            setSelectedEmployeeId(emp.id);
                            setReminderText(`Chào bạn ${emp.full_name || emp.username}, tôi vừa kiểm tra tiến độ học tập và thấy bạn có một số khóa học bắt buộc chưa hoàn thành. Hãy sắp xếp thời gian hoàn thành đúng hạn nhé!`);
                            setReminderModalOpen(true);
                        }}
                    >
                        Nhắc nhở
                    </Button>
                </Space>
            )
        }
    ];

    return (
        <div className={styles.container}>
            {/* <div className={styles.pageHeader}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>Thành viên phòng ban</Title>
                    <Text type="secondary">Theo dõi lộ trình học tập, quản lý tiến độ và đôn đốc học tập nhân sự</Text>
                </div>
            </div> */}

            <Card className="glass-card" style={{ marginBottom: 24 }}>
                <div className={styles.searchBarWrapper}>
                    <div className={styles.headerLeft}>
                        <Input
                            placeholder="Tìm kiếm tên, mã nhân viên, email..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            prefix={<SearchOutlined className={styles.searchIcon} />}
                            className={styles.searchBar}
                            allowClear
                        />
                        <Space size={8} style={{ display: 'flex', alignItems: 'center' }}>
                            <Select
                                placeholder="Chọn Khối"
                                value={selectedLevel1}
                                onChange={handleLevel1Change}
                                style={{ width: 140 }}
                                allowClear={!isLevel1Locked}
                                disabled={isLevel1Locked}
                            >
                                {level1Options.map(d => (
                                    <Option key={d.id} value={d.id}>{d.name}</Option>
                                ))}
                            </Select>

                            <Select
                                placeholder="Chọn Phòng ban"
                                value={selectedLevel2}
                                onChange={handleLevel2Change}
                                style={{ width: 150 }}
                                allowClear={!isLevel2Locked}
                                disabled={!selectedLevel1 || isLevel2Locked}
                            >
                                {level2Options.map(d => (
                                    <Option key={d.id} value={d.id}>{d.name}</Option>
                                ))}
                            </Select>

                            <Select
                                placeholder="Chọn Tổ/Nhóm"
                                value={selectedLevel3}
                                onChange={handleLevel3Change}
                                style={{ width: 140 }}
                                allowClear={!isLevel3Locked}
                                disabled={!selectedLevel2 || isLevel3Locked}
                            >
                                {level3Options.map(d => (
                                    <Option key={d.id} value={d.id}>{d.name}</Option>
                                ))}
                            </Select>
                        </Space>
                        <Select
                            placeholder="Chọn chức vụ"
                            value={selectedPosition}
                            onChange={setSelectedPosition}
                            style={{ width: 160 }}
                            allowClear
                        >
                            {positions.map(pos => (
                                <Option key={pos.id} value={pos.id}>{pos.name}</Option>
                            ))}
                        </Select>
                    </div>

                    <div className={styles.headerRight}>
                        <Button icon={<ReloadOutlined />} onClick={handleReset}>Làm mới</Button>
                        <Button
                            type="primary"
                            icon={<DownloadOutlined />}
                            onClick={handleExportXLSX}
                            style={{ background: '#B8121A', borderColor: '#B8121A', borderRadius: 8 }}
                        >
                            Xuất File
                        </Button>
                    </div>
                </div>

                <Table
                    columns={columns}
                    dataSource={employees}
                    rowKey="id"
                    loading={loading}
                    pagination={{
                        current: page,
                        pageSize: 10,
                        total,
                        onChange: setPage,
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
                    className={styles.employeeTable}
                    locale={{ emptyText: 'Phòng ban của bạn chưa có nhân sự hoặc không trùng bộ lọc' }}
                />
            </Card>

            {/* Chi tiết Tiến độ Học tập của Nhân viên (Drawer) */}
            <Drawer
                title={
                    employeeDetail ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Avatar src={employeeDetail.employee.avatar} icon={<UserOutlined />} size="large" />
                            <div>
                                <Text strong style={{ fontSize: 16, display: 'block' }}>{employeeDetail.employee.full_name}</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>{employeeDetail.employee.position} | MSNV: {employeeDetail.employee.employee_id}</Text>
                            </div>
                        </div>
                    ) : 'Chi tiết tiến độ'
                }
                placement="right"
                width={700}
                onClose={() => setDrawerOpen(false)}
                open={drawerOpen}
                loading={detailLoading}
                className={styles.detailDrawer}
            >
                {employeeDetail && (
                    <Tabs defaultActiveKey="1" style={{ height: '100%' }}>
                        <TabPane tab={<Space><BookOutlined />Tiến độ khóa học bắt buộc</Space>} key="1">
                            <div className={styles.coursesGrid}>
                                {employeeDetail.courses.length === 0 ? (
                                    <div className={styles.emptyCourses}>Nhân viên này chưa ghi danh hoặc chưa được giao khóa học bắt buộc nào.</div>
                                ) : (
                                    employeeDetail.courses.map((course: CourseProgress) => (
                                        <Card key={course.course_id} className={styles.courseCard}>
                                            <div className={styles.courseHeader}>
                                                <div>
                                                    <Space style={{ marginBottom: 6 }}>
                                                        <Tag color={course.is_mandatory ? 'red' : 'blue'}>
                                                            {course.is_mandatory ? 'Bắt buộc' : 'Tự nguyện'}
                                                        </Tag>
                                                        <Tag color="cyan">{course.level}</Tag>
                                                    </Space>
                                                    <Title level={5} style={{ margin: 0, fontSize: 15 }}>{course.title}</Title>
                                                </div>
                                                {course.is_overdue && (
                                                    <Tag color="error" style={{ animation: 'pulse 2s infinite' }}>🚨 Quá hạn học!</Tag>
                                                )}
                                            </div>

                                            <div className={styles.progressSection}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                                        Hoàn thành: {course.completed_count}/{course.total_lessons} bài học
                                                    </Text>
                                                    <Text strong style={{ fontSize: 13, color: '#C72127' }}>{course.progress}%</Text>
                                                </div>
                                                <Progress
                                                    percent={course.progress}
                                                    size="small"
                                                    strokeColor={course.progress === 100 ? '#52c41a' : '#C72127'}
                                                    status={course.progress === 100 ? 'success' : 'active'}
                                                />
                                            </div>

                                            <div className={styles.courseFooter}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    <CalendarOutlined style={{ marginRight: 4 }} />
                                                    Đăng ký: {new Date(course.enrolled_at).toLocaleDateString('vi-VN')}
                                                </Text>
                                                {course.deadline_date && (
                                                    <Text type={course.is_overdue ? 'danger' : 'secondary'} style={{ fontSize: 12, fontWeight: course.is_overdue ? 'bold' : 'normal' }}>
                                                        Hạn chót: {new Date(course.deadline_date).toLocaleDateString('vi-VN')}
                                                    </Text>
                                                )}
                                            </div>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </TabPane>

                        <TabPane tab={<Space><CalendarOutlined />Thông tin chi tiết & Báo cáo</Space>} key="2">
                            <div className={styles.detailReport}>
                                <Title level={5}>Tóm tắt tiến độ chung</Title>
                                <div className={styles.reportSummaryGrid}>
                                    <div className={styles.summaryItem}>
                                        <Text type="secondary" style={{ display: 'block' }}>Tổng số khóa học</Text>
                                        <Text strong style={{ fontSize: 24 }}>{employeeDetail.courses.length}</Text>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <Text type="secondary" style={{ display: 'block' }}>Khóa học hoàn thành</Text>
                                        <Text strong style={{ fontSize: 24, color: '#52c41a' }}>
                                            {employeeDetail.courses.filter((c: any) => c.progress === 100).length}
                                        </Text>
                                    </div>
                                    <div className={styles.summaryItem}>
                                        <Text type="secondary" style={{ display: 'block' }}>Số khóa học quá hạn</Text>
                                        <Text strong style={{ fontSize: 24, color: '#f5222d' }}>
                                            {employeeDetail.courses.filter((c: any) => c.is_overdue).length}
                                        </Text>
                                    </div>
                                </div>

                                <div className={styles.quickRemindBox} style={{ marginTop: 24 }}>
                                    <Title level={5}>Hành động nhanh</Title>
                                    <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                                        Gửi thông báo nhắc nhở và đôn đốc học tập trực tiếp tới tài khoản Ritavo LMS của học viên này.
                                    </Text>
                                    <Button
                                        type="primary"
                                        danger
                                        icon={<BellOutlined />}
                                        onClick={() => {
                                            setReminderText(`Chào bạn ${employeeDetail.employee.full_name}, hãy cố gắng hoàn thành các khóa học bắt buộc đúng hạn nhé!`);
                                            setReminderModalOpen(true);
                                        }}
                                    >
                                        Gửi thông báo đôn đốc học tập
                                    </Button>
                                </div>
                            </div>
                        </TabPane>
                    </Tabs>
                )}
            </Drawer>

            {/* Modal Nhắc nhở */}
            <Modal
                title="Gửi Nhắc Nhở Học Tập Cho Nhân Viên"
                open={reminderModalOpen}
                onCancel={() => setReminderModalOpen(false)}
                onOk={handleSendReminder}
                confirmLoading={reminderLoading}
                okText="Gửi nhắc nhở"
                cancelText="Hủy bỏ"
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
