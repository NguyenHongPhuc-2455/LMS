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
}

export interface ServerLinkPlayerRef {
    reset: () => void;
}

const ServerLinkPlayer = forwardRef<ServerLinkPlayerRef, ServerLinkPlayerProps>(
    ({ src, lessonId, antiSeek = true, onEnded, onPlay, onPause }, ref) => {

        const containerRef = useRef<HTMLDivElement>(null);
        const playerRef = useRef<any>(null);
        const hasTriggeredEndRef = useRef(false);
        const progressIntervalRef = useRef<any>(null);
        const maxWatchedTimeRef = useRef<number>(0);
        const isSeekingRef = useRef<boolean>(false);
        const blobUrlRef = useRef<string | null>(null);

        const [downloadProgress, setDownloadProgress] = useState(0);
        const [blobSrc, setBlobSrc] = useState<string | null>(null);
        const [fetchError, setFetchError] = useState(false);

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
        // Effect 1: Tải video về dạng Blob khi src thay đổi
        // ─────────────────────────────────────────────
        useEffect(() => {
            if (!src) return;

            // Reset states
            setBlobSrc(null);
            setDownloadProgress(0);
            setFetchError(false);
            maxWatchedTimeRef.current = 0; // Chỉ reset tiến độ khi đổi hẳn bài học (src)

            // Nếu không phải secure-stream → play trực tiếp (fallback)
            if (!src.includes('secure-stream')) {
                setBlobSrc(src);
                return;
            }

            let isCancelled = false;

            const fetchAsBlob = async () => {
                try {
                    const token = localStorage.getItem('accessToken');
                    const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
                    const absoluteSrc = src.startsWith('http') ? src : `${BASE_URL}${src}`;

                    console.log('[BLOB PLAYER] Đang tải video về Blob...');

                    const response = await fetch(absoluteSrc, {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (!response.ok) throw new Error(`HTTP ${response.status}`);

                    const contentLength = parseInt(response.headers.get('content-length') || '0');
                    const reader = response.body!.getReader();
                    const chunks: any[] = [];
                    let receivedBytes = 0;

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done || isCancelled) break;
                        chunks.push(value);
                        receivedBytes += value.length;

                        if (contentLength > 0) {
                            setDownloadProgress(Math.round((receivedBytes / contentLength) * 100));
                        } else {
                            setDownloadProgress(prev => Math.min(prev + 2, 95));
                        }
                    }

                    if (isCancelled) return;

                    const blob = new Blob(chunks, { type: response.headers.get('content-type') || 'video/mp4' });
                    const objectUrl = URL.createObjectURL(blob);

                    // Giải phóng blob cũ trước khi gán cái mới
                    if (blobUrlRef.current) {
                        URL.revokeObjectURL(blobUrlRef.current);
                    }

                    blobUrlRef.current = objectUrl;
                    setDownloadProgress(100);
                    setBlobSrc(objectUrl);
                    console.log(`[BLOB PLAYER] Video sẵn sàng (${blob.size} bytes)`);

                } catch (err: any) {
                    if (!isCancelled) {
                        console.error('[BLOB PLAYER] Tải video thất bại:', err.message);
                        setFetchError(true);
                    }
                }
            };

            fetchAsBlob();

            return () => {
                isCancelled = true;
                // Lưu ý: Không revoke ở đây vì Effect 2 vẫn cần dùng URL này để render Player.
                // Việc revoke sẽ được xử lý khi unmount toàn bộ hoặc đổi src ở trên.
            };
        }, [src]);

        // ─────────────────────────────────────────────
        // Effect 2: Khởi tạo video.js khi Blob đã sẵn sàng
        // ─────────────────────────────────────────────
        useEffect(() => {
            if (!blobSrc || !containerRef.current) return;

            containerRef.current.innerHTML = '';
            hasTriggeredEndRef.current = false;
            // Không reset maxWatchedTime ở đây để tránh mất tiến độ khi load blob

            const videoElement = document.createElement('video');
            videoElement.className = 'video-js vjs-default-skin vjs-big-play-centered';
            videoElement.oncontextmenu = (e) => e.preventDefault();
            containerRef.current.appendChild(videoElement);

            const player = videojs(videoElement, {
                autoplay: true,
                controls: true,
                responsive: true,
                fluid: true,
                aspectRatio: '16:9',
                sources: [{ src: blobSrc, type: 'video/mp4' }]
            }, () => {
                playerRef.current = player;

                player.on('play', () => {
                    startProgressCheck();
                    callbacksRef.current.onPlay?.();
                });

                player.on('timeupdate', () => {
                    if (!antiSeek || isSeekingRef.current) return;
                    const currentTime = player.currentTime();
                    if (!player.seeking() && currentTime > maxWatchedTimeRef.current) {
                        if (currentTime - maxWatchedTimeRef.current < 2) {
                            maxWatchedTimeRef.current = currentTime;
                        }
                    }
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
                    if (currentTime > maxWatchedTimeRef.current + 2) {
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
                if (player) player.dispose();
                if (videoElement) {
                    videoElement.pause();
                    videoElement.src = '';
                    videoElement.load();
                }
                // Giải phóng Blob URL khi unmount hoàn toàn component
                if (blobUrlRef.current) {
                    URL.revokeObjectURL(blobUrlRef.current);
                    blobUrlRef.current = null;
                    console.log('[BLOB PLAYER] Đã giải phóng tài nguyên.');
                }
            };
        }, [blobSrc]);

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
            if (playerRef.current) playerRef.current.pause();
            const currentLessonId = stateRef.current.lessonId;
            if (currentLessonId) {
                try { await contentService.completeLesson(currentLessonId); }
                catch (e) { console.error('Lỗi báo cáo tiến độ'); }
            }
            callbacksRef.current.onEnded?.();
        };

        // ─────────────────────────────────────────────
        // UI: Loading / Error / Player
        // ─────────────────────────────────────────────
        if (fetchError) {
            return (
                <div className={styles.serverLinkPlayerContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1a1a2e', color: '#fff', minHeight: 300, flexDirection: 'column', gap: 12 }}>
                    <span style={{ fontSize: 36 }}>⚠️</span>
                    <p>Không thể tải video. Vui lòng tải lại trang.</p>
                </div>
            );
        }

        if (!blobSrc) {
            return (
                <div className={styles.serverLinkPlayerContainer} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f0f23', minHeight: 300, flexDirection: 'column', gap: 16 }}>
                    <div style={{ color: '#a78bfa', fontSize: 14, fontWeight: 600, letterSpacing: 1 }}>
                        🔒 Đang tải video.
                    </div>
                    {/* Progress bar */}
                    <div style={{ width: '60%', background: '#2d2d4e', borderRadius: 8, overflow: 'hidden', height: 8 }}>
                        <div style={{
                            width: `${downloadProgress}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #7c3aed, #a78bfa)',
                            borderRadius: 8,
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 12 }}>
                        {downloadProgress > 0 ? `${downloadProgress}%` : 'Đang kết nối...'}
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
