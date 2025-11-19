import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useShareRewardStore } from '@app/store/useShareRewardStore.ts';

import gemImage from '@app/assets/images/gem.png';
import { ReplaySVG } from '@app/assets/icons/replay.tsx';
import {
    ButtonWrapper,
    FlexButton,
    GemImage,
    GemPill,
    HoverWrapper,
    ReplayButton,
} from './MinotariHistoryItem.styles.ts';
import { useConfigUIStore } from '@app/store/useAppConfigStore.ts';
import { MinotariWalletTransaction } from '@app/types/app-status.ts';

interface Props {
    transaction: MinotariWalletTransaction;
    button?: React.ReactNode;
}

const MinotariHoverItem = memo(function ItemHover({ transaction, button }: Props) {
    const { t } = useTranslation('sidebar', { useSuspense: false });
    const sharingEnabled = useConfigUIStore((s) => s.sharing_enabled);
    const airdropTokens = useAirdropStore((s) => s.airdropTokens);
    const setShowModal = useShareRewardStore((s) => s.setShowModal);
    const setItemData = useShareRewardStore((s) => s.setItemData);

    const gemsValue = GIFT_GEMS.toLocaleString();

    const handleShareClick = () => {
        setShowModal(true);
        setItemData(transaction);
    };
    const isLoggedIn = !!airdropTokens;
    const showShareButton = sharingEnabled && isLoggedIn;
    return (
        <HoverWrapper initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ButtonWrapper initial={{ opacity: 0, x: 5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 5 }}>
                {button ? (
                    button
                ) : (
                    <>
                        {showShareButton && (
                            <FlexButton onClick={handleShareClick} aria-label={t('share.history-item-button')}>
                                {t('share.history-item-button')}
                                <GemPill>
                                    <span>{gemsValue}</span>
                                    <GemImage src={gemImage} alt="" />
                                </GemPill>
                            </FlexButton>
                        )}
                        <ReplayButton onClick={() => console.info('Replay not implemented yet')}>
                            <ReplaySVG />
                        </ReplayButton>
                    </>
                )}
            </ButtonWrapper>
        </HoverWrapper>
    );
});

export default MinotariHoverItem;
