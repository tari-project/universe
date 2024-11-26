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

            // Draw TV static
            const imageData = ctx.createImageData(canvas.width, canvas.height);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const noise = Math.random() * 255;
                data[i] = noise;
                data[i + 1] = noise;
                data[i + 2] = noise;
                data[i + 3] = 255 * 0.08;
            }
            ctx.putImageData(imageData, 0, 0);

            // Draw scanlines
            for (let y = scanlineOffset; y < canvas.height; y += 3) {
                // Increased space between scanlines
                ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
                ctx.fillRect(0, y, canvas.width, 1);
            }

            scanlineOffset = (scanlineOffset + 0.1) % 4; // Adjusted to match the new spacing

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
