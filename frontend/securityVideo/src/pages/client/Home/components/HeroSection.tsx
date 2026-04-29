import React, { useState, useEffect } from 'react';
import { Button, Space, Typography } from 'antd';
import { 
    BookOutlined, 
    TrophyOutlined, 
    FireOutlined, 
    FlagOutlined,
    LeftOutlined,
    RightOutlined,
    UserOutlined,
    ClockCircleOutlined
} from '@ant-design/icons';
import { heroBannerService, type HeroBanner } from '../../../../services/heroBanner.service';
import styles from './HeroSection.module.scss';

const { Title, Text } = Typography;

const ICONS = [<BookOutlined />, <TrophyOutlined />, <FireOutlined />, <FlagOutlined />];

export default function HeroSection() {
    const [banners, setBanners] = useState<HeroBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeIndex, setActiveIndex] = useState(0);
    const [rotation, setRotation] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [startRotation, setStartRotation] = useState(0);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const data = await heroBannerService.getAll();
                setBanners(data);
            } catch (error) {
                console.error('Failed to fetch banners:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBanners();
    }, []);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 992);
        handleResize();
        window.addEventListener('resize', handleResize);
        
        let timer: any;
        if (!isDragging && banners.length > 0) {
            timer = setInterval(() => {
                setRotation((prev) => prev - 90);
                setActiveIndex((prev) => (prev + 1) % banners.length);
            }, 4000);
        }

        const onGlobalMove = (e: MouseEvent | TouchEvent) => {
            if (!isDragging) return;
            const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const diffX = x - startX;
            const sensitivity = isMobile ? 0.5 : 0.3;
            setRotation(startRotation + diffX * sensitivity);
        };

        const onGlobalEnd = () => {
            if (!isDragging) return;
            setIsDragging(false);
            const snappedRotation = Math.round(rotation / 90) * 90;
            setRotation(snappedRotation);
            const index = (((-snappedRotation / 90) % banners.length) + banners.length) % banners.length;
            setActiveIndex(index);
        };

        if (isDragging) {
            window.addEventListener('mousemove', onGlobalMove);
            window.addEventListener('mouseup', onGlobalEnd);
            window.addEventListener('touchmove', onGlobalMove);
            window.addEventListener('touchend', onGlobalEnd);
        }

        return () => {
            window.removeEventListener('resize', handleResize);
            if (timer) clearInterval(timer);
            window.removeEventListener('mousemove', onGlobalMove);
            window.removeEventListener('mouseup', onGlobalEnd);
            window.removeEventListener('touchmove', onGlobalMove);
            window.removeEventListener('touchend', onGlobalEnd);
        };
    }, [isDragging, banners.length, rotation, startX, startRotation, isMobile]);

    const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
        // Prevent default browser drag behavior
        if (e.type === 'mousedown') e.preventDefault();
        
        setIsDragging(true);
        const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
        setStartX(x);
        setStartRotation(rotation);
    };

    const nextSlide = () => {
        if (banners.length === 0) return;
        setRotation((prev) => prev - 90);
        setActiveIndex((prev) => (prev + 1) % banners.length);
    };

    const prevSlide = () => {
        if (banners.length === 0) return;
        setRotation((prev) => prev + 90);
        setActiveIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    return (
        <section className={styles.heroContainer}>
            <div className={styles.heroContent}>
                <div className={styles.leftCol}>
                    <div className={styles.badge}>Hệ thống học tập nội bộ</div>
                    <Title level={1} className={styles.mainTitle}>
                        Nâng cao kỹ năng — <br />Phát triển sự nghiệp
                    </Title>
                    <Text className={styles.description}>
                        RitaVo eLearning cung cấp nền tảng học tập hiện đại, giúp cán bộ nhân viên <br />
                        nâng cao năng lực chuyên môn và thăng tiến trong công việc.
                    </Text>
                    
                    <div className={styles.ctaGroup}>
                        <Button type="primary" size="large" className={styles.primaryBtn}>
                            Bắt đầu học ngay
                        </Button>
                        <Button size="large" className={styles.secondaryBtn}>
                            Khám phá khóa học
                        </Button>
                    </div>

                    <div className={styles.statsGroup}>
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>150+</div>
                            <div className={styles.statLabel}>Khóa học</div>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>1,200+</div>
                            <div className={styles.statLabel}>Học viên</div>
                        </div>
                        <div className={styles.statDivider} />
                        <div className={styles.statItem}>
                            <div className={styles.statValue}>5,000+</div>
                            <div className={styles.statLabel}>Giờ học</div>
                        </div>
                    </div>
                </div>

                <div className={styles.rightCol}>
                    <div className={styles.carouselWrapper}>
                        <div 
                            className={styles.scene}
                            onMouseDown={handleDragStart}
                            onTouchStart={handleDragStart}
                        >
                            <div 
                                className={styles.carousel}
                                style={{ 
                                    transform: `rotateY(${rotation}deg)`,
                                    transition: isDragging ? 'none' : 'transform 0.9s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: isDragging ? 'grabbing' : 'grab'
                                }}
                            >
                                {banners.map((item, idx) => (
                                    <div 
                                        key={item.id} 
                                        className={styles.carouselCell}
                                        style={{ 
                                            background: item.color_code || '#C8102E',
                                            transform: `rotateY(${idx * 90}deg) translateZ(180px)`
                                        }}
                                    >
                                        {item.image_url ? (
                                            <div className={styles.imageCard}>
                                                <img 
                                                    src={item.image_url} 
                                                    alt={item.title} 
                                                    className={styles.fullImage} 
                                                    draggable={false}
                                                />
                                                {/* Optional: Overlay title/stat if desired, but user asked for "only image" */}
                                            </div>
                                        ) : (
                                            <div className={styles.cardContent}>
                                                <div className={styles.cardIcon}>{ICONS[idx % ICONS.length]}</div>
                                                <Title level={3} className={styles.cardTitle}>{item.title}</Title>
                                                <Text className={styles.cardDesc}>{item.description}</Text>
                                                <div className={styles.cardStat}>{item.stat_value}</div>
                                                <div className={styles.cardBadge}>Mới</div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className={styles.carouselNav}>
                            <button onClick={prevSlide} className={styles.navBtn} aria-label="Previous"><LeftOutlined /></button>
                            <div className={styles.indicators}>
                                {banners.map((_, idx) => (
                                    <span 
                                        key={idx} 
                                        className={`${styles.dot} ${activeIndex === idx ? styles.activeDot : ''}`}
                                        onClick={() => setActiveIndex(idx)}
                                    />
                                ))}
                            </div>
                            <button onClick={nextSlide} className={styles.navBtn} aria-label="Next"><RightOutlined /></button>
                        </div>
                    </div>
                    
                    <div className={styles.backgroundDecoration}>
                        <div className={styles.blob1} />
                        <div className={styles.blob2} />
                    </div>
                </div>
            </div>
        </section>
    );
}
