import {
    CaptionText,
    CaptionWrapper,
    ContentBodyWrapper,
    ContentHeaderWrapper,
    Heading,
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
import { useCallback, useState } from 'react';
import AddressEditor from '@app/containers/floating/Settings/sections/wallet/components/AddressEditor.tsx';

interface XCOptionProps {
    content: ExchangeMinerAssets;
    isCurrent?: boolean;
}

export const XCOption = ({ content, isCurrent = false }: XCOptionProps) => {
    const { t } = useTranslation('exchange', { useSuspense: false });
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

    const validateAddress = useCallback(async (value: string) => {
        try {
            await invoke('verify_address_for_send', { address: value });
            return true;
        } catch (_) {
            return false;
        }
    }, []);

    const validationRules = {
        validate: async (value) => {
            const isValid = await validateAddress(value);

            return isValid || 'Invalid address format';
        },
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
                <AddressEditor initialAddress={'test'} onApply={confirmExchangeMiner} rules={validationRules} />
            </ContentBodyWrapper>
        </Wrapper>
    );
};
