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

export default function LoggedOut() {
    const { t } = useTranslation(['airdrop'], { useSuspense: false });
    const [linkOpened, setLinkOpened] = useState(false);
    const allowTelemetry = useAppConfigStore((s) => s.allow_telemetry);
    const airdropUrl = useAirdropStore((s) => s.backendInMemoryConfig?.airdropUrl);

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

    const gemsValue = GIFT_GEMS.toLocaleString();

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
