import React, { useState, useEffect, useCallback } from 'react';
import { List, message, Typography } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { commentService } from '../../services/comment.service';
import type { Comment, User } from './types';
import CommentInput from './components/CommentInput';
import CommentItem from './components/CommentItem';
import styles from './CommentSection.module.scss';

const { Title } = Typography;

interface CommentSectionProps {
    lessonId: number;
    currentUser: User | null;
}

const CommentSection: React.FC<CommentSectionProps> = ({ lessonId, currentUser }) => {
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(false);
    const [submittingId, setSubmittingId] = useState<number | 'main' | null>(null);
    const [content, setContent] = useState('');
    const [expandedComments, setExpandedComments] = useState<number[]>([]);

    const fetchComments = useCallback(async () => {
        setLoading(true);
        try {
            const data = await commentService.getByLesson(lessonId);
            setComments(data);
        } catch (error: any) {
            console.error('Fetch comments error:', error);
        } finally {
            setLoading(false);
        }
    }, [lessonId]);

    useEffect(() => {
        if (lessonId) {
            fetchComments();
            setContent('');
            setExpandedComments([]);
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
                    setTimeout(() => {
                        const el = document.getElementById(`comment-${targetId}`);
                        if (el) {
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            const originalBg = el.style.background;
                            el.style.transition = 'background 0.5s';
                            el.style.background = '#fef9c3'; 
                            setTimeout(() => {
                                el.style.background = originalBg;
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

    const handleSubmit = async (parentId?: number, text?: string) => {
        const finalContent = text || content;
        if (!finalContent.trim()) return;

        if (!currentUser) {
            message.warning('Vui lòng đăng nhập để bình luận');
            return;
        }

        setSubmittingId(parentId || 'main');
        try {
            await commentService.create({
                lesson_id: lessonId,
                content: finalContent,
                parent_id: parentId
            });
            message.success('Đã gửi bình luận');
            if (parentId) {
                if (!expandedComments.includes(parentId)) {
                    setExpandedComments(prev => [...prev, parentId]);
                }
            } else {
                setContent('');
            }
            fetchComments();
        } catch (error: any) {
            message.error('Lỗi khi gửi bình luận');
        } finally {
            setSubmittingId(null);
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

    const handleUpdate = async (id: number, updatedContent: string) => {
        try {
            await commentService.update(id, { content: updatedContent });
            message.success('Đã cập nhật bình luận');
            fetchComments();
        } catch (error: any) {
            message.error('Lỗi khi cập nhật bình luận');
        }
    };

    const toggleExpand = (id: number) => {
        setExpandedComments(prev =>
            prev.includes(id) ? prev.filter(cid => cid !== id) : [...prev, id]
        );
    };

    return (
        <div className={styles.commentSectionContainer}>
            <Title level={4} className={styles.commentSectionTitle}>
                <MessageOutlined /> Bình luận ({comments.length + comments.reduce((acc, curr) => acc + (curr.replies?.length || 0), 0)})
            </Title>

            <CommentInput
                value={content}
                onChange={setContent}
                onSubmit={() => handleSubmit()}
                submitting={submittingId === 'main'}
            />

            <List
                loading={loading}
                dataSource={comments}
                renderItem={(item) => (
                    <CommentItem
                        item={item}
                        currentUser={currentUser}
                        expandedComments={expandedComments}
                        toggleExpand={toggleExpand}
                        onDelete={handleDelete}
                        onUpdate={handleUpdate}
                        onReply={handleSubmit}
                        submittingId={submittingId}
                    />
                )}
                locale={{ emptyText: 'Chưa có bình luận nào cho bài học này.' }}
            />
        </div>
    );
};

export default CommentSection;
