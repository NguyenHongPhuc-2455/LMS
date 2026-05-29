import { Modal, Form, Segmented, Button } from 'antd';
import { ShieldCheck } from 'lucide-react';
import { useState, useEffect } from 'react';
import styles from '../LessonManagement.module.scss';

// Sub-components
import VideoLessonForm from './VideoLessonForm';
import QuizLessonForm from './QuizLessonForm';

interface LessonFormModalProps {
    open: boolean;
    onCancel: () => void;
    onSuccess: (values: any, selectedFile: File | null, attachmentFile: File | null) => Promise<void>;
    editingId?: number | null;
    initialValues?: any;
    sections: any[];
    lessonType: 'VIDEO' | 'QUIZ';
    setLessonType: (type: 'VIDEO' | 'QUIZ') => void;
    loading?: boolean;
}

export default function LessonFormModal({
    open,
    onCancel,
    onSuccess,
    editingId,
    initialValues,
    sections,
    lessonType,
    setLessonType,
    loading
}: LessonFormModalProps) {
    const [form] = Form.useForm();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [videoSourceType, setVideoSourceType] = useState<'UPLOAD' | 'LINK'>('UPLOAD');

    // 1. Chỉ Reset Form và nạp dữ liệu khi Modal MỞ LÊN
    useEffect(() => {
        let timerId: any;
        if (open) {
            form.resetFields();
            if (initialValues) {
                // Tự động nhận diện loại nguồn video khi mở modal lần đầu
                if (initialValues.video_url || initialValues.type === 'VIDEO') {
                    const isExternal = !!initialValues.video_url && !initialValues.video_url.startsWith('hls/');
                    setVideoSourceType(isExternal ? 'LINK' : 'UPLOAD');
                }

                // Trì hoãn setFieldsValue để đảm bảo các trường con như duration_min/sec đã mount và register xong
                timerId = setTimeout(() => {
                    const values = {
                        ...initialValues,
                        anti_seek: initialValues.anti_seek !== undefined ? initialValues.anti_seek : true
                    };
                    form.setFieldsValue(values);
                }, 100);
            } else {
                form.setFieldsValue({ anti_seek: true });
            }
            setSelectedFile(null);
            setAttachmentFile(null);
        }
        return () => {
            if (timerId) {
                clearTimeout(timerId);
            }
        };
    }, [open, initialValues, form]); 

    const handleFinish = async (values: any) => {
        await onSuccess(values, selectedFile, attachmentFile);
    };

    return (
        <Modal
            title={editingId ? "Chỉnh sửa Bài Giảng" : "Đăng Bài Giảng Mới"}
            open={open}
            onCancel={onCancel}
            footer={
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <Button onClick={onCancel} className="modal-action-btn">
                        Hủy bỏ
                    </Button>
                    <Button 
                        type="primary" 
                        onClick={() => form.submit()} 
                        loading={loading}
                        icon={lessonType === 'VIDEO' ? <ShieldCheck size={18} /> : undefined}
                        className="btn-brand-primary modal-action-btn"
                    >
                        {editingId ? "Cập nhật" : (lessonType === 'VIDEO' ? "Lưu bài học" : "Lưu bài trắc nghiệm")}
                    </Button>
                </div>
            }
            width={1000}
            style={{ top: 100 }}
            destroyOnHidden={true}
        >
            {!editingId && (
                <div className={styles.segmentedWrapper} style={{ marginBottom: 16 }}>
                    <Segmented
                        options={[
                            { label: 'Video bài học', value: 'VIDEO' },
                            { label: 'Bài trắc nghiệm', value: 'QUIZ' }
                        ]}
                        value={lessonType}
                        onChange={(v) => setLessonType(v as 'VIDEO' | 'QUIZ')}
                    />
                </div>
            )}

            <div className={styles.modalBodyScroll}>
                <Form 
                    form={form} 
                    layout="vertical" 
                    onFinish={handleFinish}
                    initialValues={initialValues ? {
                        ...initialValues,
                        anti_seek: initialValues.anti_seek !== undefined ? initialValues.anti_seek : true
                    } : { anti_seek: true }}
                >
                    {lessonType === 'VIDEO' ? (
                        <VideoLessonForm
                            sections={sections}
                            videoSourceType={videoSourceType}
                            setVideoSourceType={setVideoSourceType}
                            setSelectedFile={setSelectedFile}
                            setAttachmentFile={setAttachmentFile}
                            selectedFile={selectedFile}
                            attachmentFile={attachmentFile}
                            editingId={editingId}
                            form={form}
                        />
                    ) : (
                        <QuizLessonForm sections={sections} form={form} />
                    )}
                </Form>
            </div>
        </Modal>
    );
}
