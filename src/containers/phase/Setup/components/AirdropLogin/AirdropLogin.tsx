/* eslint-disable i18next/no-literal-string */
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

    const handleSubmit = useCallback(async () => {
        await setAllowTelemetry(true);
        return handleAuth();
    }, [handleAuth, setAllowTelemetry]);

    return (
        <Wrapper>
            <GemsWrapper>
                <Gem1 src={gemLargeImage} alt="" />
                <Gem2 src={gemLargeImage} alt="" />
                <Gem3 src={gemLargeImage} alt="" />
            </GemsWrapper>

            <TextWrapper>
                <Title>{t('claimModalTitle')}</Title>

                <Text>
                    Earn gems while mining to increase your airdrop reward during testnet! Connect your airdrop account
                    to start earning.
                </Text>
            </TextWrapper>

            <ClaimButton onClick={handleSubmit}>{t('claimGems')}</ClaimButton>
        </Wrapper>
    );
}
