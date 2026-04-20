import { Card, Avatar, Typography, Button, Divider } from 'antd';
import { CameraOutlined, UserOutlined, PhoneOutlined, MailOutlined, CalendarOutlined, ManOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import styles from '../Profile.module.scss';

const { Title, Text } = Typography;

interface ProfileHeaderProps {
    user: any;
    setIsModalOpen: (open: boolean) => void;
    handleLogout: () => void;
    setFormFields: () => void;
}

export default function ProfileHeader({ user, setIsModalOpen, handleLogout, setFormFields }: ProfileHeaderProps) {
    const infoItem = (label: string, value: string | null, icon?: React.ReactNode) => (
        <div className={styles.profileInfoItem}>
            <div className={styles.infoLabel}>
                {icon} {label}
            </div>
            <div className={`${styles.infoValue} ${value ? styles.hasValue : styles.noValue}`}>
                {value || <span className={styles.addLink} onClick={() => { setFormFields(); setIsModalOpen(true); }}>+ Add</span>}
            </div>
        </div>
    );

    return (
        <Card bordered={false} styles={{ body: { padding: 0 } }} className={styles.profileLeftCard}>
            <div className={styles.profileAvatarSection}>
                <div className={styles.profileAvatarWrapper}>
                    <Avatar
                        size={120}
                        src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=4880FF&color=fff&size=200`}
                        className={styles.profileAvatar}
                    />
                    <Button
                        shape="circle"
                        size="small"
                        icon={<CameraOutlined />}
                        className={styles.profileAvatarButton}
                    />
                </div>
                <Title level={3} className={styles.profileName}>{user.full_name || user.username}</Title>
                <Text
                    className={styles.profileEditBtn}
                    onClick={() => {
                        setFormFields();
                        setIsModalOpen(true);
                    }}
                >
                    Edit
                </Text>
            </div>

            <Divider className={styles.profileDivider} />

            <div className={styles.profileInfoList}>
                {infoItem('Username', user.username, <UserOutlined className={styles.iconSmall} />)}
                {infoItem('Full name', user.full_name, <UserOutlined className={styles.iconSmall} />)}
                {infoItem('Mobile number', user.phone, <PhoneOutlined className={styles.iconSmall} />)}
                {infoItem('Email address', user.email, <MailOutlined className={styles.iconSmall} />)}
                {infoItem('Date of birth', user.dob ? dayjs(user.dob).format('DD/MM/YYYY') : null, <CalendarOutlined className={styles.iconSmall} />)}
                {infoItem('Gender', user.gender, <ManOutlined className={styles.iconSmall} />)}
            </div>

            <Divider className={styles.profileDivider} />

            <div className={styles.profileLogoutSection}>
                <Button type="text" danger onClick={handleLogout} className={styles.logoutBtn}>Log out</Button>
            </div>
        </Card>
    );
}
