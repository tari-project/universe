import { useEffect } from 'react';

import { useDetectMode, useDisableRefresh, useLangaugeResolver, useListenForExternalDependencies } from '@app/hooks';

import { fetchAppConfig } from '../store/useAppConfigStore.ts';
import setupLogger from '../utils/shared-logger.ts';
import useListenForCriticalProblem from '@app/hooks/useListenForCriticalProblem.tsx';
import { setMiningNetwork } from '@app/store/miningStoreActions.ts';
import useTauriEventsListener from '@app/hooks/app/useTauriEventsListener.ts';
import { useListenForAppUpdated } from '@app/hooks/app/useListenForAppUpdated.ts';
import { useListenForAppResuming } from '@app/hooks/app/useListenForAppResuming.ts';

// This component is used to initialise the app and listen for any events that need to be listened to
// Created as separate component to avoid cluttering the main App component and unwanted re-renders

setupLogger();
export default function AppEffects() {
    useEffect(() => {
        async function initialize() {
            await fetchAppConfig();
            await setMiningNetwork();
        }
        void initialize();
    }, []);

    useDetectMode();
    useDisableRefresh();
    useLangaugeResolver();
    useListenForExternalDependencies();
    useListenForCriticalProblem();
    useTauriEventsListener();
    useListenForAppUpdated({ triggerEffect: true });
    useListenForAppResuming();

    return null;
}
