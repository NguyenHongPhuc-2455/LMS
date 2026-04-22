import React from 'react';
import { Form, Input, Button, Typography, Row, Col, message } from 'antd';
import {
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    FacebookOutlined,
    YoutubeOutlined,
    GithubOutlined,
    SendOutlined
} from '@ant-design/icons';
import styles from './Contact.module.scss';

const { Title, Text, Paragraph } = Typography;

const Contact: React.FC = () => {
    const [form] = Form.useForm();

    const onFinish = (values: any) => {
        console.log('Success:', values);
        message.success('Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi sớm nhất có thể.');
        form.resetFields();
    };

    return (
        <div className={styles.contactContainer}>
            <div className={styles.contactHeader}>
                <Title className={styles.title}>Liên hệ với chúng tôi</Title>
                <Text className={styles.subtitle}>
                    Bạn có câu hỏi hoặc góp ý? Đừng ngần ngại gửi tin nhắn cho chúng tôi.
                    Đội ngũ RitaVõ luôn sẵn sàng lắng nghe và hỗ trợ bạn.
                </Text>
            </div>

            <div className={styles.contentWrapper}>
                {/* Left Side: Contact Info */}
                <div className={styles.infoSection}>
                    <div className={styles.infoCard}>
                        <MailOutlined className={styles.cardIcon} />
                        <Title level={4} className={styles.cardTitle}>Email</Title>
                        <Paragraph className={styles.cardContent}>
                            hotro@ritavo.com<br />
                            tuyendung@ritavo.com
                        </Paragraph>
                    </div>

                    <div className={styles.infoCard}>
                        <PhoneOutlined className={styles.cardIcon} />
                        <Title level={4} className={styles.cardTitle}>Điện thoại</Title>
                        <Paragraph className={styles.cardContent}>
                            Hotline: 1800 1246<br />
                            CSKH: (028) 3744 2282
                        </Paragraph>
                    </div>

                    <div className={styles.infoCard}>
                        <EnvironmentOutlined className={styles.cardIcon} />
                        <Title level={4} className={styles.cardTitle}>Địa chỉ</Title>
                        <Paragraph className={styles.cardContent}>
                            Số 335, Đại lộ Bình Dương, P. Chánh Nghĩa, <br />
                            TP. Thủ Dầu Một, Tỉnh Bình Dương, Việt Nam.
                        </Paragraph>
                    </div>

                    <div className={styles.socialLinks}>
                        <a href="https://facebook.com" className={styles.socialIcon}><FacebookOutlined /></a>
                        <a href="https://youtube.com" className={styles.socialIcon}><YoutubeOutlined /></a>
                        <a href="https://github.com" className={styles.socialIcon}><GithubOutlined /></a>
                    </div>
                </div>

                {/* Right Side: Contact Form */}
                <div className={styles.formSection}>
                    <Title level={3} className={styles.formTitle}>Gửi tin nhắn</Title>
                    <Text className={styles.formSubtitle}>Điền vào biểu mẫu bên dưới và chúng tôi sẽ liên hệ lại với bạn.</Text>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={onFinish}
                        requiredMark={false}
                        autoComplete="off"
                    >
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    name="name"
                                    label="Họ và tên"
                                    rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}
                                >
                                    <Input placeholder="Nguyễn Văn A" size="large" />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    name="email"
                                    label="Email"
                                    rules={[
                                        { required: true, message: 'Vui lòng nhập email' },
                                        { type: 'email', message: 'Email không hợp lệ' }
                                    ]}
                                >
                                    <Input placeholder="example@gmail.com" size="large" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Form.Item
                            name="subject"
                            label="Tiêu đề"
                            rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}
                        >
                            <Input placeholder="Tôi muốn hỏi về khóa học..." size="large" />
                        </Form.Item>

                        <Form.Item
                            name="message"
                            label="Nội dung tin nhắn"
                            rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                        >
                            <Input.TextArea
                                placeholder="Nhập nội dung bạn muốn gửi tới chúng tôi..."
                                rows={6}
                            />
                        </Form.Item>

                        <Form.Item>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SendOutlined />}
                                block
                                className={styles.submitBtn}
                            >
                                Gửi yêu cầu ngay
                            </Button>
                        </Form.Item>
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
