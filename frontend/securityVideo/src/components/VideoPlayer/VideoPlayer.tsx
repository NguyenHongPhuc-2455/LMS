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
}

export interface VideoPlayerRef {
    reset: () => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ src, lessonId, antiSeek = true, onEnded, onPlay, onPause, onError }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<shaka.Player | null>(null);
    const hasTriggeredEndRef = useRef(false);
    const progressIntervalRef = useRef<any>(null);
    const maxWatchedTimeRef = useRef<number>(0);
    const isSeekingRef = useRef<boolean>(false);

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
        stopProgressCheck();
        progressIntervalRef.current = setInterval(() => {
            const video = videoRef.current;
            if (!video || video.paused || hasTriggeredEndRef.current) return;

            const currentTime = video.currentTime;
            const duration = video.duration;

            // Chỉ xác nhận hoàn thành nếu:
            // 1. Duration hợp lệ (> 5s)
            // 2. Đã xem tối thiểu 5s (tránh lỗi nhảy bài ngay khi load)
            // 3. Đã xem trên 99% (gần như hết video)
            if (duration > 5 && currentTime > 5 && currentTime / duration >= 0.95) {
                handleComplete();
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
        if (hasTriggeredEndRef.current || !lessonId) return;
        hasTriggeredEndRef.current = true;
        stopProgressCheck();

        // Tự động dừng video khi hoàn thành
        if (videoRef.current) {
            videoRef.current.pause();
        }

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

        // --- CHỐNG TUA VIDEO (ANTI-SEEK) ---
        const handleTimeUpdate = () => {
            if (!antiSeek || isSeekingRef.current) return;

            // Cập nhật mốc thời gian nếu người dùng xem bình thường
            if (!video.seeking && video.currentTime > maxWatchedTimeRef.current) {
                // Chỉ cập nhật nếu khoảng cách tăng thêm nhỏ (< 2 giây) để chắc chắn không phải đang nhảy cóc
                if (video.currentTime - maxWatchedTimeRef.current < 2) {
                    maxWatchedTimeRef.current = video.currentTime;
                }
            }

            // Fallback: nếu bằng cách nào đó currentTime vượt quá maxWatchedTimeRef quá nhiều
            if (video.currentTime > maxWatchedTimeRef.current + 2) {
                isSeekingRef.current = true;
                video.currentTime = maxWatchedTimeRef.current;
                // Phát lại nếu đang bị dừng
                video.play().catch(() => { });
                setTimeout(() => { isSeekingRef.current = false; }, 100);
            }
        };

        const handleSeeking = () => {
            if (!antiSeek || isSeekingRef.current) return;

            if (video.currentTime > maxWatchedTimeRef.current + 2) {
                isSeekingRef.current = true;
                video.currentTime = maxWatchedTimeRef.current;
                setTimeout(() => { isSeekingRef.current = false; }, 100);
            }
        };

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('seeking', handleSeeking);

        shaka.polyfill.installAll();

        const player = new shaka.Player();
        playerRef.current = player;
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
            const isInternal = uri.startsWith('http://localhost:5000') || uri.startsWith('/');

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
        <div className={styles.videoPlayerContainer}>
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
                onEnded={handleComplete}
            ></video>
        </div>
    );
});

export default VideoPlayer;
