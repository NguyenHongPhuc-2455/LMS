import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import shaka from 'shaka-player';
import { contentService } from '../../services/content.service';
import styles from './VideoPlayer.module.scss';

interface VideoPlayerProps {
    src: string;
    lessonId?: number;
    antiSeek?: boolean;
    onEnded?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    onError?: (error?: any) => void;
    isCompleted?: boolean;
}

export interface VideoPlayerRef {
    reset: () => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ src, lessonId, antiSeek = true, isCompleted = false, onEnded, onPlay, onPause, onError }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<shaka.Player | null>(null);
    const hasTriggeredEndRef = useRef(false);
    const progressIntervalRef = useRef<any>(null);
    const maxWatchedTimeRef = useRef<number>(0);
    const isSeekingRef = useRef<boolean>(false);
    const isCompletedRef = useRef(isCompleted);

    useEffect(() => {
        isCompletedRef.current = isCompleted;
    }, [isCompleted]);

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (videoRef.current) {
                isSeekingRef.current = true; // Tránh check anti-seek khi reset
                videoRef.current.currentTime = 0;
                maxWatchedTimeRef.current = 0;
                videoRef.current.play().catch(() => { });
                setTimeout(() => { isSeekingRef.current = false; }, 500);
            }
        }
    }));

    // Hàm kiểm tra tiến độ chủ động
    const startProgressCheck = () => {
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = setInterval(() => {
            if (videoRef.current && !isCompletedRef.current) {
                const currentTime = videoRef.current.currentTime;
                const duration = videoRef.current.duration;
                const watchedTime = maxWatchedTimeRef.current;

                if (duration > 0 && watchedTime / duration >= 0.95) {
                    handleComplete();
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

    const handleComplete = async () => {
        // CHỐT CHẶN: Nếu đã hoàn thành hoặc đang xử lý dở thì DỪNG NGAY.
        if (hasTriggeredEndRef.current || !lessonId || isCompletedRef.current) return;
        
        const video = videoRef.current;
        const duration = video ? video.duration : 0;
        const watchedTime = maxWatchedTimeRef.current;

        // RULE: Chỉ hoàn thành khi xem thực đạt 95%
        if (duration > 0 && watchedTime / duration < 0.95) return;

        hasTriggeredEndRef.current = true;
        stopProgressCheck();

        if (video) video.pause();

        try {
            await contentService.completeLesson(lessonId);
            if (onEnded) onEnded();
        } catch (e) {
            console.error('Lỗi báo cáo tiến độ');
        }
    };

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.addEventListener('contextmenu', (e) => e.preventDefault());

        // Chặn phím tắt để tua (Mũi tên trái/phải)
        const handleKeyDown = (e: KeyboardEvent) => {
            if (antiSeek && !isCompleted && (e.keyCode === 37 || e.keyCode === 39)) {
                e.preventDefault();
                return false;
            }
        };
        video.addEventListener('keydown', handleKeyDown);

        // --- CHỐNG TUA VIDEO (ANTI-SEEK) ---
        const handleTimeUpdate = () => {
            if (!antiSeek || isCompletedRef.current || isSeekingRef.current) return;

            const currentTime = video.currentTime;

            // 1. CẬP NHẬT MAX WATCHED TIME
            if (!video.seeking && currentTime > maxWatchedTimeRef.current) {
                if (currentTime - maxWatchedTimeRef.current < 2) {
                    maxWatchedTimeRef.current = currentTime;
                }
            }

            // 2. GIẬT LẠI (PULL BACK) - Áp dụng cơ chế Hard Lock
            if (currentTime > maxWatchedTimeRef.current + 1.5) {
                isSeekingRef.current = true;
                
                // Tạm dừng ngay lập tức để trình duyệt ngừng gửi request segment mới
                video.pause();
                
                // Giật về mốc cũ
                video.currentTime = maxWatchedTimeRef.current;
                
                // Đợi 1s để Shaka ổn định lại toàn bộ trạng thái buffer trước khi cho phép tiếp tục
                setTimeout(() => {
                    isSeekingRef.current = false;
                    video.play().catch(() => {});
                }, 1000);
            }
        };

        const handleSeeking = () => {
            if (!antiSeek || isCompletedRef.current || isSeekingRef.current) return;

            const currentTime = video.currentTime;
            if (currentTime > maxWatchedTimeRef.current + 0.5) {
                isSeekingRef.current = true;
                video.pause(); // Stop requests immediately
                video.currentTime = maxWatchedTimeRef.current;
                
                setTimeout(() => {
                    isSeekingRef.current = false;
                    video.play().catch(() => {});
                }, 1000);
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('seeking', handleSeeking);

        shaka.polyfill.installAll();

        const player = new shaka.Player();
        playerRef.current = player;
        
        // Cấu hình Shaka để mượt mà hơn khi network không ổn định
        player.configure({
            streaming: {
                bufferingGoal: 30, // Tăng buffer lên 30s để xem mượt hơn
                rebufferingGoal: 2,
                bufferBehind: 30,
                retryParameters: {
                    maxAttempts: 3,
                    baseDelay: 1000,
                    backoffFactor: 2,
                }
            },
            manifest: {
                retryParameters: {
                    maxAttempts: 3,
                }
            }
        });

        player.attach(video);

        // Lắng nghe lỗi từ Shaka (đạc biệt lỗi 403 do sai IP)
        player.addEventListener('error', (event: any) => {
            const e = event.detail;
            console.error('❌ Shaka Event Error:', e);
            if (e.code === shaka.util.Error.Code.BAD_HTTP_STATUS) {
                if (onError) onError(e);
            }
        });

        player.getNetworkingEngine()?.registerRequestFilter((type, request) => {
            const uri = request.uris[0];
            const backendUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
            const isInternal = uri.startsWith(backendUrl) || uri.startsWith('http://localhost:5000') || uri.startsWith('/');

            if (isInternal) {
                const token = localStorage.getItem('accessToken');
                if (token) request.headers['Authorization'] = `Bearer ${token}`;
                request.allowCrossSiteCredentials = true;
            }

            if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST || uri.includes('/key/')) {
                request.uris[0] += (uri.includes('?') ? '&' : '?') + 't=' + Date.now();
            }
        });

        return () => {
            video.removeEventListener('keydown', handleKeyDown);
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('seeking', handleSeeking);
            stopProgressCheck();
            if (player) player.destroy();
            if (video) {
                video.pause();
                video.src = '';
                video.load();
            }
        };
    }, []);

    useEffect(() => {
        let isStillMounted = true;
        hasTriggeredEndRef.current = false;

        const loadVideo = async () => {
            if (playerRef.current && src) {
                try {
                    await playerRef.current.load(src);
                    if (isStillMounted && videoRef.current) {
                        videoRef.current.play().catch(() => { });
                    }
                } catch (e: any) {
                    if (isStillMounted && e.code !== shaka.util.Error.Code.LOAD_INTERRUPTED) {
                        console.error('❌ Shaka Error on load:', e);
                        if (e.code === shaka.util.Error.Code.BAD_HTTP_STATUS) {
                            if (onError) onError(e);
                        }
                    }
                }
            }
        };

        loadVideo();
        return () => { isStillMounted = false; };
    }, [src]);

    return (
        <div className={`${styles.videoPlayerContainer} ${antiSeek && !isCompleted ? 'anti-seek-native' : isCompleted ? 'completed-native' : ''}`}>
            <video
                ref={videoRef}
                controls
                crossOrigin="anonymous"
                controlsList="nodownload"
                className={styles.videoElement}
                onPlay={() => {
                    startProgressCheck();
                    onPlay?.();
                }}
                onPause={() => {
                    stopProgressCheck();
                    onPause?.();
                }}
                onEnded={() => {
                    const video = videoRef.current;
                    const duration = video ? video.duration : 0;
                    const watchedTime = maxWatchedTimeRef.current;

                    // Sử dụng Ref để đảm bảo đọc được giá trị mới nhất của isCompleted
                    if (isCompletedRef.current && video) {
                        video.pause();
                        return;
                    }

                    if (duration > 0 && watchedTime / duration >= 0.95) {
                        handleComplete();
                    } else if (video) {
                        console.warn('Video ended but not enough watch time.');
                        video.currentTime = maxWatchedTimeRef.current;
                        video.play().catch(() => {});
                    }
                }}
            ></video>
            
            {/* LỚP MÀNG BẢO VỆ: Chặn đứng mọi tương tác click/kéo lên vùng thanh tua */}
            {antiSeek && !isCompleted && (
                <div 
                    className={styles.videoOverlayMask}
                    onContextMenu={(e) => e.preventDefault()}
                    onDoubleClick={(e) => e.preventDefault()}
                />
            )}
        </div>
    );
});

export default VideoPlayer;
