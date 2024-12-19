import { useEffect, useRef } from 'react';
import { Canvas, Vignette } from './styles';

interface ScanlinesProps {
    scaleToWindow?: boolean;
}

const Scanlines: React.FC<ScanlinesProps> = ({ scaleToWindow = false }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        if (scaleToWindow) {
            canvas.width = window.innerWidth / 3;
            canvas.height = window.innerHeight / 3;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let scanlineOffset = 0.2; // Adjusted initial scanlineOffset

        // Create ImageData once and reuse it
        const imageData = ctx.createImageData(canvas.width, canvas.height);
        const data = imageData.data;

        const drawScanlines = () => {
            if (!ctx || !canvas) return;

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw TV static
            for (let i = 0; i < data.length; i += 4) {
                const noise = Math.random() < 0.5 ? 19 : 28; // Updated noise colors
                data[i] = noise;
                data[i + 1] = noise;
                data[i + 2] = noise;
                data[i + 3] = 255;
            }
            ctx.putImageData(imageData, 0, 0);

            // Draw scanlines
            for (let y = scanlineOffset; y < canvas.height; y += 3) {
                ctx.fillStyle = '#1c212b'; // Lighter scanline color
                ctx.fillRect(0, y, canvas.width, 1);
            }

            scanlineOffset = (scanlineOffset + 0.1) % 3;

            animationFrameId = requestAnimationFrame(drawScanlines);
        };

        drawScanlines();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [scaleToWindow]);

    return (
        <>
            <Canvas ref={canvasRef} style={{ mixBlendMode: 'screen', backgroundColor: '#131519' }} />
            <Vignette />
        </>
    );
};

export default Scanlines;
