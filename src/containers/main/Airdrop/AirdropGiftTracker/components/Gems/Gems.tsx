import { Wrapper, Number, Label, GemImage, GemsAnimation, GemAnimatedImage } from './styles';
import gemImage from '../../images/gem.png';
import { AnimatePresence, useSpring } from 'motion';
import { useEffect, useState } from 'react';

interface Props {
    number: number;
    label: string;
}

export default function Gems({ number, label }: Props) {
    const [displayValue, setDisplayValue] = useState(number);
    const [animate, setAnimate] = useState(false);

    const getRandomX = (() => {
        let lastValue = 10;
        return () => {
            lastValue = lastValue === 10 ? -10 : 10;
            return lastValue;
        };
    })();

    const getRandomRotation = (() => {
        let lastValue = 50;
        return () => {
            lastValue = lastValue === 50 ? -50 : 50;
            return lastValue;
        };
    })();

    const spring = useSpring(0, { mass: 0.8, stiffness: 50, damping: 20 });

    spring.on('change', (latest: number) => {
        setDisplayValue(Math.round(latest));
    });

    useEffect(() => {
        spring.set(number);
    }, [spring, number]);

    useEffect(() => {
        setAnimate(true);
        const timer = setTimeout(() => setAnimate(false), 1000);
        return () => clearTimeout(timer);
    }, [displayValue]);

    return (
        <Wrapper>
            <Number>
                <GemImage src={gemImage} alt="" />

                {displayValue
                    .toLocaleString()
                    .split('')
                    .map((char, index) =>
                        char === ',' || char === '.' ? (
                            <span key={index} className="digit-char">
                                {char}
                            </span>
                        ) : (
                            <span key={index} className="digit-num">
                                {char}
                            </span>
                        )
                    )}

                <AnimatePresence>
                    {animate && (
                        <GemsAnimation>
                            {[...Array(10)].map((_, i) => (
                                <GemAnimatedImage
                                    key={i}
                                    src={gemImage}
                                    alt=""
                                    initial={{
                                        opacity: 0,
                                        y: -70,
                                        x: getRandomX(),
                                        scale: 2.5,
                                        rotate: getRandomRotation(),
                                    }}
                                    animate={{
                                        opacity: 1,
                                        y: 0,
                                        x: 0,
                                        scale: 0,
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
            </Number>
            <Label>{label}</Label>
        </Wrapper>
    );
}
