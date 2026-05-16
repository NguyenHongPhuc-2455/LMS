import { Drawer, Space, Typography, List, Avatar, Button, Tag } from 'antd';
import { BookOpen, X, ArrowUp, ArrowDown } from 'lucide-react';
import styles from '../ProgramManagement.module.scss';

const { Text } = Typography;

import { type Course } from '../../../../types/course';
import { type Program } from '../../../../types/program';

interface ProgramCourseDrawerProps {
    open: boolean;
    onClose: () => void;
    program: Program | null;
    availableCourses: Course[];
    addingCourseId?: number | null;
    onAddCourse: (courseId: number) => void;
    onRemoveCourse: (courseId: number) => void;
    onReorder: (direction: 'up' | 'down', index: number) => void;
}

export default function ProgramCourseDrawer({
    open,
    onClose,
    program,
    availableCourses,
    addingCourseId,
    onAddCourse,
    onRemoveCourse,
    onReorder
}: ProgramCourseDrawerProps) {
    if (!program) return null;

    const currentCourses = [...program.courses].sort((a, b) => a.order - b.order);

    return (
        <Drawer
            title={<Space><BookOpen size={18} /><span>Khóa học trong: {program.title}</span></Space>}
            open={open}
            onClose={onClose}
            width={520}
            className={styles.courseDrawerList}
        >
            <Text strong className={styles.drawerSectionTitle}>Đang có ({currentCourses.length} khóa)</Text>
            <List
                dataSource={currentCourses}
                locale={{ emptyText: 'Chưa có khóa học nào' }}
                renderItem={(pc, index) => (
                    <List.Item actions={[
                        <Space key="reorder">
                            <Button
                                type="text"
                                size="small"
                                icon={<ArrowUp size={14} />}
                                disabled={index === 0}
                                onClick={() => onReorder('up', index)}
                            />
                            <Button
                                type="text"
                                size="small"
                                icon={<ArrowDown size={14} />}
                                disabled={index === currentCourses.length - 1}
                                onClick={() => onReorder('down', index)}
                            />
                        </Space>,
                        <Button key="remove" type="text" danger size="small" icon={<X size={14} />}
                            onClick={() => onRemoveCourse(pc.course.id)} />
                    ]}>
                        <List.Item.Meta
                            avatar={<Avatar src={pc.course.thumbnail} shape="square" size={40} className={styles.itemThumb} />}
                            title={<Text strong>{pc.course.title}</Text>}
                            description={<Tag>{pc.course.level}</Tag>}
                            className={styles.courseItemMeta}
                        />
                    </List.Item>
                )}
            />

            {availableCourses.length > 0 && (
                <>
                    <div className={styles.addCourseSection}>
                        <Text className={styles.sectionLabel}>Thêm khóa học</Text>
                    </div>
                    <List
                        dataSource={availableCourses}
                        renderItem={c => (
                            <List.Item actions={[
                                <Button
                                    type="primary"
                                    size="small"
                                    loading={addingCourseId === c.id}
                                    onClick={() => onAddCourse(c.id)}
                                >
                                    Thêm
                                </Button>
                            ]}>
                                <List.Item.Meta
                                    avatar={<Avatar src={c.thumbnail} shape="square" size={40} className={styles.itemThumb} />}
                                    title={c.title}
                                    description={<Tag>{c.level}</Tag>}
                                    className={styles.courseItemMeta}
                                />
                            </List.Item>
                        )}
                    />
                </>
            )}
        </Drawer>
    );
}
