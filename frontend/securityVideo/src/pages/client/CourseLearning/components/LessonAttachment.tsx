import { Typography, Button } from 'antd';
import { FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import styles from '../CourseLearning.module.scss';

const { Text } = Typography;

interface LessonAttachmentProps {
    url: string;
    name?: string;
}

export default function LessonAttachment({ url, name }: LessonAttachmentProps) {
    if (!url) return null;

    return (
        <div className={styles.attachmentCard}>
            <div className={styles.attachmentInfo}>
                <div className={styles.attachmentIconWrapper}>
                    <FileTextOutlined className={styles.attachmentIcon} />
                </div>
                <div>
                    <Text strong className={styles.attachmentTitle}>Tài liệu đính kèm</Text>
                    <Text type="secondary" className={styles.attachmentSubtitle}>
                        {name || 'Tai_lieu_bai_hoc.pdf'}
                    </Text>
                </div>
            </div>
            <Button
                type="primary"
                icon={<DownloadOutlined />}
                href={`http://localhost:5000${url}`}
                target="_blank"
                download
                className={styles.downloadBtn}
            >
                Tải về PDF
            </Button>
        </div>
    );
}
