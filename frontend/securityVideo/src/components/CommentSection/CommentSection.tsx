import React, { useState, useEffect, useCallback } from 'react';
import { List, Avatar, Button, Input, message, Typography, Space, Popconfirm } from 'antd';
import { SendOutlined, MessageOutlined, DeleteOutlined, UserOutlined } from '@ant-design/icons';
import { commentService } from '../../services/comment.service';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/vi';

dayjs.extend(relativeTime);
dayjs.locale('vi');
import styles from './CommentSection.module.scss';


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
    const [expandedComments, setExpandedComments] = useState<number[]>([]);

    const toggleExpand = (id: number) => {
        setExpandedComments(prev =>
            prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
        );
    };

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
            setExpandedComments([]); // Reset expansion when lesson changes
        }
    }, [lessonId, fetchComments]);

    // Xử lý tự động bung comment khi có hash (từ thông báo)
    useEffect(() => {
        const hash = window.location.hash;
        if (hash.startsWith('#comment-') && comments.length > 0) {
            const targetId = parseInt(hash.replace('#comment-', ''));
            if (!isNaN(targetId)) {
                const parentIds: number[] = [];
                const findParents = (list: Comment[], id: number): boolean => {
                    for (const item of list) {
                        if (item.id === id) return true;
                        if (item.replies && findParents(item.replies, id)) {
                            parentIds.push(item.id);
                            return true;
                        }
                    }
                    return false;
                };

                if (findParents(comments, targetId)) {
                    if (parentIds.length > 0) {
                        setExpandedComments(prev => [...new Set([...prev, ...parentIds])]);
                    }
                    // Đợi DOM render xong các comment con mới scroll
                    setTimeout(() => {
                        const el = document.getElementById(`comment-${targetId}`);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // Highlight hiệu ứng nhẹ
                            const originalBg = el.style.background;
                            el.style.transition = 'background 0.5s';
                            el.style.background = '#fef9c3'; // Vàng nhạt highlight
                            setTimeout(() => {
                                el.style.background = originalBg;
                                // Xóa hash khỏi URL để không bị highlight lại nếu quay lại bài học này
                                if (window.location.hash === hash) {
                                    window.history.replaceState(null, '', window.location.pathname + window.location.search);
                                }
                            }, 2000);
                        }
                    }, 300);
                }
            }
        }
    }, [comments]);

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
                // Tự động mở rộng nếu đang bị ẩn
                if (parentId && !expandedComments.includes(parentId)) {
                    setExpandedComments(prev => [...prev, parentId]);
                }
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
        const isExpanded = expandedComments.includes(item.id);

        return (
            <div key={item.id} id={`comment-${item.id}`} className={`${styles.commentItem} ${level > 0 ? styles.reply : ''}`}>
                <div className={styles.commentItemContent}>
                    <Avatar
                        src={item.user.avatar}
                        icon={<UserOutlined />}
                        size={level > 0 ? 'small' : 'default'}
                    />
                    <div className={styles.commentBody}>
                        <div className={styles.commentItemHeader}>
                            <Space size={8}>
                                <Text strong className={styles.commentAuthorName}>{item.user.full_name || item.user.username}</Text>
                                <Text type="secondary" className={styles.commentTime}>
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
                        <Text className={styles.commentText}>{item.content}</Text>

                        <div className={styles.commentActions}>
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
                                className={styles.commentReplyBtn}
                            >
                                Phản hồi
                            </Button>
                        </div>

                        {replyTo === item.id && (
                            <div className={styles.commentReplyInputWrapper}>
                                <TextArea
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    placeholder={`Phản hồi tới ${item.user.full_name || item.user.username}...`}
                                    autoSize={{ minRows: 2, maxRows: 4 }}
                                    className={styles.replyTextarea}
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
                            <div className={`${styles.repliesContainer} ${level < 1 ? styles.level0 : ''}`}>
                                {!isExpanded ? (
                                    <Button
                                        type="text"
                                        onClick={() => toggleExpand(item.id)}
                                        className={styles.viewRepliesBtn}
                                    >
                                        <div className={styles.btnLine}></div>
                                        Xem {item.replies.length} phản hồi...
                                    </Button>
                                ) : (
                                    <>
                                        {item.replies.map(reply => renderCommentItem(reply, level + 1))}
                                        <Button
                                            type="text"
                                            onClick={() => toggleExpand(item.id)}
                                            className={styles.hideRepliesBtn}
                                        >
                                            Ẩn phản hồi
                                        </Button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.commentSectionContainer}>
            <Title level={4} className={styles.commentSectionTitle}>
                <MessageOutlined /> Bình luận ({comments.length + comments.reduce((acc, curr) => acc + (curr.replies?.length || 0), 0)})
            </Title>

            <div className={styles.commentInputWrapper}>
                <TextArea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Bạn có thắc mắc gì về bài học này không?"
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    className={styles.commentTextarea}
                />
                <div className={styles.commentSubmitBtnWrapper}>
                    <Button
                        type="primary"
                        icon={<SendOutlined />}
                        onClick={() => handleSubmit()}
                        loading={submitting}
                        className={styles.commentSubmitBtn}
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


