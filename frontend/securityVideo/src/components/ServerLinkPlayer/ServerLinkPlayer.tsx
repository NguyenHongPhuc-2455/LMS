import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { contentService } from '../../services/content.service';
import styles from './ServerLinkPlayer.module.scss';

interface ServerLinkPlayerProps {
    src: string;
    lessonId?: number;
    antiSeek?: boolean;
    onEnded?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    isCompleted?: boolean;
}

export interface ServerLinkPlayerRef {
    reset: () => void;
}

const ServerLinkPlayer = forwardRef<ServerLinkPlayerRef, ServerLinkPlayerProps>(
    ({ src, lessonId, antiSeek = true, isCompleted = false, onEnded, onPlay, onPause }, ref) => {

        const containerRef = useRef<HTMLDivElement>(null);
        const playerRef = useRef<any>(null);
        const hasTriggeredEndRef = useRef(false);
        const progressIntervalRef = useRef<any>(null);
        const maxWatchedTimeRef = useRef<number>(0);
        const isSeekingRef = useRef<boolean>(false);
        const isCompletedRef = useRef(isCompleted);

        useEffect(() => {
            isCompletedRef.current = isCompleted;
        }, [isCompleted]);

        const [videoSrc, setVideoSrc] = useState<string | null>(null);
        const [loadError, setLoadError] = useState(false);

        const callbacksRef = useRef({ onEnded, onPlay, onPause });
        const stateRef = useRef({ lessonId });

        useEffect(() => {
            callbacksRef.current = { onEnded, onPlay, onPause };
            stateRef.current = { lessonId };
        }, [onEnded, onPlay, onPause, lessonId]);

        useImperativeHandle(ref, () => ({
            reset: () => {
                if (playerRef.current) {
                    isSeekingRef.current = true;
                    playerRef.current.currentTime(0);
                    maxWatchedTimeRef.current = 0;
                    playerRef.current.play().catch(() => { });
                    setTimeout(() => { isSeekingRef.current = false; }, 500);
                }
            }
        }));

        // ─────────────────────────────────────────────
        // Effect 1: Chuẩn bị đường dẫn video (Xử lý Refresh Token sau này nếu cần)
        // ─────────────────────────────────────────────
        useEffect(() => {
            if (!src) return;

            setLoadError(false);
            const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
            const absoluteSrc = src.startsWith('http') ? src : `${BASE_URL}${src}`;
            
            setVideoSrc(absoluteSrc);
        }, [src]);

        // ─────────────────────────────────────────────
        // Effect 2: Khởi tạo video.js
        // ─────────────────────────────────────────────
        useEffect(() => {
            if (!videoSrc || !containerRef.current) return;

            containerRef.current.innerHTML = '';
            hasTriggeredEndRef.current = false;

            const videoElement = document.createElement('video');
            videoElement.className = 'video-js vjs-default-skin vjs-big-play-centered';
            videoElement.oncontextmenu = (e) => e.preventDefault();
            containerRef.current.appendChild(videoElement);

            const player = videojs(videoElement, {
                autoplay: false,
                controls: true,
                responsive: true,
                fluid: true,
                playbackRates: [0.5, 1, 1.25, 1.5, 2],
                userActions: {
                    doubleClick: true,
                },
            }, () => {
                playerRef.current = player;
                
                // Nếu chưa hoàn thành và bật antiSeek thì mới khóa thanh tua
                if (antiSeek && !isCompleted) {
                    player.addClass('vjs-anti-seek');
                    player.on('keydown', (event: any) => {
                        if (event.which === 37 || event.which === 39) {
                            event.preventDefault();
                        }
                    });
                } else if (isCompleted) {
                    player.addClass('vjs-completed');
                }

                player.on('play', () => {
                    startProgressCheck();
                    callbacksRef.current.onPlay?.();
                });

                player.on('error', () => {
                    const error = player.error();
                    console.error('[SERVER PLAYER] Lỗi trình phát:', error);
                    setLoadError(true);
                });

                player.on('timeupdate', () => {
                    if (isCompletedRef.current || isSeekingRef.current) return;

                    const currentTime = player.currentTime();

                    // 1. LUÔN CẬP NHẬT TIẾN ĐỘ
                    if (!player.seeking()) {
                        if (antiSeek) {
                            if (currentTime > maxWatchedTimeRef.current && currentTime - maxWatchedTimeRef.current < 2) {
                                maxWatchedTimeRef.current = currentTime;
                            }
                        } else {
                            if (currentTime > maxWatchedTimeRef.current) {
                                maxWatchedTimeRef.current = currentTime;
                            }
                        }
                    }

                    // 2. CHỈ CHẶN TUA NẾU BẬT ANTI-SEEK
                    if (antiSeek && currentTime > maxWatchedTimeRef.current + 1.5) {
                        isSeekingRef.current = true;
                        player.currentTime(maxWatchedTimeRef.current);
                        setTimeout(() => { isSeekingRef.current = false; }, 100);
                    }
                });

                player.on('seeking', () => {
                    if (isCompletedRef.current || isSeekingRef.current) return;

                    const currentTime = player.currentTime();
                    if (antiSeek) {
                        if (currentTime > maxWatchedTimeRef.current + 1) {
                            isSeekingRef.current = true;
                            player.currentTime(maxWatchedTimeRef.current);
                            setTimeout(() => { isSeekingRef.current = false; }, 100);
                        }
                    } else {
                        if (currentTime > maxWatchedTimeRef.current) {
                            maxWatchedTimeRef.current = currentTime;
                        }
                    }
                });

                player.on('pause', () => {
                    stopProgressCheck();
                    callbacksRef.current.onPause?.();
                });

                player.on('ended', () => {
                    const duration = player.duration();
                    const watchedTime = maxWatchedTimeRef.current;

                    // Nếu đã hoàn thành bài học từ trước, chỉ cần dừng lại (Dùng Ref để lấy giá trị mới nhất)
                    if (isCompletedRef.current) {
                        player.pause();
                        return;
                    }

                    // CHỈ HOÀN THÀNH KHI XEM THẬT >= 95%
                    if (duration > 0 && watchedTime / duration >= 0.95) {
                        handleVideoComplete();
                    } else {
                        console.log('Video kết thúc nhưng chưa xem đủ 95% thật sự.');
                        player.currentTime(maxWatchedTimeRef.current);
                        player.play().catch(() => {});
                    }
                });
            });

            return () => {
                stopProgressCheck();
                if (player) player.dispose();
            };
        }, [videoSrc]);

        const startProgressCheck = () => {
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = setInterval(() => {
                if (playerRef.current && !isCompletedRef.current) {
                    const currentTime = playerRef.current.currentTime();
                    const duration = playerRef.current.duration();
                    const watchedTime = maxWatchedTimeRef.current;

                    if (duration > 0 && watchedTime / duration >= 0.95) {
                        handleVideoComplete();
                    }
                }
            }, 1000);
        };

        const stopProgressCheck = () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
                progressIntervalRef.current = null;
            }
        };

        const handleVideoComplete = async () => {
            // CHỐT CHẶN: Ngăn chặn vòng lặp gọi API nếu đã hoàn thành
            if (hasTriggeredEndRef.current || isCompletedRef.current) return;
            
            hasTriggeredEndRef.current = true;
            const player = playerRef.current;
            const duration = player ? player.duration() : 0;
            const watchedTime = maxWatchedTimeRef.current;

            if (duration > 0 && watchedTime / duration < 0.95) return;

            stopProgressCheck();
            if (player) player.pause();
            const currentLessonId = stateRef.current.lessonId;
            if (currentLessonId) {
                try { await contentService.completeLesson(currentLessonId); }
                catch (e) { console.error('Lỗi báo cáo tiến độ'); }
            }
            callbacksRef.current.onEnded?.();
        };

        if (loadError) {
            return (
                <div className={styles.serverLinkPlayerContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: '#fff', minHeight: 300, flexDirection: 'column', gap: 12 }}>
                    <span style={{ fontSize: 36 }}>⚠️</span>
                    <p>Không thể tải video. Token có thể đã hết hạn, vui lòng tải lại trang.</p>
                </div>
            );
        }

        if (!videoSrc) {
            return (
                <div className={styles.serverLinkPlayerContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f23', minHeight: 300 }}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            );
        }

        return (
            <div className={`${styles.serverLinkPlayerContainer} ${antiSeek ? styles.antiSeek : ''}`}>
                <div ref={containerRef} />
            </div>
        );
    }
);

export default ServerLinkPlayer;
