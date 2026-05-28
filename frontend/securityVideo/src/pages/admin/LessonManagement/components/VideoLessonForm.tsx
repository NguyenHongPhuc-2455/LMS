import { Form, Input, Row, Col, InputNumber, Radio, Typography, Select, Upload, Button, Space, Switch, Segmented } from 'antd';
import { FileText, Video, UploadCloud, Link } from 'lucide-react';
import { useState, useEffect } from 'react';
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
    editingId,
    form
}: VideoLessonFormProps & { form: any }) {
    const [hlsUploadMethod, setHlsUploadMethod] = useState<'FILE' | 'URL'>('FILE');

    useEffect(() => {
        const hlsUrl = form.getFieldValue('hls_video_url');
        if (hlsUrl) {
            setHlsUploadMethod('URL');
        }
    }, [editingId, form]);

    return (
        <div style={{ padding: '4px' }}>
            <Row gutter={32}>
                {/* Cột trái */}
                <Col span={12}>
                    <Form.Item name="section_id" label="Chương học" rules={[{ required: true }]}>
                        <Select options={sections.map(s => ({ value: s.id, label: s.title }))} placeholder="Chọn chương bọc cho bài giảng" />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={10}>
                            <Form.Item name="title" label="Tiêu đề bài giảng" rules={[{ required: true }]}>
                                <Input placeholder="Ví dụ: Giới thiệu khóa học" />
                            </Form.Item>
                        </Col>
                        <Col span={7}>
                            <Form.Item label="Thời lượng">
                                <Space.Compact style={{ width: '100%' }}>
                                    <Form.Item name="duration_min" noStyle>
                                        <InputNumber min={0} placeholder="Phút" style={{ width: '50%' }} />
                                    </Form.Item>
                                    <Form.Item name="duration_sec" noStyle>
                                        <InputNumber min={0} max={59} placeholder="Giây" style={{ width: '50%' }} />
                                    </Form.Item>
                                </Space.Compact>
                            </Form.Item>
                        </Col>
                        <Col span={7}>
                            <Form.Item name="order" label="Thứ tự hiển thị">
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item name="content" label="Nội dung văn bản">
                        <Input.TextArea rows={6} placeholder="Nhập nội dung văn bản của bài học hoặc hướng dẫn..." />
                    </Form.Item>

                    <Form.Item
                        name="anti_seek"
                        label="Chống tua video"
                        valuePropName="checked"
                        tooltip="Bật để ngăn nhân sự kéo thanh tua tới nội dung chưa xem"
                    >
                        <Switch
                            checkedChildren="🔒 Bật"
                            unCheckedChildren="🔓 Tắt"
                        />
                    </Form.Item>
                </Col>

                {/* Cột phải */}
                <Col span={12}>
                    <div className={styles.attachmentWrapper}>
                        <Text strong className={styles.attachmentTitle}>
                            <FileText size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                            Tài liệu đính kèm (PDF - Tùy chọn)
                        </Text>
                        <Form.Item name="attachment_url" label="Link tài liệu (GG Drive, OneDrive...)">
                            <Input
                                placeholder="Dán link tài liệu tại đây"
                                suffix={
                                    <Upload
                                        beforeUpload={(file) => {
                                            setAttachmentFile(file);
                                            return false;
                                        }}
                                        showUploadList={false}
                                        accept="application/pdf"
                                    >
                                        <UploadCloud size={18} style={{ cursor: 'pointer', color: '#6366f1' }} />
                                    </Upload>
                                }
                            />
                        </Form.Item>
                        {attachmentFile && <Text type="success" style={{ fontSize: 12 }}>✓ Đã chọn file: {attachmentFile.name}</Text>}
                    </div>

                    <div className={styles.videoSourceWrapper} style={{ marginTop: 24 }}>
                        <Text strong className={styles.attachmentTitle}>
                            <Video size={16} style={{ marginRight: 8, verticalAlign: 'middle' }} />
                            Nguồn Bài Giảng
                        </Text>
                        <Radio.Group
                            value={videoSourceType}
                            onChange={e => setVideoSourceType(e.target.value)}
                            className={styles.videoSourceRadio}
                            optionType="button"
                            buttonStyle="solid"
                            style={{ width: '100%', marginBottom: 16 }}
                        >
                            <Radio.Button value="UPLOAD" style={{ width: '50%', textAlign: 'center' }}>HLS Upload</Radio.Button>
                            <Radio.Button value="LINK" style={{ width: '50%', textAlign: 'center' }}>External Link</Radio.Button>
                        </Radio.Group>

                        <div style={{ marginTop: 16 }}>
                            {videoSourceType === 'UPLOAD' ? (
                                <div>
                                    <Segmented
                                        options={[
                                            { label: 'Tải lên từ máy', value: 'FILE', icon: <UploadCloud size={14} /> },
                                            { label: 'Link từ Server', value: 'URL', icon: <Link size={14} /> }
                                        ]}
                                        value={hlsUploadMethod}
                                        onChange={(v) => setHlsUploadMethod(v as 'FILE' | 'URL')}
                                        style={{ marginBottom: 16, width: '100%' }}
                                        block
                                    />

                                    {hlsUploadMethod === 'FILE' ? (
                                        <div>
                                            <Upload
                                                beforeUpload={(file) => {
                                                    setSelectedFile(file);
                                                    return false;
                                                }}
                                                showUploadList={false}
                                                accept="video/mp4"
                                            >
                                                <Button type="dashed" icon={<UploadCloud size={16} />} block style={{ height: 60, borderRadius: 5 }}>
                                                    {selectedFile ? selectedFile.name : "Nhấn để tải lên Video (MP4)"}
                                                </Button>
                                            </Upload>
                                            {selectedFile && <Text type="success" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>✓ Sẵn sàng để băm video</Text>}
                                        </div>
                                    ) : (
                                        <Form.Item name="hls_video_url" rules={[{ required: true, message: 'Vui lòng nhập link video từ server!' }]}>
                                            <Input prefix={<Link size={16} style={{ color: '#bfbfbf' }} />} placeholder="Nhập link video MP4 từ server công ty..." style={{ height: 40 }} />
                                        </Form.Item>
                                    )}
                                </div>
                            ) : (
                                <Form.Item name="video_url" label="Link Video (Youtube hoặc link trực tiếp)" rules={[{ required: true }]}>
                                    <Input placeholder="Ví dụ: https://www.youtube.com/watch?v=..." style={{ height: 40 }} />
                                </Form.Item>
                            )}
                        </div>
                    </div>
                </Col>
            </Row>
        </div>
    );
}
