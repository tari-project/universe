import { useEffect, useRef } from 'react';
import Hls from 'hls.js';
import { URL_BLOCK, URL_BLOCK_SOLVED } from '@app/App/AppWrapper.tsx';

interface HLSPlayerProps {
    src: string;
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    playsInline?: boolean;
}

function HLSPlayer({ src, autoPlay = true, muted = true, loop = true, playsInline = true }: HLSPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        let hls: Hls | null = null;

        if (Hls.isSupported()) {
            hls = new Hls();
            hls.loadSource(src);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (autoPlay) {
                    videoElement.play().catch((error) => {
                        console.error('Failed to autoplay video:', error);
                    });
                }
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = src;
            if (autoPlay) {
                videoElement.play().catch((error) => {
                    console.error('Failed to autoplay video:', error);
                });
            }
        }

        return () => {
            if (hls) {
                hls.destroy();
            }
        };
    }, [src, autoPlay]);

    return <video ref={videoRef} muted={muted} autoPlay={autoPlay} loop={loop} playsInline={playsInline} />;
}

export default function BlockVideo({ isSolved }: { isSolved?: boolean }) {
    if (isSolved) {
        return <HLSPlayer src={URL_BLOCK_SOLVED} autoPlay={true} loop={false} />;
    } else {
        return <HLSPlayer src={URL_BLOCK} autoPlay={true} loop={true} />;
    }
}
