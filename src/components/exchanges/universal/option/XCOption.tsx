import { ContentWrapper, Heading, Wrapper, XCContent } from '@app/components/exchanges/universal/option/styles.ts';
import { ExchangeMinerAssets } from '@app/types/exchange.ts';
import { ImgWrapper, OpenButton } from '../../commonStyles.ts';
import { ChevronSVG } from '@app/assets/icons/chevron.tsx';
import { setShowUniversalModal } from '@app/store/useExchangeStore.ts';
import { invoke } from '@tauri-apps/api/core';
import { fetchBackendInMemoryConfig } from '@app/store/actions/appConfigStoreActions.ts';

interface XCOptionProps {
    content: Partial<ExchangeMinerAssets>;
    isCurrent?: boolean;
}
export const XCOption = ({ content, isCurrent = false }: XCOptionProps) => {
    const confirmExchangeMiner = async () => {
        const selectedExchangeMiner = {
            id: content.id,
            slug: content.slug,
            name: content.name,
        };
        await invoke('user_selected_exchange', { exchangeMiner: selectedExchangeMiner });
        await fetchBackendInMemoryConfig();
        setShowUniversalModal(false);
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
