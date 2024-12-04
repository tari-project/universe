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

        const resizeCanvas = () => {
            if (!canvas) return;
            const parent = canvas.parentElement;
            if (!parent) return;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        };

        const drawScanlines = () => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw TV static with larger noise patterns
            const scale = 2;
            const imageData = ctx.createImageData(canvas.width / scale, canvas.height / scale);
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
                const noise = Math.random() * 255;
                data[i] = noise;
                data[i + 1] = noise;
                data[i + 2] = noise;
                data[i + 3] = 255 * 0.05;
            }

            // Scale up the noise
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width / scale;
            tempCanvas.height = canvas.height / scale;
            const tempCtx = tempCanvas.getContext('2d');
            if (tempCtx) {
                tempCtx.putImageData(imageData, 0, 0);
                ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
            }

            // Draw scanlines with adjusted spacing
            const scanlineSpacing = 7;
            const scanlineOpacity = 0.03;
            for (let y = 0; y < canvas.height; y += scanlineSpacing) {
                ctx.fillStyle = `rgba(255, 255, 255, ${scanlineOpacity})`;
                ctx.fillRect(0, y + scanlineOffset, canvas.width, 2);
            }

            scanlineOffset = (scanlineOffset + 0.5) % scanlineSpacing;

            animationFrameId = requestAnimationFrame(drawScanlines);
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        drawScanlines();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', resizeCanvas);
        };
    }, []);

    return (
        <>
            <Canvas ref={canvasRef} style={{ mixBlendMode: 'screen', width: '100%', height: '100%' }} />
            <Vignette />
        </>
    );
};

export default Scanlines;
