import { StatsPill, StatsNumber, StatsIcon, GemsAnimation, GemImage } from '../styles';
import gemImage from '../images/gems.png';
import { AnimatePresence, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Props {
    value: number;
}

export default function GemsPill({ value }: Props) {
    const [displayValue, setDisplayValue] = useState(0);
    const [animate, setAnimate] = useState(false);

    const getRandomX = (() => {
        let lastValue = 20;
        return () => {
            lastValue = lastValue === 20 ? -20 : 20;
            return lastValue;
        };
    })();

    const getRandomRotation = (() => {
        let lastValue = 40;
        return () => {
            lastValue = lastValue === 40 ? -40 : 40;
            return lastValue;
        };
    })();

    const spring = useSpring(0, { mass: 0.8, stiffness: 50, damping: 20 });

    spring.on('change', (latest: number) => {
        setDisplayValue(Math.round(latest));
    });

    useEffect(() => {
        spring.set(value);
    }, [spring, value]);

    useEffect(() => {
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 1000);
        return () => clearTimeout(timer);
    }, [displayValue]);

    return (
        <StatsPill>
            <StatsNumber>{displayValue.toLocaleString()}</StatsNumber>

            <StatsIcon src={gemImage} alt="Gems" className="StatsIcon-gems" />

            <AnimatePresence>
                {animate && (
                    <GemsAnimation>
                        {[...Array(8)].map((_, i) => (
                            <GemImage
                                key={i}
                                src={gemImage}
                                alt=""
                                initial={{
                                    opacity: 0,
                                    y: 120,
                                    x: getRandomX(),
                                    scale: 2.5,
                                    rotate: getRandomRotation(),
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    x: 0,
                                    scale: 0.8,
                                    rotate: 0,
                                    transition: {
                                        duration: 1,
                                        delay: i * 0.18,
                                    },
                                }}
                                exit={{ opacity: 0 }}
                            />
                        ))}
                    </GemsAnimation>
                )}
            </AnimatePresence>
        </StatsPill>
    );
}
