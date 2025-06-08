import {
    CaptionText,
    CaptionWrapper,
    ContentWrapper,
    Heading,
    SelectOptionWrapper,
    Wrapper,
    XCContent,
} from '@app/components/exchanges/universal/option/styles.ts';
import { ExchangeMinerAssets, ExchangeMiner } from '@app/types/exchange.ts';
import { ImgWrapper, OpenButton } from '../../commonStyles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { setCurrentExchangeMiner, setShowExchangeModal, setShowUniversalModal } from '@app/store/useExchangeStore.ts';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { Typography } from '@app/components/elements/Typography.tsx';

interface XCOptionProps {
    content: ExchangeMinerAssets;
    isCurrent?: boolean;
}

export const XCOption = ({ content, isCurrent = false }: XCOptionProps) => {
    const { t } = useTranslation('exchange', { useSuspense: false });
    const confirmExchangeMiner = async () => {
        const selectedExchangeMiner: ExchangeMiner = {
            id: content.id,
            slug: content.slug,
            name: content.name,
        };
        await invoke('select_exchange_miner', { exchangeMiner: selectedExchangeMiner });
        setShowUniversalModal(false);
        setShowExchangeModal(true);
        setCurrentExchangeMiner(content);
    };

    return (
        <Wrapper $isCurrent={isCurrent}>
            <ContentWrapper>
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
                        <OpenButton onClick={() => confirmExchangeMiner()}>
                            <ImgWrapper $border>
                                <ChevronSVG />
                            </ImgWrapper>
                        </OpenButton>
                    )}
                </SelectOptionWrapper>
            </ContentWrapper>
        </Wrapper>
    );
};
