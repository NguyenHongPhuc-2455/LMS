import React from 'react';
import { Typography, Row, Col } from 'antd';
import {
    MailOutlined,
    PhoneOutlined,
    EnvironmentOutlined,
    FacebookOutlined,
    YoutubeOutlined,
    GithubOutlined
} from '@ant-design/icons';
import styles from './Contact.module.scss';

const { Title, Text, Paragraph } = Typography;

const Contact: React.FC = () => {

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
                {/* Contact Info Cards */}
                <div className={styles.infoSection}>
                    <div className={styles.infoCard}>
                        <MailOutlined className={styles.cardIcon} />
                        <Title level={4} className={styles.cardTitle}>Email</Title>
                        <Paragraph className={styles.cardContent}>
                            info@ritavo.com
                        </Paragraph>
                    </div>

                    <div className={styles.infoCard}>
                        <EnvironmentOutlined className={styles.cardIcon} />
                        <Title level={4} className={styles.cardTitle}>Địa chỉ</Title>
                        <Paragraph className={styles.cardContent}>
                            Trụ sở chính: 327 Xa lộ Hà Nội, phường An Khánh,
                            TP. Hồ Chí Minh, Việt Nam
                        </Paragraph>
                    </div>

                    <div className={styles.infoCard}>
                        <PhoneOutlined className={styles.cardIcon} />
                        <Title level={4} className={styles.cardTitle}>Điện thoại</Title>
                        <Paragraph className={styles.cardContent}>
                            Hotline: 1800 1246
                        </Paragraph>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contact;
