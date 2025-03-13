import { useEffect } from 'react';
import setupLogger from '../utils/shared-logger.ts';
import useTauriEventsListener from '../hooks/app/useTauriEventsListener.ts';
import useListenForCriticalProblem from '../hooks/useListenForCriticalProblem.tsx';
import { useListenForAppUpdated } from '../hooks/app/useListenForAppUpdated.ts';
import { setMiningNetwork } from '../store/actions/miningStoreActions.ts';
import { useListenForAppResuming } from '../hooks/app/useListenForAppResuming.ts';
import { useDetectMode, useDisableRefresh, useListenForExternalDependencies, useSetUp } from '../hooks';
import { invoke } from '@tauri-apps/api/core';

// This component is used to initialise the app and listen for any events that need to be listened to
// Created as separate component to avoid cluttering the main App component and unwanted re-renders

setupLogger();
export default function AppEffects() {
    useEffect(() => {
        async function initialize() {
            await setMiningNetwork();
            await invoke('frontend_ready')
                .then(() => {
                    console.info('Successfully called frontend_ready');
                })
                .catch((e) => {
                    console.error('Failed to call frontend_ready: ', e);
                });
        }
        void initialize();
    }, []);

    useSetUp();
    useDetectMode();
    useDisableRefresh();
    useListenForExternalDependencies();
    useListenForCriticalProblem();
    useTauriEventsListener();
    useListenForAppUpdated({ triggerEffect: true });
    useListenForAppResuming();

    return null;
}
