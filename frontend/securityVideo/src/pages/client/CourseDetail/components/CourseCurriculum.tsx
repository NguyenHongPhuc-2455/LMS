import { Typography, Collapse, List, Space } from 'antd';
import { CheckOutlined, PlayCircleFilled } from '@ant-design/icons';
import styles from '../CourseDetail.module.scss';

const { Title, Text } = Typography;

interface CourseCurriculumProps {
    sections: any[];
    totalLessons: number;
}

export default function CourseCurriculum({ sections, totalLessons }: CourseCurriculumProps) {
    const totalDuration = sections.reduce((acc, s) => acc + (s.lessons?.reduce((lacc: number, l: any) => lacc + (l.duration || 0), 0) || 0), 0);
    const h = Math.floor(totalDuration / 3600);
    const m = Math.floor((totalDuration % 3600) / 60);
    // const durationStr = h > 0 ? `${h} giờ ${m} phút` : `${m} phút`;

    return (
        <div className={styles.infoSection}>
            <div className={styles.sectionContentHeader}>
                <Title level={4} style={{ margin: 0 }}>Nội dung khóa học</Title>
            </div>
            <Text type="secondary" className={styles.sectionStats}>
                {/* {sections.length} chương • {totalLessons} bài học • Thời lượng {durationStr} */}
                {sections.length} chương • {totalLessons} bài học
            </Text>

            <Collapse
                expandIconPlacement="start"
                bordered={false}
                className={styles.curriculumCollapse}
                items={sections.map((section, idx) => ({
                    key: section.id,
                    label: (
                        <div className={styles.sectionCollapseHeader}>
                            <Text strong>{idx + 1}. {section.title}</Text>
                            <Text type="secondary">{section.lessons?.length || 0} bài học</Text>
                        </div>
                    ),
                    children: (
                        <List
                            dataSource={section.lessons}
                            renderItem={(lesson: any, lidx: number) => (
                                <List.Item className={`${styles.lessonItem} ${lesson.isCompleted ? styles.completed : ''}`}>
                                    <Space size={12}>
                                        {lesson.isCompleted ? (
                                            <CheckOutlined style={{ color: '#22c55e' }} />
                                        ) : (
                                            <PlayCircleFilled className={styles.lessonIcon} />
                                        )}
                                        <Text className={styles.lessonTitle}>{idx + 1}.{lidx + 1} {lesson.title}</Text>
                                    </Space>

                                    {lesson.duration > 0 && (
                                        <Text type="secondary" className={styles.lessonDuration}>
                                            {Math.floor(lesson.duration / 60).toString().padStart(2, '0')}:{(lesson.duration % 60).toString().padStart(2, '0')}
                                        </Text>
                                    )}
                                </List.Item>
                            )}
                        />
                    ),
                    className: styles.sectionPanelItem
                }))}
            />
        </div>
    );
}
