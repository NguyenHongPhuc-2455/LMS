import { Select, Space } from 'antd';
import styles from '../CourseList.module.scss';

interface CourseFilterProps {
    categories: any[];
    selectedCategoryId?: number;
    onCategoryChange: (id: number | undefined) => void;
    sortBy: string;
    setSortBy: (val: string) => void;
    hideCategory?: boolean;
}

export default function CourseFilter({
    categories,
    selectedCategoryId,
    onCategoryChange,
    sortBy,
    setSortBy,
    hideCategory = false
}: CourseFilterProps) {
    return (
        <div className={styles.sortWrapper}>
            <Space size={16} wrap={true} align="center">
                {!hideCategory && (
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
                )}
                <Select
                    value={sortBy}
                    className={styles.sortSelect}
                    style={{ width: 130 }}
                    onChange={(val) => setSortBy(val)}
                    popupClassName="sort-select-dropdown"
                    options={[
                        { value: 'newest', label: 'Mới nhất' },
                        { value: 'oldest', label: 'Cũ nhất' },
                        { value: 'az', label: 'A - Z' },
                        { value: 'za', label: 'Z - A' },
                        { value: 'level', label: 'Trình độ' },
                        { value: 'progress-desc', label: '% Hoàn thành' }
                    ]}
                />
            </Space>
        </div>
    );
}
