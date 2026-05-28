import { Space, Button } from 'antd';
import CourseRequestTable from './CourseRequestTable';
import styles from '../CourseRequests.module.scss';

interface RequestTabContentProps {
    type: 'course' | 'program';
    data: any[];
    total?: number;
    page?: number;
    pageSize?: number;
    onPageChange?: (page: number, pageSize: number) => void;
    loading: boolean;
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    handleBulkAction: (type: 'course' | 'program', action: 'approve' | 'reject') => void;
}

export default function RequestTabContent({
    type,
    data,
    total,
    page,
    pageSize,
    onPageChange,
    loading,
    selectedIds,
    onSelectionChange,
    onApprove,
    onReject,
    handleBulkAction
}: RequestTabContentProps) {
    return (
        <div>
            {selectedIds.length > 0 && (
                <Space style={{ marginBottom: 16 }}>
                    <Button type="primary" onClick={() => handleBulkAction(type, 'approve')} className={styles.approveBtn}>
                        Duyệt ({selectedIds.length})
                    </Button>
                    <Button danger onClick={() => handleBulkAction(type, 'reject')}>
                        Từ chối ({selectedIds.length})
                    </Button>
                </Space>
            )}
            <CourseRequestTable
                type={type}
                data={data}
                total={total}
                page={page}
                pageSize={pageSize}
                onPageChange={onPageChange}
                loading={loading}
                selectedIds={selectedIds}
                onSelectionChange={onSelectionChange}
                onApprove={onApprove}
                onReject={onReject}
            />
        </div>
    );
}
