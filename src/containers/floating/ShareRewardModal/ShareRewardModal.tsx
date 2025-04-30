import { writeText } from '@tauri-apps/plugin-clipboard-manager';
import GreenModal from '@app/components/GreenModal/GreenModal';
import { AnimatePresence } from 'motion/react';
import { useShareRewardStore } from '@app/store/useShareRewardStore';
import {
    BlackButton,
    ContentWrapper,
    HeroImage,
    Label,
    RewardWrapper,
    Title,
    Value,
    WinnerPill,
    Number,
    Copied,
    GemPill,
    GemImage,
} from './styles';
import genericHeroImage from './images/generic-image.png';
import gemImage from '@app/assets/images/gem.png';

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import { formatNumber, FormatPreset } from '@app/utils/formatters';

const ShareRewardModal = memo(function ShareRewardModal() {
    const { t } = useTranslation('sidebar', { useSuspense: false });

    const { setShowModal, setItemData } = useShareRewardStore((s) => s);
    const showModal = useShareRewardStore((s) => s.showModal);
    const item = useShareRewardStore((s) => s.item);

    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 2000);
        }
    }, [copied]);

    const handleClose = () => {
        setShowModal(false);
        setItemData(null);
    };

    const airdropUrl = useAirdropStore((state) => state.backendInMemoryConfig?.airdropUrl || '');
    const userDetails = useAirdropStore((s) => s.userDetails);
    const referralCode = userDetails?.user?.referral_code || '';
    const gemsValue = GIFT_GEMS.toLocaleString();
    const block = item?.mined_in_block_height || 0;
    const reward = item?.amount || 0;
    const earningsFormatted = useMemo(() => formatNumber(reward, FormatPreset.TXTM_COMPACT).toLowerCase(), [reward]);

    const shareUrl = `${airdropUrl}/download/${referralCode}?bh=${block}`;

    const handleCopy = useCallback(() => {
        writeText(shareUrl).then(() => {
            setCopied(true);
        });
    }, [shareUrl]);

    return (
        <AnimatePresence>
            {showModal && (
                <GreenModal onClose={handleClose} boxWidth={600} padding={30}>
                    <HeroImage src={genericHeroImage} alt="" />

                    <ContentWrapper>
                        <Title>{t('share.title')}</Title>
                        {block ? (
                            <WinnerPill>
                                {t('share.winner-pill')} #{block.toLocaleString()}
                            </WinnerPill>
                        ) : null}

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

                        <RewardWrapper>
                            <Label>{t('share.reward')}</Label>
                            <Value>
                                <Number>{earningsFormatted}</Number>
                                <Trans>XTM</Trans>
                            </Value>
                        </RewardWrapper>
                    </ContentWrapper>
                </GreenModal>
            )}
        </AnimatePresence>
    );
});

export default ShareRewardModal;
