import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

import { URL_BLOCK, URL_BLOCK_SOLVED } from '../../../BlockExplorerMini';

interface HLSPlayerProps {
    src: string;
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    playsInline?: boolean;
}

function HLSPlayer({ src, autoPlay = true, muted = true, loop = true, playsInline = true }: HLSPlayerProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const hlsRef = useRef<Hls | null>(null);

    useEffect(() => {
        const videoElement = videoRef.current;
        if (!videoElement) return;

        if (Hls.isSupported()) {
            const hls = new Hls();
            hlsRef.current = hls;
            hls.loadSource(src);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                if (autoPlay) {
                    videoElement.play().catch((error) => {
                        console.warn('Failed to autoplay video:', error);
                    });
                }
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = src;
            if (autoPlay) {
                videoElement.play().catch((error) => {
                    console.warn('Failed to autoplay video:', error);
                });
            }
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
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
