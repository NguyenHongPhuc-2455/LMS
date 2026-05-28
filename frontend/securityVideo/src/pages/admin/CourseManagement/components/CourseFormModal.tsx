import { Modal, Form, Row, Col, Input, Select, Space, Upload, Button, Switch, InputNumber, Typography, Tag, DatePicker, TreeSelect } from 'antd';
import { UploadCloud } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import dayjs from 'dayjs';
import { WarningOutlined, UserAddOutlined, CloseCircleOutlined } from '@ant-design/icons';
import styles from '../CourseManagement.module.scss';
import { UserSelectionModal } from './UserSelectionModal';
import { userService } from '../../../../services/user.service';

const { Option } = Select;
const { Text, Title } = Typography;

import { type Course } from '../../../../types/course';

interface CourseFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (values: Partial<Course>, thumbFile: File | null) => Promise<void>;
    editingId?: number | null;
    initialValues?: Partial<Course>;
    categories: any[];
    departments: any[];
    positions: any[];
    users?: any[];
    loading?: boolean;
}

export default function CourseFormModal({ open, onCancel, onSuccess, editingId, initialValues, categories, departments, positions, users, loading }: CourseFormModalProps) {
    const [form] = Form.useForm();
    const [thumbFile, setThumbFile] = useState<File | null>(null);
    const [thumbUrl, setThumbUrl] = useState<string>('');
    const [isMandatory, setIsMandatory] = useState(false);
    const [applyScope, setApplyScope] = useState<string>('ALL_EMPLOYEE');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    
    const [selectedL1, setSelectedL1] = useState<number | null>(null);
    const [selectedL2, setSelectedL2] = useState<number | null>(null);
    const [selectedL3, setSelectedL3] = useState<number | null>(null);

    const [deadlineType, setDeadlineType] = useState<'days' | 'range'>('days');

    const [usersList, setUsersList] = useState<any[]>([]);
    const [usersLoading, setUsersLoading] = useState(false);

    // Danh sách users hiệu quả: ưu tiên prop từ parent, fallback về state đã fetch
    const effectiveUsers = (users && users.length > 0) ? users : usersList;
    
    const departmentTreeData = useMemo(() => {
        if (!departments || departments.length === 0) return [];
        const map = new Map();
        departments.forEach(item => {
            map.set(item.id, { value: item.id, title: item.name, parent_id: item.parent_id, children: [] });
        });
        const tree: any[] = [];
        departments.forEach(item => {
            const node = map.get(item.id);
            if (item.parent_id) {
                const parent = map.get(item.parent_id);
                if (parent) {
                    parent.children.push(node);
                } else {
                    tree.push(node);
                }
            } else {
                tree.push(node);
            }
        });
        const cleanTree = (nodes: any[]) => {
            nodes.forEach(node => {
                if (node.children.length === 0) {
                    delete node.children;
                } else {
                    cleanTree(node.children);
                }
            });
        };
        cleanTree(tree);
        return tree;
    }, [departments]);

    const selectedUserIds = Form.useWatch('mandatory_targets', form);
    const watchDeadlineType = Form.useWatch('deadline_type', form);

    // Chỉ fetch users khi scope = SPECIFIC_USER và chưa có dữ liệu từ prop
    useEffect(() => {
        if (open && applyScope === 'SPECIFIC_USER' && effectiveUsers.length === 0) {
            setUsersLoading(true);
            userService.getAll({ limit: 500, page: 1 })
                .then(res => setUsersList(res.users || []))
                .catch(() => {})
                .finally(() => setUsersLoading(false));
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, applyScope]);

    useEffect(() => {
        if (watchDeadlineType) {
            setDeadlineType(watchDeadlineType);
        }
    }, [watchDeadlineType]);

    useEffect(() => {
        if (open) {
            if (editingId && initialValues) {
                setIsMandatory(!!initialValues.is_mandatory);
                setApplyScope(initialValues.apply_scope || 'ALL_EMPLOYEE');
                setThumbUrl(initialValues.thumbnail || '');
                
                const dtype = (initialValues.mandatory_start_date && initialValues.mandatory_end_date) ? 'range' : 'days';
                setDeadlineType(dtype);

                form.setFieldsValue({
                    ...initialValues,
                    deadline_type: dtype,
                    mandatory_date_range: (initialValues.mandatory_start_date && initialValues.mandatory_end_date) 
                        ? [dayjs(initialValues.mandatory_start_date), dayjs(initialValues.mandatory_end_date)] 
                        : null,
                    allow_early_access: initialValues.allow_early_access !== undefined ? initialValues.allow_early_access : true
                });

                // Extract department hierarchy
                let targets = initialValues.mandatory_targets;
                if (targets && typeof targets === 'string') {
                    try {
                        targets = JSON.parse(targets);
                    } catch (e) {}
                }
                const deptId = Array.isArray(targets) && targets.length > 0 ? Number(targets[0]) : null;
                if (deptId && departments && departments.length > 0) {
                    const dept = departments.find(d => d.id === deptId);
                    if (dept) {
                        if (!dept.parent_id) {
                            setSelectedL1(dept.id);
                            setSelectedL2(null);
                            setSelectedL3(null);
                        } else {
                            const parent = departments.find(d => d.id === dept.parent_id);
                            if (parent) {
                                if (!parent.parent_id) {
                                    setSelectedL1(parent.id);
                                    setSelectedL2(dept.id);
                                    setSelectedL3(null);
                                } else {
                                    setSelectedL1(parent.parent_id);
                                    setSelectedL2(parent.id);
                                    setSelectedL3(dept.id);
                                }
                            }
                        }
                    }
                } else {
                    setSelectedL1(null);
                    setSelectedL2(null);
                    setSelectedL3(null);
                }
            } else {
                form.resetFields();
                setThumbUrl('');
                setIsMandatory(false);
                setApplyScope('ALL_EMPLOYEE');
                setSelectedL1(null);
                setSelectedL2(null);
                setSelectedL3(null);
            }
            setThumbFile(null);
        }
    }, [open, editingId, initialValues, form, departments]);

    const handleFinish = async (values: any) => {
        const { deadline_type: _dt, mandatory_date_range, ...rest } = values;
        
        // Ưu tiên dùng state `deadlineType` vì form field `deadline_type` chỉ
        // được mount khi switch `is_mandatory` đang BẬT. Nếu field chưa mount,
        // giá trị từ form sẽ là undefined và deadline sẽ bị xóa sai.
        const effectiveDeadlineType = deadlineType;
        
        const finalValues = {
            ...rest,
            mandatory_deadline_days: effectiveDeadlineType === 'days' ? (rest.mandatory_deadline_days ?? null) : null,
            mandatory_start_date: effectiveDeadlineType === 'range' && mandatory_date_range ? mandatory_date_range[0].toISOString() : null,
            mandatory_end_date: effectiveDeadlineType === 'range' && mandatory_date_range ? mandatory_date_range[1].toISOString() : null
        };
        
        await onSuccess(finalValues, thumbFile);
    };

    return (
        <Modal
            title={editingId ? "Chỉnh sửa Khóa học" : "Khởi tạo Khóa học"}
            open={open}
            onCancel={onCancel}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <Button onClick={onCancel} className="modal-action-btn">
                        Hủy
                    </Button>
                    <Button type="primary" onClick={() => form.submit()} loading={loading} className="btn-brand-primary modal-action-btn">
                        {editingId ? "Cập nhật" : "Thêm mới"}
                    </Button>
                </div>
            }
            width={1250}
            style={{ top: editingId ? 20 : 60 }}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish} key={editingId || 'new'} style={{ marginTop: 20 }}>
                <Row gutter={24}>
                    {/* Cột 1: Thông tin cơ bản */}
                    <Col span={8}>
                        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '5px', height: '100%', border: '1px solid #eee' }}>
                            <Title level={5} style={{ marginBottom: 20, fontSize: '14px', color: '#B8121A', textTransform: 'uppercase', fontWeight: 700 }}>
                                1. Thông tin cơ bản
                            </Title>
                            
                            <Form.Item name="title" label="Tiêu đề khóa học" rules={[{ required: true }]} style={{ marginBottom: 20 }}>
                                <Input placeholder="Nhập tiêu đề..." />
                            </Form.Item>

                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item name="level" label="Trình độ" initialValue="Cơ bản" style={{ marginBottom: 20 }}>
                                        <Select>
                                            <Option value="Cơ bản">Cơ bản</Option>
                                            <Option value="Trung cấp">Trung cấp</Option>
                                            <Option value="Nâng cao">Nâng cao</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="category_id" label="Danh mục" style={{ marginBottom: 20 }}>
                                        <Select placeholder="Chọn" allowClear>
                                            {categories.map(cat => (
                                                <Option key={cat.id} value={cat.id}>{cat.name}</Option>
                                            ))}
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="description" label="Mô tả tóm tắt" style={{ marginBottom: 20 }}>
                                <Input.TextArea rows={4} placeholder="Mô tả nội dung chính..." />
                            </Form.Item>

                            <Form.Item name="is_private" label="Chế độ truy cập" initialValue={false} style={{ marginBottom: 0 }}>
                                <Select>
                                    <Option value={false}>Công khai (Tất cả học viên)</Option>
                                    <Option value={true}>Riêng tư (Cần được chỉ định)</Option>
                                </Select>
                            </Form.Item>
                        </div>
                    </Col>

                    {/* Cột 2: Đối tượng áp dụng & Bắt buộc */}
                    <Col span={8}>
                        <div style={{ 
                            padding: '20px', 
                            background: '#f8f9fa', 
                            borderRadius: '5px', 
                            height: '100%',
                            border: '1px solid #eee',
                            transition: 'all 0.3s'
                        }}>
                            <Title level={5} style={{ marginBottom: 20, fontSize: '14px', color: '#B8121A', textTransform: 'uppercase', fontWeight: 700 }}>
                                2. Đối tượng áp dụng
                            </Title>

                            <Form.Item name="apply_scope" label="Phạm vi áp dụng" initialValue="ALL_EMPLOYEE" style={{ marginBottom: 20 }}>
                                <Select onChange={val => {
                                    setApplyScope(val);
                                    form.setFieldsValue({ mandatory_targets: null });
                                    setSelectedL1(null);
                                    setSelectedL2(null);
                                    setSelectedL3(null);
                                }}>
                                    <Option value="ALL_EMPLOYEE">Toàn bộ nhân viên</Option>
                                    <Option value="BY_DEPARTMENT">Theo phòng ban</Option>
                                    <Option value="BY_POSITION">Theo vị trí</Option>
                                    <Option value="SPECIFIC_USER">Nhân viên cụ thể</Option>
                                    <Option value="NEW_EMPLOYEE">Chỉ nhân viên mới</Option>
                                    <Option value="NEW_EMPLOYEE_BY_DEPARTMENT">NV mới - Phòng ban</Option>
                                    <Option value="NEW_EMPLOYEE_BY_POSITION">NV mới - Vị trí</Option>
                                </Select>
                            </Form.Item>

                            {['BY_DEPARTMENT', 'NEW_EMPLOYEE_BY_DEPARTMENT'].includes(applyScope) && (
                                <>
                                    <Form.Item label="Chọn Khối" required style={{ marginBottom: 12 }}>
                                        <Select
                                            placeholder="Chọn Khối"
                                            value={selectedL1}
                                            onChange={(val) => {
                                                setSelectedL1(val);
                                                setSelectedL2(null);
                                                setSelectedL3(null);
                                                form.setFieldsValue({ mandatory_targets: val ? [val] : null });
                                            }}
                                            options={[
                                                { value: null as any, label: 'Tất cả' },
                                                ...departments.filter((d: any) => !d.parent_id).map((d: any) => ({ value: d.id, label: d.name }))
                                            ]}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Chọn Phòng ban" style={{ marginBottom: 12 }}>
                                        <Select
                                            placeholder="Chọn Phòng ban"
                                            disabled={!selectedL1}
                                            value={selectedL2}
                                            onChange={(val) => {
                                                setSelectedL2(val);
                                                setSelectedL3(null);
                                                form.setFieldsValue({ mandatory_targets: val ? [val] : (selectedL1 ? [selectedL1] : null) });
                                            }}
                                            options={[
                                                { value: null as any, label: 'Tất cả' },
                                                ...departments.filter((d: any) => d.parent_id === selectedL1).map((d: any) => ({ value: d.id, label: d.name }))
                                            ]}
                                        />
                                    </Form.Item>
                                    <Form.Item label="Chọn Tổ/Nhóm" style={{ marginBottom: 20 }}>
                                        <Select
                                            placeholder="Chọn Tổ/Nhóm"
                                            disabled={!selectedL2}
                                            value={selectedL3}
                                            onChange={(val) => {
                                                setSelectedL3(val);
                                                form.setFieldsValue({ mandatory_targets: val ? [val] : (selectedL2 ? [selectedL2] : (selectedL1 ? [selectedL1] : null)) });
                                            }}
                                            options={[
                                                { value: null as any, label: 'Tất cả' },
                                                ...departments.filter((d: any) => d.parent_id === selectedL2).map((d: any) => ({ value: d.id, label: d.name }))
                                            ]}
                                        />
                                    </Form.Item>
                                    <Form.Item name="mandatory_targets" noStyle rules={[{ required: true, message: 'Vui lòng chọn ít nhất một phòng ban' }]}>
                                        <input type="hidden" />
                                    </Form.Item>
                                </>
                            )}

                            {['BY_POSITION', 'NEW_EMPLOYEE_BY_POSITION'].includes(applyScope) && (
                                <Form.Item name="mandatory_targets" label="Chọn vị trí" rules={[{ required: true }]} style={{ marginBottom: 20 }}>
                                    <Select mode="multiple" placeholder="Chọn..." maxTagCount="responsive">
                                        {positions?.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                                    </Select>
                                </Form.Item>
                            )}

                            {applyScope === 'SPECIFIC_USER' && (
                                <Form.Item name="mandatory_targets" label="Nhân viên áp dụng" rules={[{ required: true }]} style={{ marginBottom: 20 }}>
                                    <Button block type="dashed" icon={<UserAddOutlined />} onClick={() => setIsUserModalOpen(true)} style={{ height: 40 }}>
                                        {selectedUserIds?.length || 0} nhân viên đã chọn
                                    </Button>
                                </Form.Item>
                            )}

                            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px dashed #d9d9d9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <Title level={5} style={{ marginBottom: 0, fontSize: '14px', color: isMandatory ? '#cf1322' : '#8c8c8c', textTransform: 'uppercase', fontWeight: 700 }}>
                                        Khóa học bắt buộc
                                    </Title>
                                    <Form.Item name="is_mandatory" valuePropName="checked" noStyle>
                                        <Switch 
                                            checkedChildren="BẬT" 
                                            unCheckedChildren="TẮT" 
                                            onChange={val => setIsMandatory(val)}
                                        />
                                    </Form.Item>
                                </div>

                                {isMandatory ? (
                                    <div style={{ background: 'rgba(255,255,255,0.8)', padding: '15px', borderRadius: '5px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <Form.Item name="deadline_type" label="Thiết lập thời hạn (Deadline)" initialValue="days" style={{ marginBottom: 15 }}>
                                            <Select onChange={val => setDeadlineType(val)}>
                                                <Option value="days">Số ngày từ khi vào làm/gửi</Option>
                                                <Option value="range">Khoảng ngày cố định</Option>
                                            </Select>
                                        </Form.Item>

                                        {deadlineType === 'days' ? (
                                            <Form.Item name="mandatory_deadline_days" label="Hạn chót (ngày)" initialValue={60} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                                                <InputNumber min={1} addonAfter="ngày" style={{ width: '100%' }} />
                                            </Form.Item>
                                        ) : (
                                            <>
                                                <Form.Item name="mandatory_date_range" label="Thời gian áp dụng" rules={[{ required: true }]} style={{ marginBottom: 15 }}>
                                                    <DatePicker.RangePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder={['Từ ngày', 'Đến ngày']} />
                                                </Form.Item>
                                                <Form.Item name="allow_early_access" label="Cho phép học trước thời hạn" valuePropName="checked" initialValue={true} style={{ marginBottom: 0 }}>
                                                    <Switch checkedChildren="BẬT" unCheckedChildren="TẮT" />
                                                </Form.Item>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ padding: '20px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5 }}>
                                        <Text type="secondary" strong>Khóa học tự nguyện</Text>
                                        <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', marginTop: 4 }}>Nhân sự được chọn có thể học bất cứ lúc nào</Text>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>

                    {/* Cột 3: Hình ảnh & Nội dung */}
                    <Col span={8}>
                        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '5px', height: '100%', border: '1px solid #eee' }}>
                            <Title level={5} style={{ marginBottom: 20, fontSize: '14px', color: '#8c8c8c', textTransform: 'uppercase', fontWeight: 700 }}>
                                3. Hình ảnh & Nội dung
                            </Title>

                            <Form.Item name="thumbnail" label="Ảnh đại diện (Thumbnail)" style={{ marginBottom: 20 }}>
                                <Input
                                    placeholder="URL hoặc chọn file"
                                    value={thumbUrl}
                                    onChange={e => {
                                        setThumbUrl(e.target.value);
                                        form.setFieldsValue({ thumbnail: e.target.value });
                                    }}
                                    suffix={
                                        <Upload
                                            beforeUpload={file => {
                                                setThumbFile(file);
                                                const reader = new FileReader();
                                                reader.onload = e => setThumbUrl(e.target?.result as string);
                                                reader.readAsDataURL(file);
                                                return false;
                                            }}
                                            showUploadList={false}
                                        >
                                            <UploadCloud size={18} style={{ cursor: 'pointer', color: '#B8121A' }} />
                                        </Upload>
                                    }
                                />
                                {thumbUrl && (
                                    <div style={{ marginTop: 15, textAlign: 'center', borderRadius: '5px', overflow: 'hidden', border: '1px solid #ddd', background: '#fff', padding: '4px', height: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={thumbUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                )}
                            </Form.Item>

                            <Form.Item name="learning_outcomes" label="Mục tiêu bài học" style={{ marginBottom: 20 }}>
                                <Input.TextArea rows={3} placeholder="Học viên sẽ nhận được gì..." />
                            </Form.Item>

                            <Form.Item name="requirements" label="Yêu cầu tham gia" style={{ marginBottom: 0 }}>
                                <Input.TextArea rows={3} placeholder="Kiến thức/Công cụ cần có..." />
                            </Form.Item>
                        </div>
                    </Col>
                </Row>
            </Form>

            <UserSelectionModal
                open={isUserModalOpen}
                onCancel={() => setIsUserModalOpen(false)}
                users={effectiveUsers}
                loading={usersLoading}
                initialSelectedIds={form.getFieldValue('mandatory_targets') || []}
                onOk={(selectedIds) => {
                    form.setFieldsValue({ mandatory_targets: selectedIds });
                    setIsUserModalOpen(false);
                }}
            />
        </Modal>
    );
}
