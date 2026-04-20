import { useEffect, useRef, useImperativeHandle, forwardRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import 'videojs-youtube';
import { contentService } from '../../services/content.service';
import styles from './VideoJsPlayer.module.scss';


interface VideoJsPlayerProps {
    src: string;
    lessonId?: number;
    onEnded?: () => void;
    onPlay?: () => void;
    onPause?: () => void;
    isCompletedInit?: boolean;
}

export interface VideoJsPlayerRef {
    reset: () => void;
}

const VideoJsPlayer = forwardRef<VideoJsPlayerRef, VideoJsPlayerProps>(({ src, lessonId, onEnded, onPlay, onPause, isCompletedInit }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const playerRef = useRef<any>(null);
    const hasTriggeredEndRef = useRef(false);
    const [isUnlocked, setIsUnlocked] = useState(isCompletedInit || false);

    const callbacksRef = useRef({ onEnded, onPlay, onPause });
    const stateRef = useRef({ lessonId });
    const previousSrcRef = useRef(src);

    useEffect(() => {
        callbacksRef.current = { onEnded, onPlay, onPause };
    }, [onEnded, onPlay, onPause]);

    useEffect(() => {
        stateRef.current = { lessonId };
    }, [lessonId]);

    useEffect(() => {
        const flag = isCompletedInit || false;
        setIsUnlocked(flag);
    }, [src, isCompletedInit]);

    const updateControlsVisibility = (unlocked: boolean, player: any) => {
        if (!player || !player.controlBar) return;
        const controls = [
            player.controlBar.progressControl,
            player.controlBar.timeDivider,
            player.controlBar.currentTimeDisplay,
            player.controlBar.durationDisplay,
            player.controlBar.remainingTimeDisplay
        ];

        controls.forEach(ctrl => {
            if (ctrl) {
                if (unlocked) {
                    ctrl.show();
                } else {
                    ctrl.hide();
                }
            }
        });
    };

    useEffect(() => {
        if (playerRef.current) {
            updateControlsVisibility(isUnlocked, playerRef.current);
        }
    }, [isUnlocked]);

    useImperativeHandle(ref, () => ({
        reset: () => {
            if (playerRef.current) {
                playerRef.current.currentTime(0);
                playerRef.current.play().catch(() => { });
            }
        }
    }));

    useEffect(() => {
        if (!containerRef.current) return;

        hasTriggeredEndRef.current = false;

        const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');

        const videoElement = document.createElement("video");
        videoElement.classList.add('video-js', 'vjs-default-skin', 'vjs-big-play-centered');
        videoElement.setAttribute('controlsList', 'nodownload');
        videoElement.oncontextmenu = (e) => e.preventDefault();
        containerRef.current.appendChild(videoElement);

        const videoJsOptions: any = {
            controls: true,
            responsive: true,
            fluid: true,
            aspectRatio: '16:9',
            techOrder: ['youtube', 'html5'], // Cấu hình sẵn sàng cho cả 2 loại luồng
            sources: [{
                src: src,
                type: isYouTube ? 'video/youtube' : 'video/mp4'
            }],
            controlBar: {
                progressControl: {
                    seekBar: true // We must show it, but we will block forward seeking
                }
            }
        };

        const player = videojs(videoElement, videoJsOptions, () => {
            playerRef.current = player;
            updateControlsVisibility(isUnlocked, player);

            player.on('timeupdate', () => {
                if (hasTriggeredEndRef.current) return;

                try {
                    const currentTime = player.currentTime();
                    const duration = player.duration();
                    if (duration !== undefined && currentTime !== undefined && duration > 0 && currentTime / duration >= 0.95) {
                        handleVideoComplete();
                    }
                } catch (e) {
                    // CATCH: Bỏ qua lỗi ngẫu nhiên trong lúc Youtube Iframe chưa load
                }
            });

            player.on('ended', () => {
                handleVideoComplete();
            });

            player.on('play', () => {
                if (callbacksRef.current.onPlay) callbacksRef.current.onPlay();
            });

            player.on('pause', () => {
                if (callbacksRef.current.onPause) callbacksRef.current.onPause();
            });
        });

        const handleVideoComplete = async () => {
            if (hasTriggeredEndRef.current) return;
            hasTriggeredEndRef.current = true;
            setIsUnlocked(true);

            const currentLessonId = stateRef.current.lessonId;
            if (currentLessonId) {
                try {
                    await contentService.completeLesson(currentLessonId);
                } catch (e) {
                    console.error('Lỗi báo cáo tiến độ');
                }
            }
            if (callbacksRef.current.onEnded) callbacksRef.current.onEnded();
        };

        return () => {
            if (playerRef.current) {
                playerRef.current.dispose();
                playerRef.current = null;
            }
        };
    }, []); // Khởi tạo Player CHUẨN ĐÚNG 1 LẦN DUY NHẤT

    // Xử lý động cập nhật src mỗi khi chuyển bài giảng
    useEffect(() => {
        if (playerRef.current && previousSrcRef.current !== src) {
            const isYouTube = src.includes('youtube.com') || src.includes('youtu.be');
            playerRef.current.src({ src: src, type: isYouTube ? 'video/youtube' : 'video/mp4' });
            hasTriggeredEndRef.current = false;
            previousSrcRef.current = src;
        }
    }, [src, lessonId]);

    return (
        <div className={styles.videoJsPlayerContainer}>
            <div data-vjs-player ref={containerRef}></div>
        </div>
    );
});

export default VideoJsPlayer;


