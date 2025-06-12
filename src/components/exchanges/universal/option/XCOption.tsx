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
import { TariOutlineSVG } from '@app/assets/icons/tari-outline.tsx';
import { setSeedlessUI } from '@app/store/actions/uiStoreActions.ts';
import { Divider } from '@app/components/elements/Divider.tsx';

interface XCOptionProps {
    content: ExchangeBranding;
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
                setSeedlessUI(true);
                console.info('New Tari address set successfully to:', miningAddress);
            })
            .catch((e) => {
                console.error('Could not set Exchange address', e);
                setError('Could not change Exchange address');
            });
    };

    const isTari = content.slug === 'universal' && content.id === 'universal';
    const logoSrc = content.logo_img_small_url || content.logo_img_url;
    const logoMarkup = isTari ? <TariOutlineSVG /> : logoSrc && <img src={logoSrc} alt={content.name} />;
    const showExpand = isTari ? !isCurrent && content.id : content.id;

    return (
        <Wrapper $isCurrent={isCurrent}>
            <ContentHeaderWrapper>
                <XCContent>
                    {(isTari || logoSrc) && (
                        <ImgWrapper $isLogo $col1={isTari ? '#000' : content.primary_colour}>
                            {logoMarkup}
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
                    <>
                        <Divider />
                        <Typography variant="p">
                            {t('help-find-address', { exchange: content.name, ns: 'exchange' })}
                        </Typography>
                    </>
                )}
            </ContentBodyWrapper>
        </Wrapper>
    );
};
