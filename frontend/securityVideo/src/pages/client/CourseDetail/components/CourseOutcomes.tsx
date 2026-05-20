import { Typography, Row, Col, Space } from 'antd';
import { CheckOutlined } from '@ant-design/icons';
import styles from '../CourseDetail.module.scss';

const { Title, Text } = Typography;

interface CourseOutcomesProps {
    learning_outcomes: string;
}

export default function CourseOutcomes({ learning_outcomes }: CourseOutcomesProps) {
    const outcomes = (learning_outcomes || "- Kiến thức chuyên sâu và thực tế\n- Tự tay xây dựng các dự án phức tạp\n- Nắm vững các concept nâng cao\n- Kỹ năng giải quyết vấn đề thực tế\n- Tư duy lập trình chuyên nghiệp\n- Sẵn sàng cho các vị trí công việc cao")
        .split('\n')
        .filter(line => line.trim() !== '');

    return (
        <div className={styles.infoSection}>
            <Title level={4}>Bạn sẽ học được gì?</Title>
            <Row gutter={[16, 12]}>
                {outcomes.map((item, index) => (
                    <Col span={12} key={item} className={styles.outcomeItem}>
                        <Space align="start">
                            <CheckOutlined className={styles.outcomeIcon} />
                            <Text className={styles.outcomeText}>{item.replace(/^- /, '')}</Text>
                        </Space>
                    </Col>
                ))}
            </Row>
        </div>
    );
}
