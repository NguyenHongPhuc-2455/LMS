import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Result, Button, Spin, Typography, Card } from 'antd';
import api from '../../api';

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
                const res = await api.get(`/payments/vnpay-return?${searchParams.toString()}`);
                if (res.data.status === 'success') {
                    setStatus('success');
                } else {
                    setStatus('fail');
                }
                setMessage(res.data.message);
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
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 20 }}>
                <Spin size="large" />
                <Text>Đang xác thực giao dịch với VNPay...</Text>
            </div>
        );
    }

    return (
        <div style={{ padding: '60px 20px', display: 'flex', justifyContent: 'center', background: '#f8fafc', minHeight: '100vh' }}>
            <Card style={{ maxWidth: 600, width: '100%', borderRadius: 20, boxShadow: '0 10px 30px rgba(0,0,0,0.05)', border: 'none' }}>
                {status === 'success' ? (
                    <Result
                        status="success"
                        title="Thanh toán thành công!"
                        subTitle="Chào mừng bạn đến với khóa học. Bây giờ bạn đã có quyền truy cập toàn bộ nội dung."
                        extra={[
                            <Button type="primary" key="learn" size="large" onClick={() => navigate('/my-courses')} style={{ borderRadius: 10, height: 45, padding: '0 30px' }}>
                                Vào học ngay
                            </Button>,
                            <Button key="home" size="large" onClick={() => navigate('/')} style={{ borderRadius: 10, height: 45 }}>
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
                            <Button type="primary" key="retry" size="large" onClick={() => navigate('/')} style={{ borderRadius: 10, height: 45 }}>
                                Thử lại
                            </Button>
                        ]}
                    />
                )}
            </Card>
        </div>
    );
}
