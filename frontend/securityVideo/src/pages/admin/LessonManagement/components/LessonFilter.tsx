import React from 'react';
import { Space, Select, Typography } from 'antd';
import styles from '../LessonManagement.module.scss';

const { Text } = Typography;

interface LessonFilterProps {
    categories: any[];
    courses: any[];
    sections: any[];
    selectedCategoryId: number | null;
    selectedCourseId: number | null;
    selectedSectionId: number | null;
    onCategoryChange: (id: number) => void;
    onCourseChange: (id: number) => void;
    onSectionChange: (id: number) => void;
}

export default function LessonFilter({
    categories,
    courses,
    sections,
    selectedCategoryId,
    selectedCourseId,
    selectedSectionId,
    onCategoryChange,
    onCourseChange,
    onSectionChange,
    children
}: LessonFilterProps & { children?: React.ReactNode }) {
    return (
        <div className={styles.lessonFilterContainer}>
            <div className={styles.filterWrapper}>
                <Space size={24} wrap>
                    <Space>
                        <Text strong>Danh mục:</Text>
                        <Select
                            placeholder="Chọn danh mục..."
                            className={styles.filterSelect}
                            style={{ width: 180 }}
                            onChange={onCategoryChange}
                            value={selectedCategoryId}
                            options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                        />
                    </Space>
                    <Space>
                        <Text strong>Khóa học:</Text>
                        <Select
                            placeholder="Chọn khóa học..."
                            className={styles.filterSelect}
                            style={{ width: 220 }}
                            disabled={!selectedCategoryId}
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
                            style={{ width: 180 }}
                            disabled={!selectedCourseId}
                            onChange={onSectionChange}
                            value={selectedSectionId}
                            options={sections.map(s => ({ value: s.id, label: s.title }))}
                        />
                    </Space>
                </Space>
                {children}
            </div>
        </div>
    );
}
