import { useEffect } from 'react';
import setupLogger from '../utils/shared-logger.ts';
import useTauriEventsListener from '../hooks/app/useTauriEventsListener.ts';
import useListenForCriticalProblem from '../hooks/useListenForCriticalProblem.tsx';
import { useListenForAppUpdated } from '../hooks/app/useListenForAppUpdated.ts';
import { setMiningNetwork } from '../store/actions/miningStoreActions.ts';
import { fetchAppConfig } from '../store/actions/appConfigStoreActions.ts';
import { useListenForGpuEngines } from '../hooks/app/useListenForGpuEngines.ts';
import { useListenForAppResuming } from '../hooks/app/useListenForAppResuming.ts';
import {
    useDetectMode,
    useDisableRefresh,
    useLangaugeResolver,
    useListenForExternalDependencies,
    useSetUp,
} from '../hooks';

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

    useSetUp();
    useDetectMode();
    useDisableRefresh();
    useLangaugeResolver();
    useListenForExternalDependencies();
    useListenForCriticalProblem();
    useTauriEventsListener();
    useListenForAppUpdated({ triggerEffect: true });
    useListenForAppResuming();
    useListenForGpuEngines();

    return null;
}
