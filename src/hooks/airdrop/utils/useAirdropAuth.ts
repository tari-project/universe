import { v4 as uuidv4 } from 'uuid';
import { useCallback, useState } from 'react';
import { open } from '@tauri-apps/plugin-shell';

import { useCopyToClipboard } from '@app/hooks';
import { setAllowTelemetry, setAuthUuid, useAirdropStore, useConfigCoreStore } from '@app/store';
import useFetchAirdropToken from '../stateHelpers/useFetchAirdropToken.ts';

export function useAirdropAuth() {
    const { isCopied, copyToClipboard } = useCopyToClipboard();
    const allowTelemetry = useConfigCoreStore((s) => s.allow_telemetry);
    const airdropUrl = useAirdropStore((s) => s.backendInMemoryConfig?.airdropUrl);

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
