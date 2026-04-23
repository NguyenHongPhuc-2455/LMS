import { Form, Input, Row, Col, InputNumber, Divider, Card, Typography, Button, Radio, Select } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import styles from '../LessonManagement.module.scss';

const { Text } = Typography;

interface QuizLessonFormProps {
    sections: any[];
    form: any;
}

export default function QuizLessonForm({ sections, form }: QuizLessonFormProps) {
    return (
        <div style={{ padding: '4px' }}>
            <Row gutter={32}>
                <Col span={12}>
                    <Form.Item name="section_id" label="Chương học" rules={[{ required: true }]}>
                        <Select options={sections.map(s => ({ value: s.id, label: s.title }))} placeholder="Chọn chương bọc cho bài giảng" />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={16}>
                            <Form.Item name="title" label="Tiêu đề bài trắc nghiệm" rules={[{ required: true }]}>
                                <Input placeholder="Ví dụ: Kiểm tra kiến thức chương 1" />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name="order" label="Thứ tự hiển thị">
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>

                <Col span={12}>
                    <Form.Item name="description" label="Hướng dẫn / Mô tả bài thi">
                        <Input.TextArea rows={2} placeholder="Nhập hướng dẫn làm bài..." />
                    </Form.Item>

                    <Row gutter={12}>
                        <Col span={12}>
                            <Form.Item name="pass_score" label="Mức điểm Đạt (%)" initialValue={80}>
                                <InputNumber min={0} max={100} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="time_limit" label="Thời gian (Giây) - 0 = Không hạn" initialValue={null}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                </Col>
            </Row>

            <Divider>Danh sách câu hỏi</Divider>

            <Form.List name="questions">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }, index) => (
                            <Card size="small" key={key} className={styles.quizQuestionCard} title={`Câu ${index + 1}`} style={{ marginBottom: 24, border: '1px solid #e2e8f0', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'content']}
                                    label="Nội dung câu hỏi"
                                    rules={[{ required: true, message: 'Nhập câu hỏi' }]}
                                >
                                    <Input placeholder="Nhập nội dung câu hỏi tại đây..." />
                                </Form.Item>

                                <Text strong style={{ display: 'block', marginBottom: 12 }}>Các lựa chọn (Đánh dấu vào đáp án đúng)</Text>
                                <Form.List name={[name, 'options']}>
                                    {(optFields, { add: addOpt, remove: removeOpt }) => (
                                        <div className={styles.quizOptionsWrapper}>
                                            {optFields.map((optField, oIdx) => (
                                                <Row key={optField.key} gutter={8} align="middle" className={styles.quizOptionRow} style={{ marginBottom: 12 }}>
                                                    <Col span={3}>
                                                        <Form.Item {...optField} name={[optField.name, 'is_correct']} valuePropName="checked" noStyle>
                                                            <Radio
                                                                onChange={() => {
                                                                    const currentQuestions = form.getFieldValue('questions');
                                                                    if (currentQuestions && currentQuestions[name] && currentQuestions[name].options) {
                                                                        const newOptions = currentQuestions[name].options.map((o: any, idx: number) => ({
                                                                            ...o,
                                                                            is_correct: idx === oIdx
                                                                        }));
                                                                        form.setFieldValue(['questions', name, 'options'], newOptions);
                                                                    }
                                                                }}
                                                            >
                                                                Đúng
                                                            </Radio>
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={20}>
                                                        <Form.Item {...optField} name={[optField.name, 'content']} noStyle rules={[{ required: true }]}>
                                                            <Input placeholder={`Lựa chọn ${oIdx + 1}`} />
                                                        </Form.Item>
                                                    </Col>
                                                    <Col span={1}>
                                                        <DeleteOutlined className={styles.quizOptionDelete} onClick={() => removeOpt(optField.name)} />
                                                    </Col>
                                                </Row>
                                            ))}
                                            {optFields.length < 5 && (
                                                <Button type="dashed" onClick={() => addOpt({ is_correct: false })} block icon={<PlusOutlined />} style={{ marginTop: 8 }}>
                                                    Thêm lựa chọn
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </Form.List>

                                <Divider className={styles.quizDivider} style={{ margin: '16px 0' }} />

                                <Form.Item
                                    {...restField}
                                    name={[name, 'explanation']}
                                    label="Giải thích đáp án (tùy chọn)"
                                    className={styles.quizExplanationItem}
                                >
                                    <Input.TextArea placeholder="Giải giải thích vì sao lại chọn đáp án này để người học dễ hiểu hơn..." rows={2} />
                                </Form.Item>

                                <Button type="text" danger icon={<DeleteOutlined />} onClick={() => remove(name)} className={styles.quizQuestionDelete} style={{ top: 10, right: 10 }}>
                                    Xóa câu này
                                </Button>
                            </Card>
                        ))}
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className={styles.addQuestionBtn} style={{ height: 45 }}>
                            Thêm câu hỏi mới
                        </Button>
                    </>
                )}
            </Form.List>
        </div>
    );
}
