import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube';
import { contentService } from '../../services/content.service';
import styles from './VideoJsPlayer.module.scss';

interface VideoJsPlayerProps {
    src: string;
    lessonId?: number;
    antiSeek?: boolean;
    onEnded?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    isCompleted?: boolean;
}

export interface VideoJsPlayerRef {
    reset: () => void;
}

const VideoJsPlayer = forwardRef<VideoJsPlayerRef, VideoJsPlayerProps>(({ src, lessonId, antiSeek = true, isCompleted = false, onEnded, onPlay, onPause }, ref) => {

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

        // Kiểm tra lại một lần nữa cho chắc chắn
        if (duration > 0 && watchedTime / duration < 0.95) {
            console.warn('Chưa xem đủ 95% thời lượng thật sự');
            return;
        }

        hasTriggeredEndRef.current = true;
        stopProgressCheck();

        // Tự động dừng video
        if (player) {
            player.pause();
        }

        const currentLessonId = stateRef.current.lessonId;
        if (currentLessonId) {
            try {
                await contentService.completeLesson(currentLessonId);
            } catch (e) {
                console.error('Lỗi báo cáo tiến độ');
            }
        }
        callbacksRef.current.onEnded?.();
    };

    useEffect(() => {
        if (!containerRef.current) return;

        containerRef.current.innerHTML = '';
        hasTriggeredEndRef.current = false;
        const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');

        const videoElement = document.createElement("video");
        videoElement.className = 'video-js vjs-default-skin vjs-big-play-centered';
        videoElement.oncontextmenu = (e) => e.preventDefault();
        containerRef.current.appendChild(videoElement);

        const videoJsOptions: any = {
            autoplay: true,
            controls: true,
            responsive: true,
            fluid: true,
            aspectRatio: '16:9',
            techOrder: isYouTube ? ['youtube', 'html5'] : ['html5'],
            sources: [{
                src: src,
                type: isYouTube ? 'video/youtube' : 'video/mp4'
            }],
            youtube: isYouTube ? {
                iv_load_policy: 3,
                modestbranding: 1,
                rel: 0,
                autoplay: 1
            } : undefined,
            userActions: {
                doubleClick: true, // Cho phép double click (logic bên dưới sẽ xử lý nếu chưa xem đủ)
            }
        };

        const player = videojs(videoElement, videoJsOptions, () => {
            playerRef.current = player;

            // Nếu chưa hoàn thành và bật antiSeek thì mới khóa thanh tua
            if (antiSeek && !isCompleted) {
                player.addClass('vjs-anti-seek');
                // Chặn phím mũi tên để tua
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

            player.on('timeupdate', () => {
                if (!antiSeek || isCompletedRef.current || isSeekingRef.current) return;

                const currentTime = player.currentTime();

                // CẬP NHẬT MỐC XEM (Chỉ khi xem bình thường)
                if (!player.seeking() && currentTime > maxWatchedTimeRef.current) {
                    if (currentTime - maxWatchedTimeRef.current < 2) {
                        maxWatchedTimeRef.current = currentTime;
                    }
                }

                // GIẬT LẠI NGAY LẬP TỨC NẾU VƯỢT MỐC (Buffer 1s cho an toàn)
                if (currentTime > maxWatchedTimeRef.current + 1.5) {
                    isSeekingRef.current = true;
                    player.currentTime(maxWatchedTimeRef.current);
                    setTimeout(() => { isSeekingRef.current = false; }, 100);
                }
            });

            player.on('seeking', () => {
                if (!antiSeek || isCompleted || isSeekingRef.current) return;

                const currentTime = player.currentTime();
                
                // Nếu tua tới vượt quá mốc đã xem
                if (currentTime > maxWatchedTimeRef.current + 1) {
                    isSeekingRef.current = true;
                    player.currentTime(maxWatchedTimeRef.current);
                    setTimeout(() => { isSeekingRef.current = false; }, 100);
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
                    console.log('Video kết thúc nhưng chưa xem đủ 95% thật sự. Không tính hoàn thành.');
                    player.currentTime(maxWatchedTimeRef.current);
                    player.play().catch(() => {});
                }
            });
        });

        return () => {
            stopProgressCheck();
            if (player) {
                player.dispose();
            }
            if (videoElement) {
                videoElement.pause();
                videoElement.src = '';
                videoElement.load();
            }
        };
    }, [src]);

    return (
        <div className={styles.videoJsPlayerContainer}>
            <div ref={containerRef}></div>
        </div>
    );
});

export default VideoJsPlayer;
