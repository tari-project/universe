import { ClaimButton, Gem1, Gem2, Gem3, GemsWrapper, Text, TextWrapper, Title, Wrapper } from './styles';
import gemLargeImage from '../../../../main/Airdrop/AirdropGiftTracker/images/gem.png';
import { useTranslation } from 'react-i18next';
import { useCallback, useEffect } from 'react';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useAirdropAuth } from '@app/containers/main/Airdrop/AirdropGiftTracker/hooks/useAirdropAuth';

export default function AirdropLogin() {
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const setAllowTelemetry = useAppConfigStore((s) => s.setAllowTelemetry);
    const { handleAuth, checkAuth } = useAirdropAuth();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const handleSubmit = useCallback(
        async (e: React.MouseEvent<HTMLButtonElement>) => {
            e.preventDefault();
            e.stopPropagation();
            await setAllowTelemetry(true);
            return handleAuth();
        },
        [handleAuth, setAllowTelemetry]
    );

    return (
        <Wrapper initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
            <GemsWrapper>
                <Gem1 src={gemLargeImage} alt="" />
                <Gem2 src={gemLargeImage} alt="" />
                <Gem3 src={gemLargeImage} alt="" />
            </GemsWrapper>

            <TextWrapper>
                <Title>{t('claimModalTitle')}</Title>
                <Text>{t('setupLoginText')}</Text>
            </TextWrapper>

            <ClaimButton onClick={handleSubmit}>
                <span>{t('claimGems')}</span>
            </ClaimButton>
        </Wrapper>
    );
}
