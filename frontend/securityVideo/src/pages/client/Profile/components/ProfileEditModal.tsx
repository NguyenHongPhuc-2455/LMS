import { Modal, Form, Input, Row, Col, DatePicker, Select, Space, Button } from 'antd';
import styles from '../Profile.module.scss';

interface ProfileEditModalProps {
    isModalOpen: boolean;
    setIsModalOpen: (open: boolean) => void;
    onFinish: (values: any) => void;
    loading: boolean;
    form: any;
}

export const ProfileEditModal = ({ isModalOpen, setIsModalOpen, onFinish, loading, form }: ProfileEditModalProps) => {
    return (
        <Modal
            title="Sửa thông tin cơ bản"
            open={isModalOpen}
            onCancel={() => setIsModalOpen(false)}
            footer={null}
            centered
            className={styles.profileModal}
        >
            <Form
                form={form}
                layout="vertical"
                onFinish={onFinish}
                requiredMark={false}
                className={styles.profileModalForm}
            >
                <Form.Item label="Họ và tên" name="full_name">
                    <Input placeholder="Nguyễn Văn A" />
                </Form.Item>
                <Form.Item label="Email" name="email" rules={[{ type: 'email' }]}>
                    <Input />
                </Form.Item>
                <Form.Item label="Số điện thoại" name="phone">
                    <Input />
                </Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Ngày sinh" name="dob">
                            <DatePicker className={styles.fullWidth} format="DD/MM/YYYY" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Giới tính" name="gender">
                            <Select
                                placeholder="Chọn giới tính"
                                options={[
                                    { value: 'Nam', label: 'Nam' },
                                    { value: 'Nữ', label: 'Nữ' },
                                    { value: 'Khác', label: 'Khác' }
                                ]}
                            />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Mã nhân sự" name="employee_id">
                            <Input placeholder="MS-1234" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Ngày vào làm" name="join_date">
                            <DatePicker className={styles.fullWidth} format="DD/MM/YYYY" />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item label="Phòng ban" name="department">
                            <Input placeholder="Phòng CNTT" />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item label="Vị trí" name="position">
                            <Input placeholder="Nhân viên" />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item label="Link Avatar" name="avatar">
                    <Input placeholder="https://..." />
                </Form.Item>
                <div className={styles.profileModalFooter}>
                    <Space>
                        <Button onClick={() => setIsModalOpen(false)}>Hủy</Button>
                        <Button type="primary" htmlType="submit" loading={loading} className={styles.btnSave}>
                            Lưu thay đổi
                        </Button>
                    </Space>
                </div>
            </Form>
        </Modal>
    );
}
