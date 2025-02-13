import { AirdropTokens, GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import { ClaimButton, GemPill, Image, Title, Wrapper } from './styles';
import { useCallback, useEffect } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import gemImage from '../../images/gem.png';
import { setAirdropTokens, setAuthUuid, setFlareAnimationType } from '@app/store';
import { useGetAirdropUserDetails } from '@app/hooks/airdrop/stateHelpers/useGetAirdropUserDetails.ts';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';

export default function LoggedOut() {
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const fetchUserData = useGetAirdropUserDetails();
    const { referralQuestPoints, authUuid, backendInMemoryConfig } = useAirdropStore((s) => ({
        referralQuestPoints: s.referralQuestPoints,
        authUuid: s.authUuid,
        backendInMemoryConfig: s.backendInMemoryConfig,
    }));

    const handleAuth = useCallback(
        (code?: string) => {
            const token = uuidv4();
            if (backendInMemoryConfig?.airdropUrl) {
                setAuthUuid(token);
                void open(
                    `${backendInMemoryConfig?.airdropUrl}/auth?tauri=${token}${code ? `&universeReferral=${code}` : ''}`
                );
            }
        },

        [backendInMemoryConfig?.airdropUrl]
    );

    useEffect(() => {
        if (authUuid && backendInMemoryConfig?.airdropApiUrl) {
            const interval = setInterval(async () => {
                if (authUuid) {
                    try {
                        const tokenResponse = await handleAirdropRequest<AirdropTokens>({
                            path: `/auth/get-token/${authUuid}`,
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });

                        console.debug(tokenResponse);
                        if (tokenResponse) {
                            clearInterval(interval);
                            await setAirdropTokens(tokenResponse);
                            await fetchUserData();

                            if (tokenResponse.installReward) {
                                setFlareAnimationType('FriendAccepted');
                            }
                        }
                    } catch (e) {
                        console.error('fetch airdrop token error: ', e);
                    }
                }
            }, 1000);
            const timeout = setTimeout(
                () => {
                    clearInterval(interval);
                    setAuthUuid('');
                },
                1000 * 60 * 5
            );

            return () => {
                clearInterval(interval);
                clearTimeout(timeout);
            };
        }
    }, [authUuid, backendInMemoryConfig?.airdropApiUrl, fetchUserData]);

    const gemsValue = (referralQuestPoints?.pointsForClaimingReferral || GIFT_GEMS).toLocaleString();

    return (
        <Wrapper>
            <ClaimButton onClick={() => handleAuth()}>
                <Title>{t('joinAirdrop')}</Title>

                <GemPill>
                    {gemsValue}
                    <Image src={gemImage} alt="" />
                </GemPill>
            </ClaimButton>
        </Wrapper>
    );
}
