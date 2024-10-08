import { useEffect } from 'react';
import GemsAnimation from '../GemsAnimation/GemsAnimation';
import { Background, Wrapper } from './styles';
import { Number, Text, TextBottom, TextBottomPosition } from '../styles';
import { formatNumber } from '@app/utils/formatNumber.ts';

interface Props {
    gems: number;
    onAnimationComplete: () => void;
}

export default function BonusGems({ gems, onAnimationComplete }: Props) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onAnimationComplete();
        }, 3500);

        return () => clearTimeout(timer);
    }, [onAnimationComplete]);

    return (
        <Wrapper>
            <Number
                initial={{ opacity: 0, scale: 2 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.5 }}
            >
                {formatNumber(gems, 1)}
            </Number>

            <Text
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.85 }}
            >
                Bonus gems earned
            </Text>

            <TextBottomPosition>
                <TextBottom
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 1 }}
                >
                    Keep mining to earn more rewards!
                </TextBottom>
            </TextBottomPosition>

            <GemsAnimation delay={1} />

            <Background
                initial={{ scale: 3 }}
                animate={{ scale: 1 }}
                exit={{ scale: 3 }}
                transition={{ duration: 0.5, ease: 'easeIn' }}
            />
        </Wrapper>
    );
}
