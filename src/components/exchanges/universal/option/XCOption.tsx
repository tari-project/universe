import { ContentWrapper, Heading, Wrapper, XCContent } from '@app/components/exchanges/universal/option/styles.ts';
import { ExchangeMinerAssets, ExchangeMiner } from '@app/types/exchange.ts';
import { ImgWrapper, OpenButton } from '../../commonStyles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { setShowExchangeModal, setShowUniversalModal } from '@app/store/useExchangeStore.ts';
import { invoke } from '@tauri-apps/api/core';

interface XCOptionProps {
    content: Partial<ExchangeMinerAssets>;
    isCurrent?: boolean;
}

export const XCOption = ({ content, isCurrent = false }: XCOptionProps) => {
    const confirmExchangeMiner = async () => {
        const selectedExchangeMiner: Partial<ExchangeMiner> = {
            id: content.id,
            slug: content.slug,
            name: content.name,
        };
        await invoke('select_exchange_miner', { exchangeMiner: selectedExchangeMiner });
        setShowUniversalModal(false);
        setShowExchangeModal(true);
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
                {content.id && (
                    <OpenButton onClick={() => confirmExchangeMiner()}>
                        <ImgWrapper $border>
                            <ChevronSVG />
                        </ImgWrapper>
                    </OpenButton>
                )}
            </ContentWrapper>
        </Wrapper>
    );
};
