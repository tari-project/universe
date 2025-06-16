import {
    CaptionText,
    CaptionWrapper,
    ConfirmButton,
    ContentBodyWrapper,
    ContentHeaderWrapper,
    Countdown,
    CountdownText,
    Heading,
    HelpButton,
    HelpButtonWrapper,
    LeftContent,
    SeasonReward,
    SeasonRewardIcon,
    SeasonRewardText,
    SelectOptionWrapper,
    StyledAddress,
    StyledAddressWrapper,
    Wrapper,
    XCContent,
} from '@app/components/exchanges/universal/option/styles.ts';

import { ImgWrapper, OpenButton } from '../../commonStyles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { setShowUniversalModal, universalExchangeMinerOption } from '@app/store/useExchangeStore.ts';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { ExchangeAddress } from '../exchangeAddress/ExchangeAddress.tsx';
import { useState } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';
import { formatCountdown } from '@app/utils/formatters.ts';
import { setError, useWalletStore } from '@app/store';

import { Divider } from '@app/components/elements/Divider.tsx';
import { ExternalLinkSVG } from '@app/assets/icons/external-link.tsx';
import { refreshTransactions } from '@app/hooks/wallet/useFetchTxHistory.ts';

interface XCOptionProps {
    isCurrent?: boolean;
    isActive?: boolean;
    onActiveClick: (id: string) => void;
}

export const InternalWalletOption = ({ isCurrent = false, isActive, onActiveClick }: XCOptionProps) => {
    const { t } = useTranslation(['exchange', 'settings'], { useSuspense: false });
    const base_tari_address = useWalletStore((state) => state.tari_address_base58);

    const handleRevertToInternalWallet = async () => {
        await invoke('revert_to_internal_wallet')
            .then(() => {
                setShowUniversalModal(false);
                refreshTransactions();
            })
            .catch((e) => {
                console.error('Could not revert to internal wallet', e);
                setError('Could not revert to internal wallet', e);
            });
    };

    const isTari = universalExchangeMinerOption.slug === 'universal' && universalExchangeMinerOption.id === 'universal';
    const logoSrc = universalExchangeMinerOption.logo_img_small_url;
    const showExpand = isTari ? !isCurrent && universalExchangeMinerOption.id : universalExchangeMinerOption.id;

    return (
        <Wrapper $isCurrent={isCurrent} $isActive={isActive}>
            <ContentHeaderWrapper>
                <XCContent>
                    {!!logoSrc && (
                        <ImgWrapper>
                            <img src={logoSrc} alt={`${universalExchangeMinerOption.name} logo`} />
                        </ImgWrapper>
                    )}
                    <Heading>{universalExchangeMinerOption.name}</Heading>
                </XCContent>
                <SelectOptionWrapper>
                    {isCurrent && (
                        <CaptionWrapper>
                            <CaptionText>{t('selected-exchange-miner', { ns: 'exchange' })}</CaptionText>
                        </CaptionWrapper>
                    )}
                    {showExpand && (
                        <OpenButton
                            $isOpen={isActive}
                            onClick={() => {
                                onActiveClick(!isActive ? universalExchangeMinerOption.id : '');
                            }}
                        >
                            <ImgWrapper $border $isActive={isActive}>
                                <ChevronSVG />
                            </ImgWrapper>
                        </OpenButton>
                    )}
                </SelectOptionWrapper>
            </ContentHeaderWrapper>
            {isActive && (
                <ContentBodyWrapper $isActive={isActive}>
                    <StyledAddressWrapper>
                        <StyledAddress>{base_tari_address}</StyledAddress>
                    </StyledAddressWrapper>
                    <SeasonReward>
                        <LeftContent>
                            {universalExchangeMinerOption.campaign_description ? (
                                <>
                                    <SeasonRewardIcon src="/assets/img/wrapped_gift.png" alt="gift" />
                                    <SeasonRewardText>
                                        <b>{t('season-one-reward', { ns: 'exchange' })}:</b>{' '}
                                        <span>{universalExchangeMinerOption.campaign_description}</span>
                                    </SeasonRewardText>
                                </>
                            ) : null}
                        </LeftContent>
                        {universalExchangeMinerOption.reward_expiry_date ? (
                            <Countdown>
                                <CountdownText>
                                    {formatCountdown(universalExchangeMinerOption.reward_expiry_date)}
                                </CountdownText>
                            </Countdown>
                        ) : null}
                    </SeasonReward>
                    <ConfirmButton onClick={handleRevertToInternalWallet}>
                        <Typography variant="h4">{t('confirm', { ns: 'settings' })}</Typography>
                    </ConfirmButton>
                </ContentBodyWrapper>
            )}
        </Wrapper>
    );
};
