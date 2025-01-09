import { useEffect } from 'react';
import { initSystray } from '@app/utils';

import { useDetectMode, useDisableRefresh, useLangaugeResolver, useListenForExternalDependencies } from '@app/hooks';

import { useAppConfigStore } from '../store/useAppConfigStore.ts';
import setupLogger from '../utils/shared-logger.ts';
import App from './App.tsx';
import useListenForCriticalProblem from '@app/hooks/useListenForCriticalProblem.tsx';
import { useMiningStore } from '@app/store/useMiningStore.ts';
import { fetchBackendInMemoryConfig } from '@app/store/useAirdropStore.ts';
import { handleRefreshAirdropTokens } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh.ts';

// FOR ANYTHING THAT NEEDS TO BE INITIALISED

setupLogger();

export default function AppWrapper() {
    const fetchAppConfig = useAppConfigStore((s) => s.fetchAppConfig);
    const setMiningNetwork = useMiningStore((s) => s.setMiningNetwork);

    useDetectMode();
    useDisableRefresh();
    useLangaugeResolver();
    useListenForExternalDependencies();
    useListenForCriticalProblem();

    useEffect(() => {
        async function initialize() {
            await fetchAppConfig();
            const beConfig = await fetchBackendInMemoryConfig();
            if (beConfig?.airdropUrl) {
                console.debug(`beConfig.airdropUrl= ${beConfig.airdropUrl}`);
                await handleRefreshAirdropTokens(beConfig.airdropUrl, true);
            }
            await initSystray();
            await setMiningNetwork();
        }
        void initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <App />;
}
