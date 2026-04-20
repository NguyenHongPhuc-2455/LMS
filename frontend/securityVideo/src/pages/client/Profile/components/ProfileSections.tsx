import { Card, Typography, List, Space, Button, Switch } from 'antd';
import { FacebookFilled, GoogleOutlined } from '@ant-design/icons';
import styles from '../Profile.module.scss';

const { Text } = Typography;

export default function ProfileSections() {
    return (
        <Space direction="vertical" size={24} className={styles.profileRightSpace}>
            {/* Social Logins */}
            <Card bordered={false} title="My social logins" className={styles.profileSectionCard}>
                <Text type="secondary" className={styles.socialDesc}>Link social profiles for easier access to your Fresha account.</Text>
                <List
                    dataSource={[
                        { name: 'Facebook', icon: <FacebookFilled className={styles.socialIconFb} /> },
                        { name: 'Google', icon: <GoogleOutlined className={styles.socialIconGoogle} /> }
                    ]}
                    renderItem={(item) => (
                        <List.Item extra={<Button type="text" className={styles.profileEditBtn}>Connect</Button>}>
                            <Space size={16}>
                                <div className={styles.socialItemIconWrapper}>
                                    {item.icon}
                                </div>
                                <Text strong>{item.name}</Text>
                            </Space>
                        </List.Item>
                    )}
                />
            </Card>

            {/* Notifications */}
            <Card bordered={false} title="My notifications" className={styles.profileSectionCard}>
                <Text type="secondary" className={styles.notificationDesc}>We'll send you updates about your appointments, news and marketing offers.</Text>
                <div className={styles.notificationItem}>
                    <div>
                        <Text strong className={styles.notificationTitle}>Text message appointment notifications</Text>
                        <Text type="secondary" className={styles.notificationSubText}>Receive texts based on your sender's settings</Text>
                    </div>
                    <Switch defaultChecked />
                </div>
            </Card>
        </Space>
    );
}
