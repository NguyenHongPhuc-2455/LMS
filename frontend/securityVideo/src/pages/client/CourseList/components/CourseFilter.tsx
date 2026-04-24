import { Select, Space } from 'antd';
import styles from '../CourseList.module.scss';

interface CourseFilterProps {
    categories: any[];
    selectedCategoryId?: number;
    onCategoryChange: (id: number | undefined) => void;
    sortBy: string;
    setSortBy: (val: string) => void;
}

export default function CourseFilter({
    categories,
    selectedCategoryId,
    onCategoryChange,
    sortBy,
    setSortBy
}: CourseFilterProps) {
    return (
        <div className={styles.sortWrapper}>
            <Space size={24} wrap={true} align="center">
                <Space size={8} align="center">
                    <span className={styles.sortLabel} style={{ whiteSpace: 'nowrap' }}>Danh mục:</span>
                    <Select
                        placeholder="Tất cả danh mục"
                        style={{ width: 220 }}
                        allowClear
                        value={selectedCategoryId}
                        onChange={(val) => onCategoryChange(val)}
                        options={categories.map(cat => ({ value: cat.id, label: cat.name }))}
                    />
                </Space>
                <Space size={8} align="center">
                    <span className={styles.sortLabel} style={{ whiteSpace: 'nowrap' }}>Sắp xếp theo:</span>
                    <Select
                        value={sortBy}
                        className={styles.sortSelect}
                        style={{ width: 180 }}
                        onChange={(val) => setSortBy(val)}
                        popupClassName="sort-select-dropdown"
                        options={[
                            { value: 'newest', label: 'Ngày tạo (Mới nhất)' },
                            { value: 'oldest', label: 'Ngày tạo (Cũ nhất)' },
                            { value: 'az', label: 'Tên khóa học (A-Z)' },
                            { value: 'za', label: 'Tên khóa học (Z-A)' },
                            { value: 'level', label: 'Trình độ (Tăng dần)' }
                        ]}
                    />
                </Space>
            </Space>
        </div>
    );
}
