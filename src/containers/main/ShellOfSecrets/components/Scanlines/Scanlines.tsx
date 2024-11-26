import { useEffect, useRef } from 'react';
import { Canvas, Vignette } from './styles';

const Scanlines = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let scanlineOffset = 0;

        const drawScanlines = () => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
            for (let y = scanlineOffset; y < canvas.height; y += 4) {
                ctx.fillRect(0, y, canvas.width, 1);
            }

            scanlineOffset = (scanlineOffset + 0.1) % 4;

            animationFrameId = requestAnimationFrame(drawScanlines);
        };

        drawScanlines();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            <Canvas ref={canvasRef} style={{ mixBlendMode: 'screen' }} />
            <Vignette />
        </>
    );
};

export default Scanlines;
