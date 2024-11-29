import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import GemsAnimation from '../GemsAnimation/GemsAnimation';
import { Number, Text, TextBottom, TextBottomPosition } from '../styles';
import { formatNumber, FormatPreset } from '@app/utils/formatters';
import { Background, Wrapper } from './styles';

interface Props {
    gems: number;
    onAnimationComplete: () => void;
}

export default function BonusGems({ gems, onAnimationComplete }: Props) {
    const { t } = useTranslation('airdrop', { useSuspense: false });
    const formattedNumber = formatNumber(gems, FormatPreset.DECIMAL_COMPACT);

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
                {formattedNumber}
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
                    {t('keep-mining-to-earn-rewards')}
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
