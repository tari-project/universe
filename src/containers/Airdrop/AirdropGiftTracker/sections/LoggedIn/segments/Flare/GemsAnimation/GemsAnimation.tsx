import React, { useEffect, useRef } from 'react';
import gemImage from '../images/gem.png';
import { Canvas, Wrapper } from './styles';

interface Gem {
    x: number;
    y: number;
    speed: number;
    size: number;
    rotation: number;
    rotationSpeed: number;
    reset: (containerWidth: number, containerHeight: number) => void;
    fall: (containerHeight: number) => void;
    draw: (ctx: CanvasRenderingContext2D, image: HTMLImageElement) => void;
}

class GemImpl implements Gem {
    x: number;
    y: number;
    speed: number;
    size: number;
    rotation: number;
    rotationSpeed: number;

    constructor(containerWidth: number) {
        this.x = 0;
        this.y = 0;
        this.speed = 0;
        this.size = 0;
        this.rotation = 0;
        this.rotationSpeed = 0;
        this.reset(containerWidth);
    }

    reset(containerWidth: number): void {
        this.x = Math.random() * containerWidth;
        this.y = -30; // Start slightly above the container

        const sizeDistribution = Math.random();
        if (sizeDistribution < 0.7) {
            this.size = 10 + Math.random() * 10; // 10 to 20 pixels
        } else if (sizeDistribution < 0.9) {
            this.size = 20 + Math.random() * 10; // 20 to 30 pixels
        } else {
            this.size = 30 + Math.random() * 10; // 30 to 40 pixels
        }

        this.speed = 1.5 - this.size / 40 + Math.random() * 1;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.05;
    }

    fall(containerHeight: number): void {
        this.y += this.speed;
        if (this.y > containerHeight + this.size) {
            this.y = -this.size;
        }
        this.rotation += this.rotationSpeed;
    }

    draw(ctx: CanvasRenderingContext2D, image: HTMLImageElement): void {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.rotation);
        ctx.drawImage(image, -this.size / 2, -this.size / 2, this.size, this.size);
        ctx.restore();
    }
}

interface GemsAnimationProps {
    delay?: number; // Delay in seconds
}

const GemsAnimation: React.FC<GemsAnimationProps> = ({ delay = 0 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationFrameId: number;
        let gems: Gem[] = [];
        const totalGems = 15;
        const image = new Image();
        image.src = gemImage;

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (!parent) return;

            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;

            // Reset gems when canvas size changes
            gems = [];
            for (let i = 0; i < totalGems; i++) {
                gems.push(new GemImpl(canvas.width));
            }
        };

        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(canvas.parentElement as Element);

        const animate = (): void => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Sort gems by size, smallest to largest
            gems.sort((a, b) => a.size - b.size);

            gems.forEach((gem) => {
                gem.fall(canvas.height);
                gem.draw(ctx, image);
            });

            animationFrameId = requestAnimationFrame(animate);
        };

        resizeCanvas(); // Initial setup

        // Start the animation after the specified delay
        const timeoutId = setTimeout(() => {
            animate();
        }, delay * 1000);

        return () => {
            cancelAnimationFrame(animationFrameId);
            resizeObserver.disconnect();
            clearTimeout(timeoutId);
        };
    }, [delay]);

    return (
        <Wrapper>
            <Canvas ref={canvasRef} />
        </Wrapper>
    );
};

export default GemsAnimation;
