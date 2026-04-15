import React, { useState, useEffect, useCallback } from 'react';
import { List, Avatar, Button, Input, message, Typography, Space, Popconfirm } from 'antd';
import { SendOutlined, MessageOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { commentService } from '../services/api.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');

const { Title, Text } = Typography;
const { TextArea } = Input;

interface User {
    id: number;
    full_name: string;
    avatar: string;
    username: string;
}

interface Comment {
    id: number;
    content: string;
    user_id: number;
    lesson_id: number;
    parent_id: number | null;
    created_at: string;
    user: User;
    replies?: Comment[];
}

interface CommentSectionProps {
    lessonId: number;
    currentUser: any;
}

const CommentSection: React.FC<CommentSectionProps> = ({ lessonId, currentUser }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [content, setContent] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await commentService.getByLesson(lessonId);
            setComments(data);
        } catch (error: any) {
            console.error('Fetch comments error:', error);
            // message.error('Không thể tải bình luận');
        } finally {
            setLoading(false);
        }
    }, [lessonId]);

    useEffect(() => {
        if (lessonId) {
            fetchComments();
            setReplyTo(null);
            setContent('');
        }
    }, [lessonId, fetchComments]);

    const handleSubmit = async (parentId?: number) => {
        const text = parentId ? replyContent : content;
        if (!text.trim()) return;

        if (!currentUser) {
            message.warning('Vui lòng đăng nhập để bình luận');
            return;
        }

        setSubmitting(true);
        try {
            await commentService.create({
                lesson_id: lessonId,
                content: text,
                parent_id: parentId
            });
            message.success('Đã gửi bình luận');
            if (parentId) {
                setReplyTo(null);
                setReplyContent('');
            } else {
                setContent('');
            }
            fetchComments();
        } catch (error: any) {
            message.error('Lỗi khi gửi bình luận');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await commentService.delete(id);
            message.success('Đã xóa bình luận');
            fetchComments();
        } catch (error: any) {
            message.error('Không thể xóa bình luận');
        }
    };

    const renderCommentItem = (item: Comment, level = 0) => {
        const isAdmin = currentUser?.roles?.includes('admin');
        const isOwner = currentUser?.id === item.user_id;

        return (
            <div key={item.id} id={`comment-${item.id}`} style={{
                marginBottom: level > 0 ? '8px' : '24px',
                padding: '12px',
                borderRadius: '12px',
                background: level > 0 ? '#f8fafc' : '#fff',
                border: level > 0 ? 'none' : '1px solid #f1f5f9'
            }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <Avatar
                        src={item.user.avatar}
                        icon={<UserOutlined />}
                        size={level > 0 ? 'small' : 'default'}
                    />
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <Space size={8}>
                                <Text strong style={{ fontSize: '14px' }}>{item.user.full_name || item.user.username}</Text>
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                    {dayjs(item.created_at).fromNow()}
                                </Text>
                            </Space>
                            {(isOwner || isAdmin) && (
                                <Popconfirm
                                    title="Xóa bình luận"
                                    description="Bạn có chắc chắn muốn xóa bình luận này?"
                                    onConfirm={() => handleDelete(item.id)}
                                    okText="Xóa"
                                    cancelText="Hủy"
                                >
                                    <Button type="text" danger icon={<DeleteOutlined />} size="small" />
                                </Popconfirm>
                            )}
                        </div>
                        <Text style={{ fontSize: '14px', lineHeight: '1.6', color: '#334155' }}>{item.content}</Text>

                        <div style={{ marginTop: '8px' }}>
                            <Button
                                type="text"
                                size="small"
                                icon={<MessageOutlined />}
                                onClick={() => {
                                    if (replyTo === item.id) {
                                        setReplyTo(null);
                                    } else {
                                        setReplyTo(item.id);
                                        setReplyContent('');
                                    }
                                }}
                                style={{ padding: 0, color: '#6366f1', fontSize: '12px' }}
                            >
                                Phản hồi
                            </Button>
                        </div>

                        {replyTo === item.id && (
                            <div style={{ marginTop: '12px' }}>
                                <TextArea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={`Phản hồi tới ${item.user.full_name || item.user.username}...`}
                                    autoSize={{ minRows: 2, maxRows: 4 }}
                                    style={{ borderRadius: '8px', marginBottom: '8px' }}
                                />
                                <Space>
                                    <Button
                                        type="primary"
                                        size="small"
                                        onClick={() => handleSubmit(item.id)}
                                        loading={submitting}
                                        icon={<SendOutlined />}
                                    >
                                        Gửi
                                    </Button>
                                    <Button size="small" onClick={() => setReplyTo(null)}>Hủy</Button>
                                </Space>
                            </div>
                        )}

                        {item.replies && item.replies.length > 0 && (
                            <div style={{
                                marginTop: '16px',
                                borderLeft: level < 1 ? '2px solid #e2e8f0' : 'none',
                                paddingLeft: level < 1 ? '16px' : '0'
                            }}>
                                {item.replies.map(reply => renderCommentItem(reply, level + 1))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div style={{ marginTop: '40px' }}>
            <Title level={4} style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MessageOutlined /> Bình luận ({comments.length + comments.reduce((acc, curr) => acc + (curr.replies?.length || 0), 0)})
            </Title>

            <div style={{ marginBottom: '32px', background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
                <TextArea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Bạn có thắc mắc gì về bài học này không?"
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    style={{ borderRadius: '12px', border: 'none', padding: '12px', marginBottom: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={() => handleSubmit()}
                        loading={submitting}
                        style={{ height: '40px', borderRadius: '10px', background: '#6366f1' }}
                    >
                        Gửi câu hỏi
                    </Button>
                </div>
            </div>

            <List
                loading={loading}
                dataSource={comments}
                renderItem={(item) => renderCommentItem(item)}
                locale={{ emptyText: 'Chưa có bình luận nào cho bài học này.' }}
            />
        </div>
    );
};

export default CommentSection;
