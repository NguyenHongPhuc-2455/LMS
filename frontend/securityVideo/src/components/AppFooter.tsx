import React from 'react';
import { Row, Col, Typography, Space, Divider } from 'antd';
import {
    FacebookFilled, YoutubeFilled
} from '@ant-design/icons';

const { Title, Text, Link, Paragraph } = Typography;

const AppFooter: React.FC = () => {
    return (
        <footer style={{
            background: '#181e2a',
            padding: '48px 100px 24px',
            color: '#d1d5db'
        }}>
            <Row gutter={[32, 32]}>
                <Col lg={6} md={12} span={24}>
                    <Space orientation="vertical" size={16}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {/* <img src="https://fullstack.edu.vn/static/media/f8-icon.18def059.png" alt="RitaVo Logo" style={{ height: '32px' }} /> */}
                            <img src="/logo/logo.png" alt="Logo" style={{ height: '50px', objectFit: 'contain' }} />
                        </div>
                        <Space orientation="vertical" size={8}>
                            <Text style={{ color: '#9ca3af', fontSize: '14px' }}>Điện thoại: 0246.329.1102</Text>
                            <Text style={{ color: '#9ca3af', fontSize: '14px' }}>Email: contact@ritavo.com</Text>
                            <Text style={{ color: '#9ca3af', fontSize: '14px' }}>Địa chỉ: Số 26 Ngõ 102, Trần Phú, Hà Đông, Hà Nội</Text>
                        </Space>
                        {/* <Space size={12} style={{ marginTop: '10px' }}>
                            <img src="https://fullstack.edu.vn/static/media/dmca.256085a8.png" style={{ height: '28px' }} alt="DMCA" />
                            <img src="https://fullstack.edu.vn/static/media/bct.2743950b.png" style={{ height: '28px' }} alt="BCT" />
                        </Space> */}
                    </Space>
                </Col>

                <Col lg={4} md={12} span={24}>
                    <Title level={5} style={{ color: '#fff', marginBottom: '20px', fontSize: '16px' }}>VỀ RITAVO</Title>
                    <Space orientation="vertical" size={8}>
                        <Link href="#" style={{ color: '#9ca3af', fontSize: '14px' }}>Giới thiệu</Link>
                        <Link href="#" style={{ color: '#9ca3af', fontSize: '14px' }}>Liên hệ</Link>
                        <Link href="#" style={{ color: '#9ca3af', fontSize: '14px' }}>Điều khoản & Quy định</Link>
                        <Link href="#" style={{ color: '#9ca3af', fontSize: '14px' }}>Chính sách bảo mật</Link>
                    </Space>
                </Col>

                <Col lg={4} md={12} span={24}>
                    <Title level={5} style={{ color: '#fff', marginBottom: '20px', fontSize: '16px' }}>HỖ TRỢ</Title>
                    <Space orientation="vertical" size={8}>
                        <Link href="#" style={{ color: '#9ca3af', fontSize: '14px' }}>Chính sách thanh toán</Link>
                        <Link href="#" style={{ color: '#9ca3af', fontSize: '14px' }}>Chính sách vận chuyển</Link>
                        <Link href="#" style={{ color: '#9ca3af', fontSize: '14px' }}>Chính sách kiểm hàng</Link>
                        <Link href="#" style={{ color: '#9ca3af', fontSize: '14px' }}>Quy định về giá</Link>
                    </Space>
                </Col>

                <Col lg={4} md={12} span={24}>
                    <Title level={5} style={{ color: '#fff', marginBottom: '20px', fontSize: '16px' }}>CÔNG CỤ</Title>
                    <Space orientation="vertical" size={8}>
                        <Link href="#" style={{ color: '#9ca3af', fontSize: '14px' }}>Tạo CV xin việc</Link>
                        <Link href="#" style={{ color: '#9ca3af', fontSize: '14px' }}>Rút gọn liên kết</Link>
                        <Link href="#" style={{ color: '#9ca3af', fontSize: '14px' }}>Clip-path maker</Link>
                        <Link href="#" style={{ color: '#9ca3af', fontSize: '14px' }}>Snippet generator</Link>
                    </Space>
                </Col>

                <Col lg={6} md={12} span={24}>
                    <Title level={5} style={{ color: '#fff', marginBottom: '20px', fontSize: '16px' }}>CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC RITAVO</Title>
                    <Paragraph style={{ color: '#9ca3af', fontSize: '13px' }}>
                        Địa chỉ: Tầng 4, tòa nhà Anh Minh, số 36 Hoàng Cầu, Đống Đa, Hà Nội<br />
                        Mã số doanh nghiệp: 0109922901 do Chi cục Thuế Quận Đống Đa cấp ngày 04/03/2022
                    </Paragraph>
                    <Space size={16} align="center">
                        <FacebookFilled style={{ fontSize: '24px', color: '#9ca3af' }} />
                        <YoutubeFilled style={{ fontSize: '24px', color: '#9ca3af' }} />
                        <div style={{ background: '#9ca3af', padding: '3px', borderRadius: '4px', height: '18px', display: 'flex', alignItems: 'center' }}>
                            <img src="https://fullstack.edu.vn/static/media/tiktok.82fccd81.svg" style={{ height: '12px', filter: 'brightness(10)' }} alt="tiktok" />
                        </div>
                    </Space>
                </Col>
            </Row>

            <Divider style={{ borderColor: 'rgba(255,255,255,0.1)', margin: '40px 0 20px' }} />

            <Row justify="space-between" align="middle">
                <Col>
                    <Text style={{ color: '#6b7280', fontSize: '12px' }}>© 2026 RitaVo LMS. Nền tảng học lập trình hàng đầu Việt Nam.</Text>
                </Col>
                <Col>
                    <Space separator={<Divider type="vertical" style={{ borderColor: '#374151' }} />}>
                        <Text style={{ color: '#6b7280', fontSize: '12px' }}>Made with ❤️ in Vietnam</Text>
                    </Space>
                </Col>
            </Row>
        </footer>
    );
};

export default AppFooter;
