import { fetchBackendInMemoryConfig, getExistingTokens } from '@app/store/useAirdropStore';
import { useEffect, useRef } from 'react';
import { handleRefreshAirdropTokens } from '../airdrop/stateHelpers/useAirdropTokensRefresh';
import { useAppStateStore } from '@app/store/appStateStore';

export function useUserSetup() {
    const beConfigSet = useRef(false);
    const mmProxyVersion = useAppStateStore((s) => s.applications_versions?.mm_proxy);

    useEffect(() => {
        async function initWithToken() {
            const beConfig = await fetchBackendInMemoryConfig();
            await getExistingTokens();
            if (beConfig?.airdropUrl) {
                await handleRefreshAirdropTokens(beConfig.airdropUrl);
            }
        }
        if (mmProxyVersion && !beConfigSet.current) {
            initWithToken();
            beConfigSet.current = true;
        }
    }, [mmProxyVersion]);
}
