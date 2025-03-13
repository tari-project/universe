import { useCallback, useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';
import { v4 as uuidv4 } from 'uuid';
import { useTranslation } from 'react-i18next';
import { GIFT_GEMS, useAirdropStore } from '@app/store/useAirdropStore';
import { setAuthUuid } from '@app/store/actions/airdropStoreActions';
import { ClaimButton, GemPill, Image, Title, Wrapper } from './styles';
import gemImage from '../../images/gem.png';
import useFetchAirdropToken from '@app/hooks/airdrop/stateHelpers/useFetchAirdropToken.ts';
import { setAllowTelemetry, useAppConfigStore } from '@app/store';
import { useCopyToClipboard } from '@app/hooks';

export default function LoggedOut() {
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const [linkOpened, setLinkOpened] = useState(false);
    const [copying, setCopying] = useState(false);
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const { referralQuestPoints, airdropUrl } = useAirdropStore((s) => ({
        referralQuestPoints: s.referralQuestPoints,
        authUuid: s.authUuid,
        airdropUrl: s.backendInMemoryConfig?.airdropUrl,
    }));

    useFetchAirdropToken({ canListen: linkOpened });

    const handleAuth = useCallback(
        async (code?: string) => {
            const token = uuidv4();
            if (!allowTelemetry) {
                await setAllowTelemetry(true);
            }
            if (airdropUrl) {
                setAuthUuid(token);
                open(`${airdropUrl}/auth?tauri=${token}${code ? `&universeReferral=${code}` : ''}`).then(() => {
                    setLinkOpened(true);
                });
            }
        },
        [airdropUrl, allowTelemetry]
    );

    const handleRightClick = useCallback(
        async (e, code?: string) => {
            e.preventDefault();
            setCopying(true);

            const token = uuidv4();
            if (!allowTelemetry) {
                await setAllowTelemetry(true);
            }

            if (airdropUrl) {
                setAuthUuid(token);
                const url = `${airdropUrl}/auth?tauri=${token}${code ? `&universeReferral=${code}` : ''}`;
                copyToClipboard(url);
                setCopying(false);
            }
        },
        [airdropUrl, allowTelemetry, copyToClipboard]
    );

    const gemsValue = (referralQuestPoints?.pointsForClaimingReferral || GIFT_GEMS).toLocaleString();

    return (
        <Wrapper>
            <ClaimButton onClick={() => handleAuth()} onContextMenu={(e) => handleRightClick(e)}>
                <Title>{copying ? t('copying') : isCopied ? t('copied') : t('joinAirdrop')}</Title>

                <GemPill>
                    {gemsValue}
                    <Image src={gemImage} alt="" />
                </GemPill>
            </ClaimButton>
        </Wrapper>
    );
}
