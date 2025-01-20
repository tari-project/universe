import { useEffect } from 'react';
import { initSystray } from '@app/utils';

import { useDetectMode, useDisableRefresh, useLangaugeResolver, useListenForExternalDependencies } from '@app/hooks';

import { fetchAppConfig } from '../store/useAppConfigStore.ts';
import setupLogger from '../utils/shared-logger.ts';
import useListenForCriticalProblem from '@app/hooks/useListenForCriticalProblem.tsx';
import { setMiningNetwork } from '@app/store/miningStoreActions.ts';
import App from './App.tsx';

// FOR ANYTHING THAT NEEDS TO BE INITIALISED

setupLogger();
export default function AppWrapper() {
    useDetectMode();
    useDisableRefresh();
    useLangaugeResolver();
    useListenForExternalDependencies();
    useListenForCriticalProblem();

    useEffect(() => {
        async function initialize() {
            await fetchAppConfig();
            await initSystray();
            await setMiningNetwork();
        }
        void initialize();
    }, []);

    return <App />;
}
