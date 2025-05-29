'use client';

import { useEffect } from 'react';
import {
    Wrapper,
    Text,
    Coin1Image,
    Coin2Image,
    Coin3Image,
    Coin4Image,
    Coin5Image,
    CoinWrapper,
    Coin6Image,
    Float,
} from './styles';
import { AnimatePresence } from 'motion/react';

import coin1Image from './images/coin1.png';
import coin2Image from './images/coin2.png';
import coin3Image from './images/coin3.png';
import coin4Image from './images/coin4.png';
import coin5Image from './images/coin5.png';

interface SuccessAnimationProps {
    onComplete?: () => void;
    isVisible: boolean;
    setIsVisible: (isVisible: boolean) => void;
    rewardThreshold: string;
}

const coinAnimation = {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    transition: {
        duration: 0.5,
        ease: [0.15, 0, 0, 0.97],
    },
};

export const SuccessAnimation = ({ onComplete, isVisible, setIsVisible, rewardThreshold }: SuccessAnimationProps) => {
    useEffect(() => {
        if (!isVisible) return;

        const timer = setTimeout(() => {
            setIsVisible(false);
            onComplete?.();
        }, 4000);

        return () => clearTimeout(timer);
    }, [onComplete, setIsVisible, isVisible]);

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    <Wrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <Text
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{
                                duration: 0.5,
                                ease: [0.15, 0, 0, 0.97],
                            }}
                        >
                            {rewardThreshold}!
                        </Text>
                    </Wrapper>
                    <CoinWrapper>
                        <Float delay={0}>
                            <Coin1Image src={coin1Image} alt="" {...coinAnimation} key="coin1" />
                        </Float>
                        <Float delay={0.3}>
                            <Coin2Image src={coin2Image} alt="" {...coinAnimation} key="coin2" />
                        </Float>
                        <Float delay={0.6}>
                            <Coin3Image src={coin3Image} alt="" {...coinAnimation} key="coin3" />
                        </Float>
                        <Float delay={0.15}>
                            <Coin4Image src={coin4Image} alt="" {...coinAnimation} key="coin4" />
                        </Float>
                        <Float delay={0.45}>
                            <Coin5Image src={coin5Image} alt="" {...coinAnimation} key="coin5" />
                        </Float>
                        <Float delay={0.75}>
                            <Coin6Image src={coin2Image} alt="" {...coinAnimation} key="coin6" />
                        </Float>
                    </CoinWrapper>
                </>
            )}
        </AnimatePresence>
    );
};
