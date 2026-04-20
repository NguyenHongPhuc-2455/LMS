import { Typography } from 'antd';
import styles from '../CourseDetail.module.scss';

const { Title } = Typography;

interface CourseRequirementsProps {
    requirements: string;
}

export default function CourseRequirements({ requirements }: CourseRequirementsProps) {
    const items = (requirements || "- Có máy tính kết nối internet\n- Kiến thức cơ bản về HTML/CSS")
        .split('\n')
        .filter(line => line.trim() !== '');

    return (
        <div className={styles.infoSection}>
            <Title level={4}>Yêu cầu</Title>
            <ul className={styles.requirementsList}>
                {items.map((item, index) => (
                    <li key={index} className={styles.requirementItem}>
                        {item.replace(/^- /, '')}
                    </li>
                ))}
            </ul>
        </div>
    );
}
