import { useEffect } from 'react';

import { useDetectMode, useDisableRefresh, useLangaugeResolver, useListenForExternalDependencies } from '@app/hooks';

import { fetchAppConfig } from '../store/useAppConfigStore.ts';
import setupLogger from '../utils/shared-logger.ts';
import useListenForCriticalProblem from '@app/hooks/useListenForCriticalProblem.tsx';
import { setMiningNetwork } from '@app/store/miningStoreActions.ts';
import App from './App.tsx';
import { emit } from '@tauri-apps/api/event';

// FOR ANYTHING THAT NEEDS TO BE INITIALISED

setupLogger();
async function emitReady() {
    await emit('frontend_ready');
}
export default function AppWrapper() {
    void emitReady();

    useDetectMode();
    useDisableRefresh();
    useLangaugeResolver();
    useListenForExternalDependencies();
    useListenForCriticalProblem();

    useEffect(() => {
        async function initialize() {
            await fetchAppConfig();
            await setMiningNetwork();
        }
        void initialize();
    }, []);

    return <App />;
}
