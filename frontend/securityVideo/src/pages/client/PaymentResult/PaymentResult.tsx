import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, Typography, Card } from 'antd';
import { paymentService } from '../../../services/payment.service';
import styles from './PaymentResult.module.scss';

const { Text } = Typography;

export default function PaymentResult() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'success' | 'fail' | 'error' | null>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const verifyPayment = async () => {
            try {
                // Gửi toàn bộ query params về backend để xác thực chữ ký
                const data = await paymentService.verifyVNPayReturn(searchParams.toString());
                if (data.status === 'success') {
                    setStatus('success');
                } else {
                    setStatus('fail');
                }
                setMessage(data.message);

            } catch (error: any) {
                setStatus('error');
                setMessage(error.response?.data?.error || 'Lỗi xác thực thanh toán');
            } finally {
                setLoading(false);
            }
        };

        verifyPayment();
    }, [searchParams]);

    if (loading) {
        return (
            <div className={styles.paymentResultLoading}>
                <Spin size="large" />
                <Text>Đang xác thực giao dịch với VNPay...</Text>
            </div>
        );
    }

    return (
        <div className={styles.paymentResultContainer}>
            <Card className={styles.paymentResultCard}>
                {status === 'success' ? (
                    <Result
                        status="success"
                        title="Thanh toán thành công!"
                        subTitle="Chào mừng bạn đến với khóa học. Bây giờ bạn đã có quyền truy cập toàn bộ nội dung."
                        extra={[
                            <Button type="primary" key="learn" size="large" onClick={() => navigate('/my-courses')} className={styles.paymentBtnPrimary}>
                                Vào học ngay
                            </Button>,
                            <Button key="home" size="large" onClick={() => navigate('/')} className={styles.paymentBtnSecondary}>
                                Quay về trang chủ
                            </Button>
                        ]}
                    />
                ) : (
                    <Result
                        status="error"
                        title="Thanh toán không thành công"
                        subTitle={message || "Giao dịch đã bị hủy hoặc có lỗi xảy ra trong quá trình xử lý."}
                        extra={[
                            <Button type="primary" key="retry" size="large" onClick={() => navigate('/')} className={styles.paymentBtnSecondary}>
                                Thử lại
                            </Button>
                        ]}
                    />
                )}
            </Card>
        </div>
    );
}


