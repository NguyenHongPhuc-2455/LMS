import { Card, Space, Select, Typography } from 'antd';
import styles from '../LessonManagement.module.scss';

const { Text } = Typography;

interface LessonFilterProps {
    courses: any[];
    sections: any[];
    selectedCourseId: number | null;
    selectedSectionId: number | null;
    onCourseChange: (id: number) => void;
    onSectionChange: (id: number) => void;
}

export default function LessonFilter({
    courses,
    sections,
    selectedCourseId,
    selectedSectionId,
    onCourseChange,
    onSectionChange
}: LessonFilterProps) {
    return (
        <Card className={`glass-card ${styles.filterCard}`}>
            <Space size={24}>
                <Space>
                    <Text strong>Khóa học:</Text>
                    <Select
                        placeholder="Chọn khóa học..."
                        className={styles.filterSelect}
                        onChange={onCourseChange}
                        value={selectedCourseId}
                        options={courses.map(c => ({ value: c.id, label: c.title }))}
                    />
                </Space>
                <Space>
                    <Text strong>Chương:</Text>
                    <Select
                        placeholder="Chọn chương..."
                        className={styles.filterSelect}
                        disabled={!selectedCourseId}
                        onChange={onSectionChange}
                        value={selectedSectionId}
                        options={sections.map(s => ({ value: s.id, label: s.title }))}
                    />
                </Space>
            </Space>
        </Card>
    );
}
