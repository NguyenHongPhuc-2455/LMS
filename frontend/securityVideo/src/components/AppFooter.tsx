import React from 'react';
import { Row, Col, Typography, Space, Divider } from 'antd';
import {
    FacebookFilled, YoutubeFilled
} from '@ant-design/icons';
import './AppFooter.scss';

const { Title, Text, Link, Paragraph } = Typography;

const AppFooter: React.FC = () => {
    return (
        <footer className="app-footer">
            <Row gutter={[32, 32]}>
                <Col lg={6} md={12} span={24}>
                    <Space orientation="vertical" size={16}>
                        <div className="footer-logo-wrapper">
                            <img src="/logo/logo.png" alt="Logo" className="footer-logo" />
                        </div>
                        <Space orientation="vertical" size={8}>
                            <Text className="footer-contact-text">Điện thoại: 0246.329.1102</Text>
                            <Text className="footer-contact-text">Email: contact@ritavo.com</Text>
                            <Text className="footer-contact-text">Địa chỉ: Số 26 Ngõ 102, Trần Phú, Hà Đông, Hà Nội</Text>
                        </Space>
                        {/* <Space size={12} style={{ marginTop: '10px' }}>
                            <img src="https://fullstack.edu.vn/static/media/dmca.256085a8.png" style={{ height: '28px' }} alt="DMCA" />
                            <img src="https://fullstack.edu.vn/static/media/bct.2743950b.png" style={{ height: '28px' }} alt="BCT" />
                        </Space> */}
                    </Space>
                </Col>

                <Col lg={4} md={12} span={24}>
                    <Title level={5} className="footer-section-title">VỀ RITAVO</Title>
                    <Space orientation="vertical" size={8}>
                        <Link href="#" className="footer-link">Giới thiệu</Link>
                        <Link href="#" className="footer-link">Liên hệ</Link>
                        <Link href="#" className="footer-link">Điều khoản & Quy định</Link>
                        <Link href="#" className="footer-link">Chính sách bảo mật</Link>
                    </Space>
                </Col>

                <Col lg={4} md={12} span={24}>
                    <Title level={5} className="footer-section-title">HỖ TRỢ</Title>
                    <Space orientation="vertical" size={8}>
                        <Link href="#" className="footer-link">Chính sách thanh toán</Link>
                        <Link href="#" className="footer-link">Chính sách vận chuyển</Link>
                        <Link href="#" className="footer-link">Chính sách kiểm hàng</Link>
                        <Link href="#" className="footer-link">Quy định về giá</Link>
                    </Space>
                </Col>

                <Col lg={4} md={12} span={24}>
                    <Title level={5} className="footer-section-title">CÔNG CỤ</Title>
                    <Space orientation="vertical" size={8}>
                        <Link href="#" className="footer-link">Tạo CV xin việc</Link>
                        <Link href="#" className="footer-link">Rút gọn liên kết</Link>
                        <Link href="#" className="footer-link">Clip-path maker</Link>
                        <Link href="#" className="footer-link">Snippet generator</Link>
                    </Space>
                </Col>

                <Col lg={6} md={12} span={24}>
                    <Title level={5} className="footer-section-title">CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC RITAVO</Title>
                    <Paragraph className="footer-company-desc">
                        Địa chỉ: Tầng 4, tòa nhà Anh Minh, số 36 Hoàng Cầu, Đống Đa, Hà Nội<br />
                        Mã số doanh nghiệp: 0109922901 do Chi cục Thuế Quận Đống Đa cấp ngày 04/03/2022
                    </Paragraph>
                    <Space size={16} align="center">
                        <FacebookFilled className="footer-social-icon" />
                        <YoutubeFilled className="footer-social-icon" />
                        <div className="tiktok-icon-wrapper">
                            <img src="https://fullstack.edu.vn/static/media/tiktok.82fccd81.svg" alt="tiktok" />
                        </div>
                    </Space>
                </Col>
            </Row>

            <Divider className="footer-divider" />

            <Row justify="space-between" align="middle">
                <Col>
                    <Text className="footer-bottom-text">© 2026 RitaVo LMS. Nền tảng học lập trình hàng đầu Việt Nam.</Text>
                </Col>
                <Col>
                    <Space separator={<Divider type="vertical" className="footer-vertical-divider" />}>
                        <Text className="footer-bottom-text">Made with ❤️ in Vietnam</Text>
                    </Space>
                </Col>
            </Row>
        </footer>
    );
};

export default AppFooter;
