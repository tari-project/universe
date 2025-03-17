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

function keepWebLockAlive() {
    if (navigator.locks) {
        navigator.locks.request('keep-alive-lock', { mode: 'exclusive' }, async (lock) => {
            console.log('WebLock acquired, preventing suspension');

            // Keep the lock alive indefinitely
            while (lock && document.visibilityState !== 'hidden') {
                await new Promise((resolve) => setTimeout(resolve, 10000)); // Refresh every 10 seconds
            }
        });
    } else {
        console.warn('Web Locks API not supported on this browser.');
    }
}

setupLogger();
export default function AppEffects() {
    // Call the function when the page loads
    if (typeof window !== 'undefined') {
        keepWebLockAlive();

        // Optional: Reacquire lock when coming back from background
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                keepWebLockAlive();
            }
        });
    }

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
