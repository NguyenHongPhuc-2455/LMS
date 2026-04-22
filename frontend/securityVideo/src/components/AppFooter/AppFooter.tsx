import React from 'react';
import { Row, Col, Typography, Space, Divider } from 'antd';
import {
    FacebookFilled, YoutubeFilled
} from '@ant-design/icons';
import styles from './AppFooter.module.scss';


const { Title, Text, Link, Paragraph } = Typography;

const AppFooter: React.FC = () => {
    return (
        <footer className={styles.appFooter}>
            <Row gutter={[32, 32]}>
                <Col lg={6} md={12} span={24}>
                    <Space orientation="vertical" size={16}>
                        <div className={styles.footerLogoWrapper}>
                            <img src="/logo/logo.svg" alt="Logo" className={styles.footerLogo} />
                        </div>
                        <Space orientation="vertical" size={8}>
                            <Text className={styles.footerContactText}>Điện thoại: 0246.329.1102</Text>
                            <Text className={styles.footerContactText}>Email: contact@ritavo.com</Text>
                            <Text className={styles.footerContactText}>Địa chỉ: Số 26 Ngõ 102, Trần Phú, Hà Đông, Hà Nội</Text>
                        </Space>
                        {/* <Space size={12} style={{ marginTop: '10px' }}>
                            <img src="https://fullstack.edu.vn/static/media/dmca.256085a8.png" style={{ height: '28px' }} alt="DMCA" />
                            <img src="https://fullstack.edu.vn/static/media/bct.2743950b.png" style={{ height: '28px' }} alt="BCT" />
                        </Space> */}
                    </Space>
                </Col>

                <Col lg={4} md={12} span={24}>
                    <Title level={5} className={styles.footerSectionTitle}>VỀ RITAVO</Title>
                    <Space orientation="vertical" size={8}>
                        <Link href="#" className={styles.footerLink}>Giới thiệu</Link>
                        <Link href="#" className={styles.footerLink}>Liên hệ</Link>
                        <Link href="#" className={styles.footerLink}>Điều khoản & Quy định</Link>
                        <Link href="#" className={styles.footerLink}>Chính sách bảo mật</Link>
                    </Space>
                </Col>

                <Col lg={4} md={12} span={24}>
                    <Title level={5} className={styles.footerSectionTitle}>HỖ TRỢ</Title>
                    <Space orientation="vertical" size={8}>
                        <Link href="#" className={styles.footerLink}>Chính sách thanh toán</Link>
                        <Link href="#" className={styles.footerLink}>Chính sách vận chuyển</Link>
                        <Link href="#" className={styles.footerLink}>Chính sách kiểm hàng</Link>
                        <Link href="#" className={styles.footerLink}>Quy định về giá</Link>
                    </Space>
                </Col>

                <Col lg={4} md={12} span={24}>
                    <Title level={5} className={styles.footerSectionTitle}>CÔNG CỤ</Title>
                    <Space orientation="vertical" size={8}>
                        <Link href="#" className={styles.footerLink}>Tạo CV xin việc</Link>
                        <Link href="#" className={styles.footerLink}>Rút gọn liên kết</Link>
                        <Link href="#" className={styles.footerLink}>Clip-path maker</Link>
                        <Link href="#" className={styles.footerLink}>Snippet generator</Link>
                    </Space>
                </Col>

                <Col lg={6} md={12} span={24}>
                    <Title level={5} className={styles.footerSectionTitle}>CÔNG TY CỔ PHẦN CÔNG NGHỆ GIÁO DỤC RITAVO</Title>
                    <Paragraph className={styles.footerCompanyDesc}>
                        Địa chỉ: Tầng 4, tòa nhà Anh Minh, số 36 Hoàng Cầu, Đống Đa, Hà Nội<br />
                        Mã số doanh nghiệp: 0109922901 do Chi cục Thuế Quận Đống Đa cấp ngày 04/03/2022
                    </Paragraph>
                    <Space size={16} align="center">
                        <FacebookFilled className={styles.footerSocialIcon} />
                        <YoutubeFilled className={styles.footerSocialIcon} />
                        <div className={styles.tiktokIconWrapper}>
                            <img src="https://fullstack.edu.vn/static/media/tiktok.82fccd81.svg" alt="tiktok" />
                        </div>
                    </Space>
                </Col>
            </Row>

            <Divider className={styles.footerDivider} />

            <Row justify="space-between" align="middle">
                <Col>
                    <Text className={styles.footerBottomText}>© 2026 RitaVo LMS. Nền tảng học lập trình hàng đầu Việt Nam.</Text>
                </Col>
                <Col>
                    <Space separator={<Divider type="vertical" className={styles.footerVerticalDivider} />}>
                        <Text className={styles.footerBottomText}>Made with ❤️ in Vietnam</Text>
                    </Space>
                </Col>
            </Row>
        </footer>
    );
};

export default AppFooter;


