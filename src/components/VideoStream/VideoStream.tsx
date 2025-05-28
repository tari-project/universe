import React, { useEffect, useRef, useState } from 'react';
import * as m from 'motion/react-m';
import Hls from 'hls.js';
import { PlayerContainer, VideoElement, PosterOverlay, PosterImage } from './styles.ts';

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
    const [isReady, setIsReady] = useState(false);

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
                setShowPoster(false);
                setIsReady(true);
                onLoadedData?.();

                video.play().catch((err) => {
                    console.debug('Autoplay failed:', err);
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
                setShowPoster(false);
                setIsReady(true);
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
        setShowPoster(false);
        onPlay?.();
    };

    const handlePause = () => {
        onPause?.();
    };

    return (
        <m.div
            initial={{ opacity: 1 }}
            animate={{ opacity: isReady ? 1 : 1 }}
            transition={{ duration: 0.5 }}
            className={className}
        >
            <PlayerContainer>
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
                />

                {showPoster && poster && (
                    <PosterOverlay>
                        <PosterImage src={poster} alt="Video poster" />
                    </PosterOverlay>
                )}
            </PlayerContainer>
        </m.div>
    );
};

export default VideoStream;
