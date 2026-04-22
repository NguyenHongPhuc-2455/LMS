import React, { useState } from 'react';
import { Avatar, Button, Typography, Space, Popconfirm, Dropdown, Input } from 'antd';
import { MessageOutlined, UserOutlined, MoreOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { Comment, User } from '../types';
import CommentInput from './CommentInput';
import styles from '../CommentSection.module.scss';

const { Text } = Typography;

interface CommentItemProps {
    item: Comment;
    currentUser: User | null;
    level?: number;
    expandedComments: number[];
    toggleExpand: (id: number) => void;
    onDelete: (id: number) => void;
    onUpdate: (id: number, content: string) => Promise<void>;
    onReply: (parentId: number, content: string) => Promise<void>;
    submitting: boolean;
}



const CommentItem: React.FC<CommentItemProps> = ({
    item,
    currentUser,
    level = 0,
    expandedComments,
    toggleExpand,
    onDelete,
    onUpdate,
    onReply,
    submitting
}) => {
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyTo, setReplyTo] = useState<number | null>(null);
    const [replyContent, setReplyContent] = useState('');

    const isAdmin = currentUser?.roles?.includes('admin');
    const isOwner = currentUser?.id === item.user_id;
    const isExpanded = expandedComments.includes(item.id);

    const handleUpdate = async () => {
        await onUpdate(item.id, editContent);
        setEditingId(null);
    };

    const handleReply = async () => {
        await onReply(item.id, replyContent);
        setReplyTo(null);
        setReplyContent('');
    };

    return (
        <div id={`comment-${item.id}`} className={`${styles.commentItem} ${level > 0 ? styles.reply : ''}`}>
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
                            <Dropdown
                                menu={{
                                    items: [
                                        ...(isOwner ? [{
                                            key: 'edit',
                                            label: 'Chỉnh sửa',
                                            onClick: () => {
                                                setEditingId(item.id);
                                                setEditContent(item.content);
                                            }
                                        }] : []),
                                        {
                                            key: 'delete',
                                            label: (
                                                <Popconfirm
                                                    title="Xóa bình luận"
                                                    description="Bạn có chắc chắn muốn xóa bình luận này?"
                                                    onConfirm={() => onDelete(item.id)}
                                                    okText="Xóa"
                                                    cancelText="Hủy"
                                                    onPopupClick={(e) => e.stopPropagation()}
                                                >
                                                    <span style={{ color: '#ff4d4f' }}>Xóa bình luận</span>
                                                </Popconfirm>
                                            ),
                                            danger: true,
                                        }
                                    ]
                                }}
                                trigger={['click']}
                                placement="bottomRight"
                            >
                                <Button type="text" icon={<MoreOutlined />} size="small" className={styles.moreActionBtn} />
                            </Dropdown>
                        )}
                    </div>

                    {editingId === item.id ? (
                        <div className={styles.editInputWrapper}>
                            <Input.TextArea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                autoSize={{ minRows: 2, maxRows: 6 }}
                                className={styles.editTextarea}
                            />
                            <Space style={{ marginTop: 8 }}>
                                <Button type="primary" size="small" onClick={handleUpdate}>Lưu</Button>
                                <Button size="small" onClick={() => setEditingId(null)}>Hủy</Button>
                            </Space>
                        </div>
                    ) : (
                        <Text className={styles.commentText}>{item.content}</Text>
                    )}

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
                        <CommentInput
                            value={replyContent}
                            onChange={setReplyContent}
                            onSubmit={handleReply}
                            submitting={submitting}
                            placeholder={`Phản hồi tới ${item.user.full_name || item.user.username}...`}
                            onCancel={() => setReplyTo(null)}
                            isReply
                            autoFocus
                        />
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
                                    {item.replies.map(reply => (
                                        <CommentItem
                                            key={reply.id}
                                            item={reply}
                                            currentUser={currentUser}
                                            level={level + 1}
                                            expandedComments={expandedComments}
                                            toggleExpand={toggleExpand}
                                            onDelete={onDelete}
                                            onUpdate={onUpdate}
                                            onReply={onReply}
                                            submitting={submitting}
                                        />
                                    ))}
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

export default CommentItem;
