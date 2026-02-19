import {
    CaptionText,
    CaptionWrapper,
    ConfirmButton,
    ContentBodyWrapper,
    ContentHeaderWrapper,
    Countdown,
    CountdownText,
    Heading,
    LeftContent,
    SeasonReward,
    SeasonRewardIcon,
    SeasonRewardText,
    SelectOptionWrapper,
    Wrapper,
    XCContent,
} from '@app/components/exchanges/universal/option/styles.ts';

import { ImgWrapper, OpenButton } from '../../commonStyles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { setShowUniversalModal, universalExchangeMinerOption } from '@app/store/useExchangeStore.ts';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { ExchangeAddress } from '../exchangeAddress/ExchangeAddress.tsx';
import { Typography } from '@app/components/elements/Typography.tsx';
import { formatCountdown } from '@app/utils/formatters.ts';
import { setError, useWalletStore } from '@app/store';

import { truncateMiddle } from '@app/utils/truncateString.ts';
import { useState, Ref } from 'react';
import { WalletAddressNetwork } from '@app/types/transactions.ts';
import { setIsWalletLoading } from '@app/store/actions/walletStoreActions.ts';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';

interface XCOptionProps {
    isCurrent?: boolean;
    isActive?: boolean;
    onActiveClick: (id: string) => void;
    ref?: Ref<HTMLDivElement>;
}

export const InternalWalletOption = ({ isCurrent = false, isActive, onActiveClick, ref }: XCOptionProps) => {
    const { t } = useTranslation(['exchange', 'settings'], { useSuspense: false });
    const base_tari_address = useWalletStore((state) => state.tari_address_emoji);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRevertToInternalWallet = async () => {
        setIsSubmitting(true);
        setIsWalletLoading(true);
        try {
            await invoke('revert_to_internal_wallet');
            setIsWalletLoading(false);
            setIsSubmitting(false);
            setShowUniversalModal(false);
        } catch (e) {
            console.error('Could not revert to internal wallet', e);
            const errorMessage = e as unknown as string;
            const showError =
                !errorMessage.includes('User canceled the operation') && !errorMessage.includes('PIN entry cancelled');
            if (showError) {
                setError(errorMessage);
            }
            setIsWalletLoading(false);
            setIsSubmitting(false);
        }
    };

    const isTari = universalExchangeMinerOption.slug === 'universal' && universalExchangeMinerOption.id === 'universal';
    const logoSrc = universalExchangeMinerOption.logo_img_small_url;
    const showExpand = isTari ? !isCurrent && universalExchangeMinerOption.id : universalExchangeMinerOption.id;

    return (
        <Wrapper ref={ref} $isCurrent={isCurrent} $isActive={isActive}>
            <ContentHeaderWrapper
                onClick={() => {
                    onActiveClick(!isActive ? universalExchangeMinerOption.id : '');
                }}
            >
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
                        <OpenButton $isOpen={isActive}>
                            <ImgWrapper $border $isActive={isActive}>
                                <ChevronSVG />
                            </ImgWrapper>
                        </OpenButton>
                    )}
                </SelectOptionWrapper>
            </ContentHeaderWrapper>
            {isActive && (
                <ContentBodyWrapper>
                    <ExchangeAddress
                        handleIsAddressValid={() => true}
                        handleAddressChanged={() => null}
                        value={truncateMiddle(base_tari_address, 7, ' ... ')}
                        disabled
                        walletAddressNetwork={WalletAddressNetwork.Tari} // always true for internal option
                    />
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
                    <ConfirmButton onClick={handleRevertToInternalWallet} disabled={isSubmitting}>
                        {isSubmitting ? (
                            <LoadingDots />
                        ) : (
                            <Typography variant="h4">{t('confirm', { ns: 'settings' })}</Typography>
                        )}
                    </ConfirmButton>
                </ContentBodyWrapper>
            )}
        </Wrapper>
    );
};
