import { useEffect, useState } from 'react';
import GemsAnimation from '../GemsAnimation/GemsAnimation';
import { Background, GiftBox, GiftBoxLid, GiftBoxShine, GiftBoxWrapper, IntroBox, Wrapper } from './styles';
import { Number, Text } from '../styles';

import giftBoxImage from '../images/gold_gift_box.png';
import giftBoxLidImage from '../images/gold_gift_box_lid.png';
import giftBoxShineImage from '../images/gift_box_shine.png';
import { useTranslation } from 'react-i18next';

interface Props {
    gems: number;
}

export default function GoalComplete({ gems }: Props) {
    const { t } = useTranslation('airdrop', { useSuspense: false });
    const [showIntro, setShowIntro] = useState(true);
    const [showGiftBox, setShowGiftBox] = useState(true);

    const introDuration = 2000;

    useEffect(() => {
        const introTimer = setTimeout(() => {
            setShowIntro(false);
            setShowGiftBox(false);
        }, introDuration);

        return () => {
            clearTimeout(introTimer);
        };
    }, []);

    return (
        <Wrapper>
            <IntroBox>
                <GiftBoxWrapper
                    initial={{ opacity: 0, y: '100%' }}
                    animate={showGiftBox ? { opacity: 1, y: 0 } : { opacity: 1, y: '70%' }}
                    transition={{ type: 'spring', damping: 10, stiffness: 100 }}
                >
                    <GiftBoxShine
                        src={giftBoxShineImage}
                        alt=""
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                    />
                    <GiftBoxLid
                        src={giftBoxLidImage}
                        alt=""
                        initial={{ y: 0 }}
                        animate={{ y: -50, opacity: 0, scale: 2 }}
                        transition={{ delay: 1.5 }}
                    />
                    <GiftBox src={giftBoxImage} alt="" />
                </GiftBoxWrapper>
            </IntroBox>

            {!showIntro && (
                <>
                    <Number
                        initial={{ opacity: 0, scale: 0, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: 0.5 }}
                    >
                        {gems.toLocaleString()}
                    </Number>

                    <Text
                        initial={{ opacity: 0, scale: 0, y: 100 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: 0.85 }}
                    >
                        {t('bonus-gems-earned')}
                        <br /> {t('you-reached-your-giftinh-goal')}
                    </Text>

                    <GemsAnimation delay={1} />
                </>
            )}

            <Background />
        </Wrapper>
    );
}
