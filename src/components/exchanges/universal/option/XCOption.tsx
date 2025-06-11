import {
    CaptionText,
    CaptionWrapper,
    ConfirmButton,
    ContentBodyWrapper,
    ContentHeaderWrapper,
    Countdown,
    CountdownText,
    Heading,
    SeasonReward,
    SeasonRewardIcon,
    SeasonRewardText,
    SelectOptionWrapper,
    Wrapper,
    XCContent,
} from '@app/components/exchanges/universal/option/styles.ts';
import { ExchangeMinerAssets, ExchangeMiner } from '@app/types/exchange.ts';
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

interface XCOptionProps {
    content: ExchangeMinerAssets;
    isCurrent?: boolean;
}

export const XCOption = ({ content, isCurrent = false }: XCOptionProps) => {
    const { t } = useTranslation(['exchange', 'settings'], { useSuspense: false });
    const [isAddressValid, setIsAddressValid] = useState(false);
    const [isActive, setIsActive] = useState(false);
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
                console.info('New Tari address set successfully to:', miningAddress);
            })
            .catch((e) => {
                console.error('Could not set Exchange address', e);
                setError('Could not change Exchange address');
            });
    };

    const logoSrc = content.logo_img_url || content.logo_img_small_url;

    return (
        <Wrapper $isCurrent={isCurrent}>
            <ContentHeaderWrapper>
                <XCContent>
                    {logoSrc && (
                        <ImgWrapper $isLogo>
                            <img src={logoSrc} alt={content.name} />
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
                    {content.id && (
                        <OpenButton
                            onClick={() => {
                                setIsActive(!isActive);
                            }}
                        >
                            <ImgWrapper $border $isActive={isActive}>
                                <ChevronSVG />
                            </ImgWrapper>
                        </OpenButton>
                    )}
                </SelectOptionWrapper>
            </ContentHeaderWrapper>
            <ContentBodyWrapper $isActive={isActive}>
                <ExchangeAddress handleIsAddressValid={setIsAddressValid} handleAddressChanged={setMiningAddress} />
                <SeasonReward>
                    <SeasonRewardIcon src="/assets/img/wrapped_gift.svg" alt="gift" />
                    <SeasonRewardText>
                        <b>{t('season-one-reward', { ns: 'exchange' })}:</b> {content.campaign_description}
                    </SeasonRewardText>
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
                    <>
                        <div style={{ height: '1px', backgroundColor: '#e0e0e0', margin: '16px 0' }} />
                        <Typography variant="p" style={{ color: '#0066cc', cursor: 'pointer' }}>
                            {t('help-find-address', { exchange: content.name, ns: 'exchange' })}
                        </Typography>
                    </>
                )}
            </ContentBodyWrapper>
        </Wrapper>
    );
};
