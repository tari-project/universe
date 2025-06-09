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

const formatCountdown = (targetDate: string): string => {
    const now = new Date().getTime();
    const target = new Date(targetDate).getTime();
    const difference = target - now;

    if (difference <= 0) {
        return '0D 0H 0M';
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}D ${hours}H ${minutes}M`;
};

export const XCOption = ({ content, isCurrent = false }: XCOptionProps) => {
    const { t } = useTranslation(['exchange', 'settings'], { useSuspense: false });
    const [isActive, setIsActive] = useState(false);
    const handleExchangeMiner = async () => {
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
        <Wrapper isCurrent={isCurrent}>
            <ContentHeaderWrapper>
                <XCContent>
                    {content.logo_img_url && (
                        <ImgWrapper $isLogo>
                            <img src={content.logo_img_url} alt={content.name} />
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
            <ContentBodyWrapper isActive={isActive}>
                <ExchangeAddress initialAddress="test" confirmExchangeMiner={handleExchangeMiner} />
                <SeasonReward>
                    <SeasonRewardIcon src="/assets/img/wrapped_gift.svg" alt="gift" />
                    <SeasonRewardText>
                        <b>{t('season-one-reward', { ns: 'exchange' })}:</b> {content.campaign_description}
                    </SeasonRewardText>
                    <Countdown>
                        <CountdownText>
                            {content.reward_expiry_date
                                ? formatCountdown(content.reward_expiry_date)
                                : 'no expiry date'}
                        </CountdownText>
                    </Countdown>
                </SeasonReward>
                <ConfirmButton onClick={handleExchangeMiner}>
                    <Typography variant="h4">{t('confirm', { ns: 'settings' })}</Typography>
                </ConfirmButton>
            </ContentBodyWrapper>
        </Wrapper>
    );
};
