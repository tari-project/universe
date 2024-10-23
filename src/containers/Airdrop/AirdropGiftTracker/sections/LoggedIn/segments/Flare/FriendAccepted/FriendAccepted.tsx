import { useEffect } from 'react';
import GemsAnimation from '../GemsAnimation/GemsAnimation';
import { Background, Wrapper } from './styles';
import { Number, Text, TextBottom, TextBottomPosition } from '../styles';
import { useTranslation } from 'react-i18next';

interface Props {
    gems: number;
    onAnimationComplete: () => void;
}

export default function FriendAccepted({ gems, onAnimationComplete }: Props) {
    const { t } = useTranslation('airdrop', { useSuspense: false });

    useEffect(() => {
        const timer = setTimeout(() => {
            onAnimationComplete();
        }, 10000);

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
                {gems.toLocaleString()}
            </Number>

            <Text
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: 0.85 }}
            >
                {t('bonus-gems-earned')}
            </Text>

            <TextBottomPosition>
                <TextBottom
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: 1 }}
                >
                    {t('your-friend-accepted-gift')}
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
