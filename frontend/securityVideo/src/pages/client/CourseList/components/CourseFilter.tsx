import { Select, Space } from 'antd';
import styles from '../CourseList.module.scss';

interface CourseFilterProps {
    sortBy: string;
    setSortBy: (val: string) => void;
}

export default function CourseFilter({ sortBy, setSortBy }: CourseFilterProps) {
    return (
        <div className={styles.sortWrapper}>
            <Space>
                <span className={styles.sortLabel}>Sắp xếp theo:</span>
                <Select
                    value={sortBy}
                    className={styles.sortSelect}
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
        </div>
    );
}
