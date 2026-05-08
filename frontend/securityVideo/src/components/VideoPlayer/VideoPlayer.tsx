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
    const lastLessonIdRef = useRef<number | null>(null);

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
            if (isCompletedRef.current || isSeekingRef.current) return;

            const video = videoRef.current;
            if (!video) return;

            const currentTime = video.currentTime;

            // 1. LUÔN CẬP NHẬT TIẾN ĐỘ (Để tính hoàn thành bài học)
            if (!video.seeking) {
                if (antiSeek) {
                    // Nếu bật chống tua: Chỉ tăng tiến độ nếu xem bình thường (< 2s jump)
                    if (currentTime > maxWatchedTimeRef.current && currentTime - maxWatchedTimeRef.current < 2) {
                        maxWatchedTimeRef.current = currentTime;
                    }
                } else {
                    // Nếu tắt chống tua: Tiến độ luôn đi theo currentTime (cho phép tua)
                    if (currentTime > maxWatchedTimeRef.current) {
                        maxWatchedTimeRef.current = currentTime;
                    }
                }
            }

            // 2. CHỈ CHẶN TUA NẾU BẬT ANTI-SEEK
            if (antiSeek && currentTime > maxWatchedTimeRef.current + 1.5) {
                isSeekingRef.current = true;
                video.pause();
                video.currentTime = maxWatchedTimeRef.current;
                setTimeout(() => {
                    isSeekingRef.current = false;
                    video.play().catch(() => {});
                }, 1000);
            }
        };

        const handleSeeking = () => {
            if (isCompletedRef.current || isSeekingRef.current) return;

            const video = videoRef.current;
            if (!video) return;

            const currentTime = video.currentTime;

            if (antiSeek) {
                // Nếu bật chống tua: Không cho phép tua vượt quá mốc đã xem
                if (currentTime > maxWatchedTimeRef.current + 1) {
                    isSeekingRef.current = true;
                    video.pause();
                    video.currentTime = maxWatchedTimeRef.current;
                    setTimeout(() => {
                        isSeekingRef.current = false;
                        video.play().catch(() => {});
                    }, 1000);
                }
            } else {
                // Nếu tắt chống tua: Cập nhật luôn mốc xem mới nhất khi tua xong
                if (currentTime > maxWatchedTimeRef.current) {
                    maxWatchedTimeRef.current = currentTime;
                }
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
                        // CHỈ TỰ ĐỘNG PHÁT NẾU:
                        // 1. Chuyển sang một bài học khác (lastLessonId khác lessonId)
                        // 2. HOẶC bài học này chưa hoàn thành
                        // (Tránh tự phát lại khi hệ thống làm mới token sau khi vừa báo cáo hoàn thành cùng 1 bài)
                        const isNewLesson = lastLessonIdRef.current !== lessonId;
                        if (isNewLesson || !isCompleted) {
                            videoRef.current.play().catch(() => { });
                        } else {
                            console.log('Video đã hoàn thành, không tự động phát lại khi làm mới dữ liệu.');
                            videoRef.current.pause();
                        }
                    }
                    lastLessonIdRef.current = lessonId || null;
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
                        console.warn('Video ended but not enough watch time. Staying at last watched position.');
                        video.pause();
                        video.currentTime = maxWatchedTimeRef.current;
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
