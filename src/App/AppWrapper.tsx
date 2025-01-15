import { useEffect } from 'react';
import { initSystray } from '@app/utils';

import { useDetectMode, useDisableRefresh, useLangaugeResolver, useListenForExternalDependencies } from '@app/hooks';

import { useAppConfigStore } from '../store/useAppConfigStore.ts';
import setupLogger from '../utils/shared-logger.ts';
import App from './App.tsx';
import useListenForCriticalProblem from '@app/hooks/useListenForCriticalProblem.tsx';
import { useMiningStore } from '@app/store/useMiningStore.ts';

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
            await initSystray();
            await setMiningNetwork();
        }
        initialize();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <App />;
}
