import { Form, Input, Row, Col, InputNumber, Radio, Typography, Select } from 'antd';
import styles from '../LessonManagement.module.scss';

const { Text } = Typography;

interface VideoLessonFormProps {
    sections: any[];
    videoSourceType: 'UPLOAD' | 'LINK';
    setVideoSourceType: (type: 'UPLOAD' | 'LINK') => void;
    setSelectedFile: (file: File | null) => void;
    setAttachmentFile: (file: File | null) => void;
    selectedFile: File | null;
    attachmentFile: File | null;
    editingId?: number | null;
}

export default function VideoLessonForm({
    sections,
    videoSourceType,
    setVideoSourceType,
    setSelectedFile,
    setAttachmentFile,
    selectedFile,
    attachmentFile,
    editingId
}: VideoLessonFormProps) {
    return (
        <>
            <Form.Item name="section_id" label="Chương học" rules={[{ required: true }]}>
                <Select options={sections.map(s => ({ value: s.id, label: s.title }))} />
            </Form.Item>

            <Row gutter={16}>
                <Col span={18}>
                    <Form.Item name="title" label="Tiêu đề bài giảng" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                </Col>
                <Col span={6}>
                    <Form.Item name="order" label="Thứ tự hiển thị">
                        <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="content" label="Nội dung văn bản">
                <Input.TextArea rows={4} />
            </Form.Item>

            <div className={styles.attachmentWrapper}>
                <Text strong className={styles.attachmentTitle}>Tài liệu đính kèm (PDF - Tùy chọn)</Text>
                <input type="file" accept="application/pdf" onChange={e => setAttachmentFile(e.target.files?.[0] || null)} />
                {attachmentFile && <Text type="success" className={styles.attachmentSuccess}><br />✓ {attachmentFile.name}</Text>}
            </div>

            {!editingId && (
                <div className={styles.videoSourceWrapper}>
                    <Radio.Group value={videoSourceType} onChange={e => setVideoSourceType(e.target.value)} className={styles.videoSourceRadio}>
                        <Radio value="UPLOAD">Upload Video MP4 (HLS)</Radio>
                        <Radio value="LINK">Dùng Link (Youtube/Server)</Radio>
                    </Radio.Group>

                    {videoSourceType === 'UPLOAD' ? (
                        <div>
                            <Text strong className={styles.attachmentTitle}>Tệp Video (MP4 - Bắt buộc)</Text>
                            <input type="file" accept="video/mp4" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                            {selectedFile && <Text type="success" className={styles.attachmentSuccess}><br />✓ {selectedFile.name}</Text>}
                        </div>
                    ) : (
                        <Form.Item name="video_url" label="Link Video (Youtube hoặc link trực tiếp)" rules={[{ required: true }]}>
                            <Input placeholder="Ví dụ: https://www.youtube.com/watch?v=..." />
                        </Form.Item>
                    )}
                </div>
            )}
        </>
    );
}
