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
import { useTranslation } from 'react-i18next';
import { ExchangeAddress } from '../exchangeAddress/ExchangeAddress.tsx';
import { useState } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';
import { formatCountdown } from '@app/utils/formatters.ts';
import { restartMining } from '@app/store/actions/miningStoreActions.ts';
import { setError } from '@app/store';
import { ExchangeBranding, ExchangeMiner } from '@app/types/exchange.ts';

import { setSeedlessUI } from '@app/store/actions/uiStoreActions.ts';
import { Divider } from '@app/components/elements/Divider.tsx';
import { ExternalLinkSVG } from '@app/assets/icons/external-link.tsx';

interface XCOptionProps {
    content: ExchangeBranding;
    isCurrent?: boolean;
    isActive?: boolean;
    onActiveClick: (id: string) => void;
}

export const XCOption = ({ content, isCurrent = false, isActive, onActiveClick }: XCOptionProps) => {
    const { t } = useTranslation(['exchange', 'settings'], { useSuspense: false });
    const [isAddressValid, setIsAddressValid] = useState(false);
    const [miningAddress, setMiningAddress] = useState('');

    const handleExchangeMiner = async () => {
        const selectedExchangeMiner: ExchangeMiner = {
            id: content.id,
            slug: content.slug,
            name: content.name,
        };
        await invoke('select_exchange_miner', { exchangeMiner: selectedExchangeMiner, miningAddress })
            .then(() => {
                setShowUniversalModal(false);
                restartMining();
                setSeedlessUI(true);
                console.info('New Tari address set successfully to:', miningAddress);
            })
            .catch((e) => {
                console.error('Could not set Exchange address', e);
                setError('Could not change Exchange address');
            });
    };

    const isTari = content.slug === 'universal' && content.id === 'universal';
    const logoSrc = content.logo_img_small_url;
    const showExpand = isTari ? !isCurrent && content.id : content.id;

    const helpMarkup = content.address_help_link ? (
        <HelpButtonWrapper>
            <Divider />
            <HelpButton onClick={() => open(content.address_help_link)}>
                <Typography>{t('help-find-address', { exchange: content.name, ns: 'exchange' })}</Typography>
                <ExternalLinkSVG />
            </HelpButton>
        </HelpButtonWrapper>
    ) : null;

    return (
        <Wrapper $isCurrent={isCurrent} $isActive={isActive}>
            <ContentHeaderWrapper>
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
                        <OpenButton
                            $isOpen={isActive}
                            onClick={() => {
                                onActiveClick(!isActive ? content.id : '');
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
                    <ExchangeAddress handleIsAddressValid={setIsAddressValid} handleAddressChanged={setMiningAddress} />
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
                    {isAddressValid ? (
                        <ConfirmButton onClick={handleExchangeMiner} disabled={!isAddressValid}>
                            <Typography variant="h4">{t('confirm', { ns: 'settings' })}</Typography>
                        </ConfirmButton>
                    ) : (
                        helpMarkup
                    )}
                </ContentBodyWrapper>
            )}
        </Wrapper>
    );
};
