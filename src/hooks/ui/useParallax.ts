import { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, MotionValue } from 'framer-motion';

interface ParallaxOutput {
    x: MotionValue<number>;
    y: MotionValue<number>;
}

export const useParallax = (amount = 10): ParallaxOutput => {
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const springConfig = { damping: 50, stiffness: 300 };
    const x = useSpring(useTransform(mouseX, [-500, 500], [-amount, amount]), springConfig);
    const y = useSpring(useTransform(mouseY, [-500, 500], [-amount, amount]), springConfig);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            const { clientX, clientY } = e;
            const centerX = window.innerWidth / 2;
            const centerY = window.innerHeight / 2;
            mouseX.set(clientX - centerX);
            mouseY.set(clientY - centerY);
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [mouseX, mouseY]);

    return { x, y };
};
