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
}

export interface VideoJsPlayerRef {
    reset: () => void;
}

const VideoJsPlayer = forwardRef<VideoJsPlayerRef, VideoJsPlayerProps>(({ src, lessonId, antiSeek = true, onEnded, onPlay, onPause }, ref) => {

    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const hasTriggeredEndRef = useRef(false);
    const progressIntervalRef = useRef<any>(null);
    const maxWatchedTimeRef = useRef<number>(0);
    const isSeekingRef = useRef<boolean>(false);

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
        stopProgressCheck();
        progressIntervalRef.current = setInterval(() => {
            const player = playerRef.current;
            if (!player || player.paused() || hasTriggeredEndRef.current) return;

            const currentTime = player.currentTime();
            const duration = player.duration();

            if (duration > 5 && currentTime > 5 && currentTime / duration >= 0.95) {
                handleVideoComplete();
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
        if (hasTriggeredEndRef.current) return;
        hasTriggeredEndRef.current = true;
        stopProgressCheck();

        // Tự động dừng video
        if (playerRef.current) {
            playerRef.current.pause();
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
            } : undefined
        };

        const player = videojs(videoElement, videoJsOptions, () => {
            playerRef.current = player;

            player.on('play', () => {
                startProgressCheck();
                callbacksRef.current.onPlay?.();
            });

            player.on('timeupdate', () => {
                if (!antiSeek || isSeekingRef.current) return;

                const currentTime = player.currentTime();

                // Cập nhật mốc thời gian nếu người dùng xem bình thường
                if (!player.seeking() && currentTime > maxWatchedTimeRef.current) {
                    if (currentTime - maxWatchedTimeRef.current < 2) {
                        maxWatchedTimeRef.current = currentTime;
                    }
                }

                // Fallback: Nếu vị trí hiện tại nhô lên quá cao (kể cả do click)
                if (currentTime > maxWatchedTimeRef.current + 2) {
                    isSeekingRef.current = true;
                    player.currentTime(maxWatchedTimeRef.current);
                    player.play().catch(() => { });
                    setTimeout(() => { isSeekingRef.current = false; }, 100);
                }
            });

            player.on('seeking', () => {
                if (!antiSeek || isSeekingRef.current) return;

                const currentTime = player.currentTime();
                const buff = 2; // Cho phép tua sai số 2 giây

                if (currentTime > maxWatchedTimeRef.current + buff) {
                    isSeekingRef.current = true;
                    player.currentTime(maxWatchedTimeRef.current);
                    setTimeout(() => { isSeekingRef.current = false; }, 100);
                }
            });

            player.on('pause', () => {
                stopProgressCheck();
                callbacksRef.current.onPause?.();
            });

            player.on('ended', () => handleVideoComplete());
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
