import { Typography, List, Card } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import ProgramCourseCard from './ProgramCourseCard';
import styles from '../ProgramDetail.module.scss';

const { Title, Text } = Typography;

interface ProgramCurriculumProps {
    sortedCourses: any[];
    program: any;
    navigate: (path: string) => void;
}

export default function ProgramCurriculum({
    sortedCourses,
    program,
    navigate
}: ProgramCurriculumProps) {
    return (
        <div className={styles.programContentArea}>
            <Title level={3} className={styles.curriculumTitle}>
                Lộ trình học ({sortedCourses.length} khóa học)
            </Title>

            <List
                dataSource={sortedCourses}
                renderItem={(pc, index) => (
                    <ProgramCourseCard
                        key={pc.course.id}
                        pc={pc}
                        index={index}
                        program={program}
                        navigate={navigate}
                    />
                )}
            />

            {sortedCourses.length === 0 && (
                <Card className={styles.emptyCourseCard}>
                    <BookOutlined className={styles.emptyIcon} />
                    <br />
                    <Text type="secondary">Chưa có khóa học nào trong chương trình này</Text>
                </Card>
            )}
        </div>
    );
}
