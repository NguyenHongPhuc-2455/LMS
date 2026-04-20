import { Modal, Form, Segmented, Divider, Button } from 'antd';
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
}

export default function LessonFormModal({
    open,
    onCancel,
    onSuccess,
    editingId,
    initialValues,
    sections,
    lessonType,
    setLessonType
}: LessonFormModalProps) {
    const [form] = Form.useForm();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
    const [videoSourceType, setVideoSourceType] = useState<'UPLOAD' | 'LINK'>('UPLOAD');

    useEffect(() => {
        if (open) {
            if (initialValues) {
                form.setFieldsValue(initialValues);
            } else {
                form.resetFields();
            }
            setSelectedFile(null);
            setAttachmentFile(null);
        }
    }, [open, initialValues, form]);

    const handleFinish = async (values: any) => {
        await onSuccess(values, selectedFile, attachmentFile);
    };

    return (
        <Modal
            title={editingId ? "Chỉnh sửa Bài Giảng" : "Đăng Bài Giảng Mới"}
            open={open}
            onCancel={onCancel}
            footer={null}
            width={800}
            destroyOnClose
        >
            {!editingId && (
                <div className={styles.segmentedWrapper}>
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

            <Form form={form} layout="vertical" onFinish={handleFinish}>
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
                    />
                ) : (
                    <QuizLessonForm sections={sections} form={form} />
                )}

                <Divider />
                <Button type="primary" htmlType="submit" block size="large" icon={lessonType === 'VIDEO' ? <ShieldCheck size={18} /> : undefined}>
                    {editingId ? "Cập nhật" : (lessonType === 'VIDEO' ? "Bắt đầu băm video HLS" : "Lưu bài trắc nghiệm")}
                </Button>
            </Form>
        </Modal>
    );
}
