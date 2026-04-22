import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import { contentService } from '../../services/content.service';
import styles from './ServerLinkPlayer.module.scss';

interface ServerLinkPlayerProps {
    src: string;
    lessonId?: number;
    onEnded?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
}

export interface ServerLinkPlayerRef {
    reset: () => void;
}

const ServerLinkPlayer = forwardRef<ServerLinkPlayerRef, ServerLinkPlayerProps>(({ src, lessonId, onEnded, onPlay, onPause }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const hasTriggeredEndRef = useRef(false);
    const progressIntervalRef = useRef<any>(null);

    const callbacksRef = useRef({ onEnded, onPlay, onPause });
    const stateRef = useRef({ lessonId });

    useEffect(() => {
        callbacksRef.current = { onEnded, onPlay, onPause };
        stateRef.current = { lessonId };
    }, [onEnded, onPlay, onPause, lessonId]);

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (playerRef.current) {
                playerRef.current.currentTime(0);
                playerRef.current.play().catch(() => { });
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

            if (duration > 5 && currentTime > 5 && currentTime / duration >= 0.99) {
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
            sources: [{
                src: src,
                type: 'video/mp4'
            }]
        };

        const player = videojs(videoElement, videoJsOptions, () => {
            playerRef.current = player;

            player.on('play', () => {
                startProgressCheck();
                callbacksRef.current.onPlay?.();
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
        <div className={styles.serverLinkPlayerContainer}>
            <div ref={containerRef}></div>
        </div>
    );
});

export default ServerLinkPlayer;
