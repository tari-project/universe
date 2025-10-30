import { v4 as uuidv4 } from 'uuid';
import { useCallback, useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';

import { useCopyToClipboard } from '@app/hooks/helpers/useCopyToClipboard.ts';
import { setAuthUuid, useAirdropStore } from '@app/store';
import useFetchAirdropToken from '../stateHelpers/useFetchAirdropToken.ts';
import { setAllowTelemetry } from '@app/store/actions/config/core.ts';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';

export function useAirdropAuth() {
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    const allowTelemetry = useConfigCoreStore((s) => s.allow_telemetry);
    const airdropUrl = useAirdropStore((s) => s.backendInMemoryConfig?.airdrop_url);

    const [linkOpened, setLinkOpened] = useState(false);

    useFetchAirdropToken({ canListen: linkOpened });

    const prepareAirdropLink = useCallback(
        async (claimCode?: string) => {
            const token = uuidv4();
            if (!allowTelemetry) {
                await setAllowTelemetry(true);
            }
            if (airdropUrl) {
                setAuthUuid(token);
                return `${airdropUrl}/auth?tauri=${token}${claimCode ? `&universeReferral=${claimCode}` : ''}`;
            }
            return null;
        },
        [airdropUrl, allowTelemetry]
    );

    const handleAuth = useCallback(
        async (claimCode?: string) => {
            const url = await prepareAirdropLink(claimCode);
            if (url) {
                try {
                    await open(url);
                } catch (e) {
                    copyToClipboard(url);
                    console.error('Airdrop auth URL error: ', e);
                } finally {
                    setLinkOpened(true);
                }
            }
        },
        [copyToClipboard, prepareAirdropLink]
    );

    return { authUrlCopied: isCopied, handleAuth };
}
