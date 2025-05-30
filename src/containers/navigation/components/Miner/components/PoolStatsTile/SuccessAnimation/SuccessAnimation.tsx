'use client';

import { useEffect } from 'react';
import { Wrapper, Text, LottieWrapper } from './styles';
import { AnimatePresence } from 'motion/react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import coins_victory_url from '../lotties/Coins_Victory_Lottie.json?url';

interface SuccessAnimationProps {
    onComplete?: () => void;
    isVisible: boolean;
    setIsVisible: (isVisible: boolean) => void;
    rewardThreshold: string;
}

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
                        {`You earned `}
                        {rewardThreshold}!
                    </Text>
                    <LottieWrapper>
                        <DotLottieReact src={coins_victory_url} autoplay loop={false} className="lottie-animation" />
                    </LottieWrapper>
                </Wrapper>
            )}
        </AnimatePresence>
    );
};
