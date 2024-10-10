import { GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import { ClaimButton, GemPill, Image, Title, Wrapper } from './styles';
import { useCallback, useEffect, useState } from 'react';
import { open } from '@tauri-apps/api/shell';
import { v4 as uuidv4 } from 'uuid';
import ClaimModal from '../../components/Claimmodal/ClaimModal';
import { useTranslation } from 'react-i18next';
import gemImage from '../../images/gem.png';

export default function LoggedOut() {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const { referralQuestPoints, authUuid, setAuthUuid, setAirdropTokens, setUserPoints, backendInMemoryConfig } =
        useAirdropStore();

    const handleAuth = useCallback(
        (code?: string) => {
            const token = uuidv4();
            if (backendInMemoryConfig?.airdropTwitterAuthUrl) {
                setAuthUuid(token);
                open(
                    `${backendInMemoryConfig?.airdropTwitterAuthUrl}?tauri=${token}${code ? `&universeReferral=${code}` : ''}`
                );
            }
        },
        [backendInMemoryConfig?.airdropTwitterAuthUrl, setAuthUuid]
    );

    useEffect(() => {
        if (authUuid && backendInMemoryConfig?.airdropApiUrl) {
            const interval = setInterval(() => {
                if (authUuid) {
                    fetch(`${backendInMemoryConfig?.airdropApiUrl}/auth/twitter/get-token/${authUuid}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    })
                        .then((response) => response.json())
                        .then((data) => {
                            if (!data.error) {
                                clearInterval(interval);
                                setAirdropTokens(data);
                            }
                        });
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
    }, [authUuid, backendInMemoryConfig?.airdropApiUrl, setAirdropTokens, setAuthUuid, setUserPoints]);

    return (
        <>
            <Wrapper>
                <ClaimButton onClick={() => setModalIsOpen(true)}>
                    <Title>{t('claimGems')}</Title>

                    <GemPill>
                        {(referralQuestPoints?.pointsForClaimingReferral || GIFT_GEMS).toLocaleString()}
                        <Image src={gemImage} alt="" />
                    </GemPill>
                </ClaimButton>
            </Wrapper>
            {modalIsOpen && <ClaimModal onSubmit={handleAuth} onClose={() => setModalIsOpen(false)} />}
        </>
    );
}
