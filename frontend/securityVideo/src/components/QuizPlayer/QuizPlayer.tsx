import { useEffect, useState, useRef } from 'react';
import { Card, Typography, Radio, Button, Space, Divider, Alert, message, Spin, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';
import api from '../../api';
import './QuizPlayer.scss';

const { Title, Text } = Typography;

interface QuizPlayerProps {
    lessonId: number;
    onCompleted?: () => void;
}

export default function QuizPlayer({ lessonId, onCompleted }: QuizPlayerProps) {
    const [quiz, setQuiz] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);
    const timerRef = useRef<any>(null);

    const fetchQuiz = async (fresh = false) => {
        setLoading(true);
        setResult(null);
        setAnswers({});
        if (timerRef.current) clearInterval(timerRef.current);

        try {
            const res = await api.get(`/quizzes/lesson/${lessonId}`);
            const quizData = res.data.data;
            setQuiz(quizData);

            // Nếu có kết quả cũ thì hiển thị luôn (trừ khi đang ép làm mới bài)
            if (quizData.lastAttempt && !fresh) {
                const attempt = quizData.lastAttempt;
                setResult({
                    status: attempt.status,
                    score: attempt.score,
                    correctCount: attempt.answers.filter((a: any) => {
                        const quest = (quizData.questions || []).find((q: any) => q.id === a.question_id);
                        const opt = (quest?.options || []).find((o: any) => o.id === a.option_id);
                        return opt?.is_correct;
                    }).length,
                    totalQuestions: (quizData.questions || []).length
                });

                // Fill lại câu trả lời cũ
                const oldAnswers: Record<number, number> = {};
                attempt.answers.forEach((a: any) => {
                    oldAnswers[a.question_id] = a.option_id;
                });
                setAnswers(oldAnswers);
            }

            if (quizData.time_limit && (fresh || !quizData.lastAttempt)) {
                setTimeLeft(quizData.time_limit);
            } else {
                setTimeLeft(null);
            }
        } catch (e) {
            message.error('Không thể tải bài trắc nghiệm');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (lessonId) {
            fetchQuiz();
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [lessonId]);

    useEffect(() => {
        if (timeLeft !== null && timeLeft > 0 && !result) {
            timerRef.current = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev === null || prev <= 1) {
                        clearInterval(timerRef.current!);
                        handleSubmit(); // Auto submit when time is up
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [timeLeft, result]);

    const handleOptionChange = (questionId: number, optionId: number) => {
        if (result) return; // Prevent changing after submit
        setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    };

    const handleSubmit = async () => {
        if (!quiz) return;
        setSubmitting(true);
        if (timerRef.current) clearInterval(timerRef.current);

        const formattedAnswers = Object.entries(answers).map(([qId, oId]) => ({
            question_id: parseInt(qId),
            option_id: oId
        }));

        try {
            const res = await api.post(`/quizzes/${quiz.id}/submit`, { answers: formattedAnswers });
            setResult(res.data.data);
            if (res.data.data.status === 'PASSED' && onCompleted) {
                onCompleted();
            }
        } catch (e: any) {
            message.error(e.response?.data?.error || 'Lỗi khi nộp bài');
        } finally {
            setSubmitting(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="quiz-player-loading"><Spin size="large" /></div>;
    if (!quiz) return <Alert type="error" message="Không tìm thấy bài trắc nghiệm" />;

    return (
        <Card bordered={false} className="quiz-player-card">
            <div className="quiz-header">
                <div>
                    <Title level={4} className="quiz-title">{quiz.lesson?.title || 'Bài Kiểm Tra'}</Title>
                    {quiz.description && <Text type="secondary" className="quiz-desc">{quiz.description}</Text>}
                </div>
                <Space direction="vertical" align="end">
                    <Tag color="geekblue" className="quiz-tag-pass">
                        Điểm Đạt: {quiz.pass_score}%
                    </Tag>
                    {timeLeft !== null && (
                        <Tag icon={<ClockCircleOutlined />} color={timeLeft < 60 ? "error" : "default"} className="quiz-tag-timer">
                            {formatTime(timeLeft)}
                        </Tag>
                    )}
                </Space>
            </div>

            <Divider />

            {result && (
                <div className="quiz-result-summary">
                    Kết quả: {result.correctCount} / {result.totalQuestions} câu đúng - Điểm: {result.score} / 100
                </div>
            )}

            <div className="questions-container">
                {quiz.questions?.map((q: any, index: number) => {
                    const isCorrectAnswer = result?.status && q.options.find((o: any) => o.id === answers[q.id])?.is_correct;
                    const isIncorrectAnswer = result?.status && !q.options.find((o: any) => o.id === answers[q.id])?.is_correct && answers[q.id];
                    const notAnswered = result?.status && !answers[q.id];

                    return (
                        <div key={q.id} className={`question-item ${result ? (isCorrectAnswer ? 'correct' : 'incorrect') : ''}`}>
                            <Title level={5} className="question-title-wrapper">
                                <span className="question-number">
                                    {index + 1}
                                </span>
                                <div>
                                    {q.content}
                                    {result && (
                                        <span className="question-status-icon">
                                            {isCorrectAnswer && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
                                            {isIncorrectAnswer && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                                            {notAnswered && <CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
                                        </span>
                                    )}
                                </div>
                            </Title>

                            <Radio.Group
                                onChange={(e) => handleOptionChange(q.id, e.target.value)}
                                value={answers[q.id]}
                                disabled={!!result}
                                className="options-group"
                            >
                                {q.options?.map((o: any) => {
                                    const showCorrect = result && o.is_correct;
                                    return (
                                        <Radio
                                            key={o.id}
                                            value={o.id}
                                            className={`option-item ${showCorrect ? 'correct-option' : ''}`}
                                        >
                                            {o.content} {showCorrect && <Text type="success" style={{ marginLeft: 8 }}>(Đáp án đúng)</Text>}
                                        </Radio>
                                    );
                                })}
                            </Radio.Group>

                            {result && isIncorrectAnswer && q.explanation && (
                                <Alert
                                    message="Giải thích"
                                    description={q.explanation}
                                    type="info"
                                    showIcon
                                    className="explanation-alert"
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <Divider />

            <div className="submit-btn-wrapper">
                {!result ? (
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleSubmit}
                        loading={submitting}
                        className="submit-btn"
                    >
                        Nộp Bài
                    </Button>
                ) : (
                    <Button
                        icon={<SyncOutlined />}
                        size="large"
                        onClick={() => fetchQuiz(true)}
                        className="submit-btn"
                    >
                        Làm Lại Bài
                    </Button>
                )}
            </div>
        </Card>
    );
}


