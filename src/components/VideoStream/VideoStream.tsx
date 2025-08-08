import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { PlayerContainer, VideoElement, PosterOverlay, PosterImage } from './styles.ts';
import { AnimatePresence } from 'motion/react';

interface ErrorData {
    type: string;
    details: string;
    fatal: boolean;
}

interface VideoStreamProps {
    src: string;
    width?: number | string;
    height?: number | string;
    poster?: string;
    className?: string;
    onLoadStart?: () => void;
    onLoadedData?: () => void;
    onError?: (error: Event | ErrorData) => void;
    onPlay?: () => void;
    onPause?: () => void;
}

const VideoStream: React.FC<VideoStreamProps> = ({
    src,
    width = '100%',
    height = 'auto',
    poster,
    className = '',
    onLoadStart,
    onLoadedData,
    onError,
    onPlay,
    onPause,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);
    const [showPoster, setShowPoster] = useState(!!poster);

    useEffect(() => {
        const video = videoRef.current;
        if (!video || !src) return;

        if (Hls.isSupported()) {
            const hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
            });

            hlsRef.current = hls;

            hls.attachMedia(video);

            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                hls.loadSource(src);
                onLoadStart?.();
            });

            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                onLoadedData?.();

                video.play().catch((err) => {
                    console.warn('Autoplay failed:', err);
                });
            });

            hls.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS error:', data);
                onError?.(data);
            });

            hls.loadSource(src);
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = src;
            onLoadStart?.();

            video.addEventListener('loadeddata', () => {
                onLoadedData?.();
            });

            video.addEventListener('error', (e) => {
                onError?.(e);
            });
        } else {
            onError?.({
                type: 'HLS_NOT_SUPPORTED',
                details: 'HLS is not supported in this browser',
                fatal: true,
            });
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [src, onLoadStart, onLoadedData, onError, poster]);

    const handlePlay = () => {
        onPlay?.();
    };

    const handlePause = () => {
        onPause?.();
    };

    const handlePlaying = () => {
        setShowPoster(false);
    };

    return (
        <PlayerContainer className={className}>
            <VideoElement
                ref={videoRef}
                width={width}
                height={height}
                autoPlay={true}
                controls={false}
                muted={true}
                loop={true}
                poster={poster}
                playsInline={true}
                onPlay={handlePlay}
                onPause={handlePause}
                onPlaying={handlePlaying}
            />

            <AnimatePresence>
                {showPoster && poster && (
                    <PosterOverlay initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <PosterImage src={poster} alt="Video poster" />
                    </PosterOverlay>
                )}
            </AnimatePresence>
        </PlayerContainer>
    );
};

export default VideoStream;
