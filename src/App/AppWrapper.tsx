import { useEffect } from 'react';

import { useDetectMode, useDisableRefresh, useLangaugeResolver, useListenForExternalDependencies } from '@app/hooks';

import { fetchAppConfig } from '../store/useAppConfigStore.ts';
import setupLogger from '../utils/shared-logger.ts';
import useListenForCriticalProblem from '@app/hooks/useListenForCriticalProblem.tsx';
import { setMiningNetwork } from '@app/store/miningStoreActions.ts';
import App from './App.tsx';
import useTauriEventsListener from '@app/hooks/app/useTauriEventsListener.ts';

// FOR ANYTHING THAT NEEDS TO BE INITIALISED

setupLogger();
export default function AppWrapper() {
    useDetectMode();
    useDisableRefresh();
    useLangaugeResolver();
    useListenForExternalDependencies();
    useListenForCriticalProblem();
    useTauriEventsListener();

    useEffect(() => {
        async function initialize() {
            await fetchAppConfig();
            await setMiningNetwork();
        }
        void initialize();
    }, []);

    return <App />;
}
