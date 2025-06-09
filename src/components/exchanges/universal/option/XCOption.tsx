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
import { setCurrentExchangeMiner, setShowUniversalModal } from '@app/store/useExchangeStore.ts';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { ExchangeAddress } from '../exchangeAddress/ExchangeAddress.tsx';
import { useState } from 'react';
import { Typography } from '@app/components/elements/Typography.tsx';

interface XCOptionProps {
    content: ExchangeMinerAssets;
    isCurrent?: boolean;
}

export const XCOption = ({ content, isCurrent = false }: XCOptionProps) => {
    const { t } = useTranslation(['exchange', 'settings'], { useSuspense: false });
    const [isActive, setIsActive] = useState(false);
    const confirmExchangeMiner = async () => {
        const selectedExchangeMiner: ExchangeMiner = {
            id: content.id,
            slug: content.slug,
            name: content.name,
        };
        await invoke('select_exchange_miner', { exchangeMiner: selectedExchangeMiner });
        setShowUniversalModal(false);
        setCurrentExchangeMiner(content);
    };

    return (
        <Wrapper $isCurrent={isCurrent}>
            <ContentHeaderWrapper>
                <XCContent>
                    {content.logoImgUrl && (
                        <ImgWrapper $isLogo>
                            <img src={content.logoImgUrl} alt={content.name} />
                        </ImgWrapper>
                    )}
                    <Heading>{content.name}</Heading>
                </XCContent>
                <SelectOptionWrapper>
                    {isCurrent && (
                        <CaptionWrapper>
                            <CaptionText>{t('selected-exchange-miner')}</CaptionText>
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
                <ExchangeAddress initialAddress="test" confirmExchangeMiner={confirmExchangeMiner} />
                <SeasonReward>
                    <SeasonRewardIcon src="/assets/img/wrapped_gift.svg" alt="gift" />
                    <SeasonRewardText>
                        <Typography variant="p" fontWeight="bold" style={{ display: 'inline' }}>
                            {t('season-one-reward')}
                        </Typography>
                        <Typography variant="p" style={{ display: 'inline' }}>
                            Season one bonus: Earn 12% bonus XTM when you mine to Kraken.
                        </Typography>
                    </SeasonRewardText>
                    <Countdown>
                        <CountdownText>36D 21H 22M</CountdownText>
                    </Countdown>
                </SeasonReward>
                <ConfirmButton onClick={confirmExchangeMiner}>
                    <Typography variant="h4">{t('confirm')}</Typography>
                </ConfirmButton>
            </ContentBodyWrapper>
        </Wrapper>
    );
};
