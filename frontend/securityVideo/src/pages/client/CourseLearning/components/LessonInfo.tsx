import { Typography, Button } from 'antd';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import styles from '../CourseLearning.module.scss';

const { Title, Paragraph } = Typography;

interface LessonInfoProps {
    title: string;
    content: string;
    isExpanded: boolean;
    setIsExpanded: (expanded: boolean) => void;
}

export default function LessonInfo({ title, content, isExpanded, setIsExpanded }: LessonInfoProps) {
    return (
        <>
            <Title level={2} className={styles.courseMainTitle}>{title}</Title>

            {content && (
                <div className={styles.lessonContentCard}>
                    <Title level={4}>Hướng dẫn & Nội dung</Title>
                    <div className={styles.relativePos}>
                        <div className={`${styles.contentScrollArea} ${isExpanded ? '' : styles.collapsed}`}>
                            <Paragraph className={styles.contentParagraph}>
                                {content}
                            </Paragraph>

                            {!isExpanded && (
                                <div className={styles.gradientOverlay} />
                            )}
                        </div>

                        <Button
                            type="link"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className={styles.expandBtn}
                        >
                            {isExpanded ? (
                                <>Thu gọn <UpOutlined style={{ fontSize: '12px', marginLeft: '4px' }} /></>
                            ) : (
                                <>Xem thêm <DownOutlined style={{ fontSize: '12px', marginLeft: '4px' }} /></>
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </>
    );
}
