import GreenModal from '@app/components/GreenModal/GreenModal';
import { AnimatePresence } from 'framer-motion';
import { useShareRewardStore } from '@app/store/useShareRewardStore';
import {
    BlackButton,
    ContentWrapper,
    HeroImage,
    Label,
    RewardWrapper,
    Text,
    Title,
    Value,
    WinnerPill,
    Number,
    Copied,
    GemPill,
    GemImage,
} from './styles';
import genericHeroImage from './images/generic-image.png';
import gemImage from '../Airdrop/AirdropGiftTracker/images/gem.png';

import { useEffect, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore';

export type PaperWalletModalSectionType = 'Connect' | 'QRCode';

export default function ShareRewardModal() {
    const { t } = useTranslation('sidebar', { useSuspense: false });

    const showModal = useShareRewardStore((s) => s.showModal);
    const setShowModal = useShareRewardStore((s) => s.setShowModal);
    const block = useShareRewardStore((s) => s.block);
    const contributed = useShareRewardStore((s) => s.contributed);
    const reward = useShareRewardStore((s) => s.reward);

    const [copied, setCopied] = useState(false);

    const { referralQuestPoints } = useAirdropStore();
    const gemsValue = (referralQuestPoints?.pointsForClaimingReferral || GIFT_GEMS).toLocaleString();

    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        }
    }, [copied]);

    const handleClose = () => {
        setShowModal(false);
    };

    const handleCopy = () => {
        navigator.clipboard.writeText('https://tari.com');
        setCopied(true);
    };

    return (
        <AnimatePresence>
            {showModal && (
                <GreenModal onClose={handleClose} boxWidth={600} padding={30}>
                    <HeroImage src={genericHeroImage} alt="" />

                    <ContentWrapper>
                        <Title>{t('share.title')}</Title>
                        <WinnerPill>
                            {t('share.winner-pill')} #{block.toLocaleString()}
                        </WinnerPill>

                        <BlackButton onClick={handleCopy}>
                            <AnimatePresence>
                                {copied && (
                                    <Copied initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                                        {t('share.copied')}
                                    </Copied>
                                )}
                            </AnimatePresence>
                            <GemPill>
                                {gemsValue} <GemImage src={gemImage} alt="" />
                            </GemPill>

                            {t('share.button-text')}
                        </BlackButton>

                        {contributed && contributed !== 0 ? (
                            <Text>
                                <Trans
                                    t={t}
                                    i18nKey="share.contributed"
                                    ns="sidebar"
                                    values={{ value: contributed.toLocaleString() }}
                                    components={{ strong: <strong /> }}
                                />
                            </Text>
                        ) : null}

                        <RewardWrapper>
                            <Label>{t('share.reward')}</Label>
                            <Value>
                                <Number>{reward}</Number>
                                <Trans>XTM</Trans>
                            </Value>
                        </RewardWrapper>
                    </ContentWrapper>
                </GreenModal>
            )}
        </AnimatePresence>
    );
}
