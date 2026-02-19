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
    Wrapper,
    XCContent,
} from '@app/components/exchanges/universal/option/styles.ts';

import { ImgWrapper, OpenButton } from '../../commonStyles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { setShowUniversalModal } from '@app/store/useExchangeStore.ts';
import { invoke } from '@tauri-apps/api/core';
import { open } from '@tauri-apps/plugin-shell';
import { useTranslation } from 'react-i18next';
import { ExchangeAddress } from '../exchangeAddress/ExchangeAddress.tsx';
import { useState, Ref } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';
import { formatCountdown } from '@app/utils/formatters.ts';
import { setError, useWalletStore } from '@app/store';
import { ExchangeBranding, ExchangeMiner } from '@app/types/exchange.ts';

import { setSeedlessUI } from '@app/store/actions/uiStoreActions.ts';
import { Divider } from '@app/components/elements/Divider.tsx';
import { ExternalLinkSVG } from '@app/assets/icons/external-link.tsx';
import { truncateMiddle } from '@app/utils';
import { AnimatePresence } from 'motion/react';
import { convertEthAddressToTariAddress } from '@app/store/actions/bridgeApiActions.ts';
import { WalletAddressNetwork } from '@app/types/transactions.ts';
import LoadingDots from '@app/components/elements/loaders/LoadingDots.tsx';

interface XCOptionProps {
    isCurrent?: boolean;
    isActive?: boolean;
    content: ExchangeBranding;
    onActiveClick: (id: string) => void;
    ref?: Ref<HTMLDivElement>;
}

export const XCOption = ({ isCurrent = false, isActive, content, onActiveClick, ref }: XCOptionProps) => {
    const last_internal_tari_emoji_address_used = useWalletStore((state) => state.tari_address_emoji);
    const { t } = useTranslation(['exchange', 'settings'], { useSuspense: false });
    const [isAddressValid, setIsAddressValid] = useState(false);
    const [miningAddress, setMiningAddress] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleExchangeMiner = async () => {
        const selectedExchangeMiner: ExchangeMiner = {
            id: content.id,
            slug: content.slug,
            name: content.name,
        };

        setIsSubmitting(true);
        try {
            let tariAddress = miningAddress;

            if (content.wxtm_mode) {
                const encodedAddress = await convertEthAddressToTariAddress(miningAddress, selectedExchangeMiner.id);
                tariAddress = encodedAddress;
            }

            await invoke('select_exchange_miner', { exchangeMiner: selectedExchangeMiner, miningAddress: tariAddress });
            setSeedlessUI(true);
            setIsSubmitting(false);
            setShowUniversalModal(false);
        } catch (e) {
            console.error('Could not set Exchange address', e);
            const errorMessage = e as unknown as string;
            if (
                !errorMessage.includes('User canceled the operation') &&
                !errorMessage.includes('PIN entry cancelled')
            ) {
                setError(errorMessage);
            }
            setIsSubmitting(false);
        }
    };

    const isTari = content.slug === 'universal' && content.id === 'universal';
    const logoSrc = content.logo_img_small_url;
    const showExpand = isTari ? !isCurrent && content.id : content.id;

    const helpLink =
        content.address_help_link && content.address_help_link.length > 0 ? content.address_help_link : null;

    const helpMarkup = helpLink ? (
        <HelpButtonWrapper>
            <Divider />
            <HelpButton onClick={() => open(helpLink)}>
                <Typography>{t('help-find-address', { exchange: content.name, ns: 'exchange' })}</Typography>
                <ExternalLinkSVG />
            </HelpButton>
        </HelpButtonWrapper>
    ) : null;

    return (
        <Wrapper ref={ref} $isCurrent={isCurrent} $isActive={isActive}>
            <ContentHeaderWrapper
                onClick={() => {
                    onActiveClick(!isActive ? content.id : '');
                }}
            >
                <XCContent>
                    {!!logoSrc && (
                        <ImgWrapper>
                            <img src={logoSrc} alt={`${content.name} logo`} />
                        </ImgWrapper>
                    )}
                    <Heading>{content.name}</Heading>
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

            <AnimatePresence mode="wait">
                {isActive ? (
                    <ContentBodyWrapper>
                        <ExchangeAddress
                            walletAddressNetwork={
                                content.wxtm_mode ? WalletAddressNetwork.Ethereum : WalletAddressNetwork.Tari
                            }
                            handleIsAddressValid={setIsAddressValid}
                            handleAddressChanged={setMiningAddress}
                            value={
                                isCurrent && last_internal_tari_emoji_address_used
                                    ? truncateMiddle(last_internal_tari_emoji_address_used, 7, ' ... ')
                                    : ''
                            }
                        />

                        {content.campaign_description && content.reward_expiry_date ? (
                            <SeasonReward>
                                <LeftContent>
                                    {content.campaign_description ? (
                                        <>
                                            <SeasonRewardIcon src="/assets/img/wrapped_gift.png" alt="gift" />
                                            <SeasonRewardText>
                                                <b>{t('season-one-reward', { ns: 'exchange' })}:</b>{' '}
                                                <span>{content.campaign_description}</span>
                                            </SeasonRewardText>
                                        </>
                                    ) : null}
                                </LeftContent>
                                {content.reward_expiry_date ? (
                                    <Countdown>
                                        <CountdownText>{formatCountdown(content.reward_expiry_date)}</CountdownText>
                                    </Countdown>
                                ) : null}
                            </SeasonReward>
                        ) : null}

                        {isAddressValid ? (
                            <ConfirmButton onClick={handleExchangeMiner} disabled={isSubmitting || !isAddressValid}>
                                {isSubmitting ? (
                                    <LoadingDots />
                                ) : (
                                    <Typography variant="h4">{t('confirm', { ns: 'settings' })}</Typography>
                                )}
                            </ConfirmButton>
                        ) : (
                            helpMarkup
                        )}
                    </ContentBodyWrapper>
                ) : (
                    <div />
                )}
            </AnimatePresence>
        </Wrapper>
    );
};
