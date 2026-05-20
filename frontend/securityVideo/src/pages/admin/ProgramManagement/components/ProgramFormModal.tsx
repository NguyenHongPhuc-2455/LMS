import { Modal, Form, Row, Col, Input, Select, Space, Upload, Button, Switch, InputNumber, Typography, DatePicker } from 'antd';
import { UploadCloud } from 'lucide-react';
import { UserAddOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import styles from '../ProgramManagement.module.scss';
import { UserSelectionModal } from '../../CourseManagement/components/UserSelectionModal';

const { Option } = Select;
const { Text, Title } = Typography;

interface ProgramFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (values: any, thumbFile: File | null) => Promise<void>;
    editingId?: number | null;
    initialValues?: any;
    departments: any[];
    positions: any[];
    users: any[];
    loading?: boolean;
}

export default function ProgramFormModal({ open, onCancel, onSuccess, editingId, initialValues, departments, positions, users, loading }: ProgramFormModalProps) {
    const [form] = Form.useForm();
    const [thumbFile, setThumbFile] = useState<File | null>(null);
    const [thumbUrl, setThumbUrl] = useState<string>('');
    const [isMandatory, setIsMandatory] = useState(false);
    const [applyScope, setApplyScope] = useState<string>('ALL_EMPLOYEE');
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [deadlineType, setDeadlineType] = useState<'days' | 'range'>('days');

    const selectedUserIds = Form.useWatch('mandatory_targets', form);
    const watchDeadlineType = Form.useWatch('deadline_type', form);

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
            } else {
                form.resetFields();
                setThumbUrl('');
                setIsMandatory(false);
                setApplyScope('ALL_EMPLOYEE');
            }
            setThumbFile(null);
        }
    }, [open, editingId, initialValues, form]);

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
            title={editingId ? 'Chỉnh sửa Lộ trình học' : 'Tạo Lộ trình học mới'}
            open={open}
            onCancel={onCancel}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <Button onClick={onCancel} style={{ minWidth: 100, height: 40, borderRadius: '8px' }}>
                        Hủy
                    </Button>
                    <Button type="primary" onClick={() => form.submit()} loading={loading} style={{ minWidth: 100, height: 40, borderRadius: '8px', background: '#B8121A', borderColor: '#B8121A' }}>
                        {editingId ? "Cập nhật" : "Thêm mới"}
                    </Button>
                </div>
            }
            width={1100}
            style={{ top: editingId ? 20 : 60 }}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish} key={editingId || 'new'} style={{ marginTop: 20 }}>
                <Row gutter={24}>
                    {/* Cột 1: Thông tin cơ bản */}
                    <Col span={8}>
                        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px', height: '100%', border: '1px solid #eee' }}>
                            <Title level={5} style={{ marginBottom: 20, fontSize: '14px', color: '#B8121A', textTransform: 'uppercase', fontWeight: 700 }}>
                                1. Thông tin cơ bản
                            </Title>
                            
                            <Form.Item name="title" label="Tiêu đề Lộ trình" rules={[{ required: true, message: 'Nhập tiêu đề' }]} style={{ marginBottom: 20 }}>
                                <Input placeholder="Nhập tiêu đề lộ trình..." />
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
                                    <Form.Item name="status" label="Trạng thái" initialValue="DRAFT" style={{ marginBottom: 20 }}>
                                        <Select>
                                            <Option value="DRAFT">Nháp</Option>
                                            <Option value="PUBLISHED">Phát hành</Option>
                                            <Option value="ARCHIVED">Lưu trữ</Option>
                                        </Select>
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item name="description" label="Mô tả lộ trình" style={{ marginBottom: 20 }}>
                                <Input.TextArea rows={4} placeholder="Nhập mô tả tóm tắt cho lộ trình..." />
                            </Form.Item>

                            <Form.Item name="is_private" label="Chế độ truy cập" initialValue={false} style={{ marginBottom: 0 }}>
                                <Select>
                                    <Option value={false}>Công khai (Tất cả học viên)</Option>
                                    <Option value={true}>Riêng tư (Chỉ định đối tượng)</Option>
                                </Select>
                            </Form.Item>
                        </div>
                    </Col>

                    {/* Cột 2: Đối tượng áp dụng & Lộ trình bắt buộc */}
                    <Col span={8}>
                        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px', height: '100%', border: '1px solid #eee' }}>
                            <Title level={5} style={{ marginBottom: 20, fontSize: '14px', color: '#B8121A', textTransform: 'uppercase', fontWeight: 700 }}>
                                2. Đối tượng áp dụng
                            </Title>

                            <Form.Item name="apply_scope" label="Phạm vi áp dụng" initialValue="ALL_EMPLOYEE" style={{ marginBottom: 20 }}>
                                <Select onChange={val => setApplyScope(val)}>
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
                                <Form.Item name="mandatory_targets" label="Chọn phòng ban" rules={[{ required: true, message: 'Vui lòng chọn ít nhất một phòng ban' }]} style={{ marginBottom: 20 }}>
                                    <Select mode="multiple" placeholder="Chọn..." maxTagCount="responsive">
                                        {departments?.map(d => <Option key={d.id} value={d.id}>{d.name}</Option>)}
                                    </Select>
                                </Form.Item>
                            )}

                            {['BY_POSITION', 'NEW_EMPLOYEE_BY_POSITION'].includes(applyScope) && (
                                <Form.Item name="mandatory_targets" label="Chọn vị trí" rules={[{ required: true, message: 'Vui lòng chọn ít nhất một vị trí' }]} style={{ marginBottom: 20 }}>
                                    <Select mode="multiple" placeholder="Chọn..." maxTagCount="responsive">
                                        {positions?.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                                    </Select>
                                </Form.Item>
                            )}

                            {applyScope === 'SPECIFIC_USER' && (
                                <Form.Item name="mandatory_targets" label="Nhân viên áp dụng" rules={[{ required: true, message: 'Vui lòng chọn ít nhất một nhân viên' }]} style={{ marginBottom: 20 }}>
                                    <Button block type="dashed" icon={<UserAddOutlined />} onClick={() => setIsUserModalOpen(true)} style={{ height: 40 }}>
                                        {selectedUserIds?.length || 0} nhân viên đã chọn
                                    </Button>
                                </Form.Item>
                            )}

                            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px dashed #d9d9d9' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                    <Title level={5} style={{ marginBottom: 0, fontSize: '14px', color: isMandatory ? '#cf1322' : '#8c8c8c', textTransform: 'uppercase', fontWeight: 700 }}>
                                        Lộ trình bắt buộc
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
                                    <div style={{ background: 'rgba(255,255,255,0.8)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(0,0,0,0.05)' }}>
                                        <Form.Item name="deadline_type" label="Thiết lập thời hạn (Deadline)" initialValue="days" style={{ marginBottom: 15 }}>
                                            <Select onChange={val => setDeadlineType(val)}>
                                                <Option value="days">Số ngày kể từ lúc áp dụng</Option>
                                                <Option value="range">Khoảng ngày cố định</Option>
                                            </Select>
                                        </Form.Item>

                                        {deadlineType === 'days' ? (
                                            <Form.Item name="mandatory_deadline_days" label="Hạn hoàn thành (ngày)" initialValue={60} rules={[{ required: true }]} style={{ marginBottom: 0 }}>
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
                                        <Text type="secondary" strong>Lộ trình tự nguyện</Text>
                                        <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', marginTop: 4 }}>Nhân sự được phân phối có thể học tự do không áp hạn</Text>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Col>

                    {/* Cột 3: Hình ảnh đại diện */}
                    <Col span={8}>
                        <div style={{ padding: '20px', background: '#f8f9fa', borderRadius: '12px', height: '100%', border: '1px solid #eee' }}>
                            <Title level={5} style={{ marginBottom: 20, fontSize: '14px', color: '#8c8c8c', textTransform: 'uppercase', fontWeight: 700 }}>
                                3. Ảnh bìa đại diện
                            </Title>

                            <Form.Item name="thumbnail" label="Ảnh đại diện (Thumbnail)" style={{ marginBottom: 0 }}>
                                <Input
                                    placeholder="Dán URL hình ảnh hoặc click upload"
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
                                    <div style={{ marginTop: 15, textAlign: 'center', borderRadius: '8px', overflow: 'hidden', border: '1px solid #ddd', background: '#fff', padding: '4px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <img src={thumbUrl} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                )}
                            </Form.Item>
                        </div>
                    </Col>
                </Row>
            </Form>

            <UserSelectionModal
                open={isUserModalOpen}
                onCancel={() => setIsUserModalOpen(false)}
                users={users}
                initialSelectedIds={form.getFieldValue('mandatory_targets') || []}
                onOk={(selectedIds) => {
                    form.setFieldsValue({ mandatory_targets: selectedIds });
                    setIsUserModalOpen(false);
                }}
            />
        </Modal>
    );
}
