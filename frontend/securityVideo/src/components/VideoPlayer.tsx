import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import shaka from 'shaka-player';
import api from '../api';
import { message } from 'antd';
import './VideoPlayer.scss';

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

    // Cơ chế chống tua (Anti-Seek) ổn định
    const lastTimeRef = useRef(0);

    // Expose methods to parent
    useImperativeHandle(ref, () => ({
        reset: () => {
            if (videoRef.current) {
                videoRef.current.currentTime = 0;
                lastTimeRef.current = 0;
                videoRef.current.play().catch(() => { });
            }
        }
    }));

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        video.addEventListener('contextmenu', (e) => e.preventDefault());
        shaka.polyfill.installAll();

        const player = new shaka.Player();
        playerRef.current = player;
        player.attach(video);

        player.getNetworkingEngine()?.registerRequestFilter((type, request) => {
            const token = localStorage.getItem('token');
            if (token) {
                request.headers['Authorization'] = `Bearer ${token}`;
            }

            if (type === shaka.net.NetworkingEngine.RequestType.MANIFEST || request.uris[0].includes('/key/')) {
                request.uris[0] += (request.uris[0].includes('?') ? '&' : '?') + 't=' + Date.now();
            }

            request.allowCrossSiteCredentials = true;
        });

        return () => {
            if (player) player.destroy();
        };
    }, []);

    useEffect(() => {
        let isStillMounted = true;
        hasTriggeredEndRef.current = false;
        lastTimeRef.current = 0; // Reset khi đổi video

        const loadVideo = async () => {
            if (playerRef.current && src) {
                try {
                    await playerRef.current.load(src);
                    // if (isStillMounted && videoRef.current) {
                    //     videoRef.current.play().catch(e => console.warn('Autoplay blocked:', e));
                    // }
                } catch (e: any) {
                    if (isStillMounted && e.code !== shaka.util.Error.Code.LOAD_INTERRUPTED) {
                        console.error('❌ Shaka Player Error:', e);
                    }
                }
            }
        };

        loadVideo();
        return () => { isStillMounted = false; };
    }, [src]);

    const reportProgress = async () => {
        if (!lessonId) return;
        try {
            await api.post(`/videos/complete/${lessonId}`);
        } catch (e) {
            console.error('Lỗi báo cáo tiến độ');
        }
    };

    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (!video || hasTriggeredEndRef.current) return;

        // Logic chống tua siêu ổn định dùng Delta
        const delta = video.currentTime - lastTimeRef.current;

        // Nếu nhảy vọt hơn 1.2 giây (tua nhanh)
        if (delta > 1.2) {
            video.currentTime = lastTimeRef.current;
            message.warning({
                content: 'Vui lòng không tua nhanh video!',
                key: 'anti-seek',
                duration: 2
            });
        } else {
            // Xem bình thường hoặc tua lùi
            lastTimeRef.current = video.currentTime;
        }

        // Báo cáo hoàn thành khi đạt 95%
        if (video.duration > 0 && video.currentTime / video.duration >= 0.95) {
            hasTriggeredEndRef.current = true;
            reportProgress();
            if (onEnded) onEnded();
        }
    };

    return (
        <div className="video-player-container">
            <video
                ref={videoRef}
                controls
                crossOrigin="anonymous"
                controlsList="nodownload"
                className="video-element"
                onTimeUpdate={handleTimeUpdate}
                onPlay={onPlay}
                onPause={onPause}
                onEnded={() => {
                    if (!hasTriggeredEndRef.current) {
                        hasTriggeredEndRef.current = true;
                        reportProgress();
                        if (onEnded) onEnded();
                    }
                }}
            ></video>
        </div>
    );
});

export default VideoPlayer;
