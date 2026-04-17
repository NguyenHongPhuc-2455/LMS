import React, { useEffect, useState, useRef } from 'react';
import { Card, Typography, Radio, Button, Space, Divider, Alert, message, Spin, Tag } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, SyncOutlined } from '@ant-design/icons';
import api from '../api';

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

    if (loading) return <div style={{ padding: '50px', textAlign: 'center' }}><Spin size="large" /></div>;
    if (!quiz) return <Alert type="error" message="Không tìm thấy bài trắc nghiệm" />;

    return (
        <Card bordered={false} style={{ background: '#fff', borderRadius: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                    <Title level={4} style={{ margin: 0 }}>{quiz.lesson?.title || 'Bài Kiểm Tra'}</Title>
                    {quiz.description && <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>{quiz.description}</Text>}
                </div>
                <Space direction="vertical" align="end">
                    <Tag color="geekblue" style={{ margin: 0, padding: '4px 8px', fontSize: 13 }}>
                        Điểm Đạt: {quiz.pass_score}%
                    </Tag>
                    {timeLeft !== null && (
                        <Tag icon={<ClockCircleOutlined />} color={timeLeft < 60 ? "error" : "default"} style={{ margin: 0, padding: '4px 8px', fontSize: 14, fontWeight: 'bold' }}>
                            {formatTime(timeLeft)}
                        </Tag>
                    )}
                </Space>
            </div>

            <Divider />

            {result && (
                <div style={{ marginBottom: 24, padding: '0 10px', fontSize: '16px', fontWeight: 'bold', color: '#1677ff' }}>
                    Kết quả: {result.correctCount} / {result.totalQuestions} câu đúng - Điểm: {result.score} / 100
                </div>
            )}

            <div style={{ padding: '0 10px' }}>
                {quiz.questions?.map((q: any, index: number) => {
                    const isCorrectAnswer = result?.status && q.options.find((o: any) => o.id === answers[q.id])?.is_correct;
                    const isIncorrectAnswer = result?.status && !q.options.find((o: any) => o.id === answers[q.id])?.is_correct && answers[q.id];
                    const notAnswered = result?.status && !answers[q.id];

                    return (
                        <div key={q.id} style={{ marginBottom: 32, padding: '16px', borderRadius: 8, background: result ? (isCorrectAnswer ? '#f6ffed' : '#fff2f0') : '#fafafa', border: '1px solid', borderColor: result ? (isCorrectAnswer ? '#b37eb8f' : '#ffccc7') : '#f0f0f0' }}>
                            <Title level={5} style={{ marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                                <span style={{ background: '#1677ff', color: '#fff', width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
                                    {index + 1}
                                </span>
                                <div>
                                    {q.content}
                                    {result && (
                                        <span style={{ marginLeft: 8 }}>
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
                                style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, paddingLeft: 32 }}
                            >
                                {q.options?.map((o: any) => {
                                    const showCorrect = result && o.is_correct;
                                    return (
                                        <Radio
                                            key={o.id}
                                            value={o.id}
                                            style={{
                                                whiteSpace: 'normal',
                                                background: showCorrect ? '#e6f4ff' : 'transparent',
                                                padding: showCorrect ? '4px 8px' : '0',
                                                borderRadius: 4
                                            }}
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
                                    style={{ marginTop: 16, marginLeft: 32 }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <Divider />

            <div style={{ textAlign: 'center' }}>
                {!result ? (
                    <Button
                        type="primary"
                        size="large"
                        onClick={handleSubmit}
                        loading={submitting}
                        style={{ padding: '0 40px', height: 48, fontSize: 16 }}
                    >
                        Nộp Bài
                    </Button>
                ) : (
                    <Button
                        icon={<SyncOutlined />}
                        size="large"
                        onClick={() => fetchQuiz(true)}
                        style={{ padding: '0 40px', height: 48, fontSize: 16 }}
                    >
                        Làm Lại Bài
                    </Button>
                )}
            </div>
        </Card>
    );
}
