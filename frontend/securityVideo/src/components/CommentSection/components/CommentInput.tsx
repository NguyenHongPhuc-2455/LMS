import React from 'react';
import { Input, Button } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import styles from './CommentInput.module.scss';

const { TextArea } = Input;

interface CommentInputProps {
    value: string;
    onChange: (val: string) => void;
    onSubmit: () => void;
    submitting: boolean;
    placeholder?: string;
    onCancel?: () => void;
    autoFocus?: boolean;
    isReply?: boolean;
}

const CommentInput: React.FC<CommentInputProps> = ({
    value,
    onChange,
    onSubmit,
    submitting,
    placeholder = "Bạn có thắc mắc gì về bài học này không?",
    onCancel,
    autoFocus,
    isReply
}) => {
    return (
        <div className={isReply ? styles.replyInputWrapper : styles.commentInputWrapper}>
            <TextArea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                autoSize={{ minRows: isReply ? 2 : 3, maxRows: 6 }}
                className={isReply ? styles.replyTextarea : styles.commentTextarea}
                autoFocus={autoFocus}
            />
            <div className={styles.submitBtnWrapper}>
                <Button
                    type="primary"
                    icon={<SendOutlined />}
                    onClick={onSubmit}
                    loading={submitting}
                    className={styles.submitBtn}
                    size={isReply ? "small" : undefined}
                >
                    {isReply ? "Gửi" : "Gửi câu hỏi"}
                </Button>
                {onCancel && (
                    <Button size="small" onClick={onCancel} style={{ marginLeft: 8 }}>
                        Hủy
                    </Button>
                )}
            </div>
        </div>
    );
};

export default CommentInput;
