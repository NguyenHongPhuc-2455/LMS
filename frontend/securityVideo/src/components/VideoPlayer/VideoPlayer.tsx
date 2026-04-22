import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import shaka from 'shaka-player';
import { contentService } from '../../services/content.service';
import styles from './VideoPlayer.module.scss';

interface VideoPlayerProps {
    src: string;
    lessonId?: number;
    onEnded?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
}

export interface VideoPlayerRef {
    reset: () => void;
}

const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ src, lessonId, onEnded, onPlay, onPause }, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const playerRef = useRef<shaka.Player | null>(null);
    const hasTriggeredEndRef = useRef(false);
    const progressIntervalRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(() => { });
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
            if (duration > 5 && currentTime > 5 && currentTime / duration >= 0.99) {
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
        shaka.polyfill.installAll();

        const player = new shaka.Player();
        playerRef.current = player;
        player.attach(video);

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
                        console.error('❌ Shaka Error:', e);
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
