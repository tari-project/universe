import { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, MotionValue } from 'motion/react';

interface ParallaxOutput {
    x: MotionValue<number>;
    y: MotionValue<number>;
}

export const useParallax = (amount = 10): ParallaxOutput => {
    const posX = useMotionValue(0);
    const posY = useMotionValue(0);

    const x = useSpring(
        useTransform(posX, (x) => (x / 500) * amount),
        { damping: 50, stiffness: 300 }
    );

    const y = useSpring(
        useTransform(posY, (y) => (y / 500) * amount),
        { damping: 50, stiffness: 300 }
    );

    useEffect(() => {
        let frame: number;
        const handleMouseMove = (e: MouseEvent) => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                posX.set(e.clientX - window.innerWidth / 2);
                posY.set(e.clientY - window.innerHeight / 2);
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(frame);
        };
    }, [posX, posY]);

    return { x, y };
};
