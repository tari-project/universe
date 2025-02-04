import { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';

interface ParallaxOutput {
    x: MotionValue<number>;
    y: MotionValue<number>;
}

export const useParallax = (amount = 10): ParallaxOutput => {
    const pos = useMotionValue({ x: 0, y: 0 });

    const x = useSpring(
        useTransform(pos, ({ x }) => (x / 500) * amount),
        { damping: 50, stiffness: 300 }
    );

    const y = useSpring(
        useTransform(pos, ({ y }) => (y / 500) * amount),
        { damping: 50, stiffness: 300 }
    );

    useEffect(() => {
        let frame: number;
        const handleMouseMove = (e: MouseEvent) => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(() => {
                pos.set({
                    x: e.clientX - window.innerWidth / 2,
                    y: e.clientY - window.innerHeight / 2,
                });
            });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(frame);
        };
    }, [pos]);

    return { x, y };
};
