import { useEffect } from 'react';

import { useDetectMode, useDisableRefresh, useLangaugeResolver, useListenForExternalDependencies } from '@app/hooks';

import { fetchAppConfig, fetchAudioFeatureEnabled } from '../store/useAppConfigStore.ts';
import setupLogger from '../utils/shared-logger.ts';
import useListenForCriticalProblem from '@app/hooks/useListenForCriticalProblem.tsx';
import { setMiningNetwork } from '@app/store/miningStoreActions.ts';
import useTauriEventsListener from '@app/hooks/app/useTauriEventsListener.ts';
import { useListenForAppUpdated } from '@app/hooks/app/useListenForAppUpdated.ts';
import { initAnimationAudio } from '@app/store/useBlockchainVisualisationStore.ts';

// This component is used to initialise the app and listen for any events that need to be listened to
// Created as separate component to avoid cluttering the main App component and unwanted re-renders

setupLogger();
export default function AppEffects() {
    useDetectMode();
    useDisableRefresh();
    useLangaugeResolver();
    useListenForExternalDependencies();
    useListenForCriticalProblem();
    useTauriEventsListener();
    useListenForAppUpdated({ triggerEffect: true });

    useEffect(() => {
        async function initialize() {
            await fetchAppConfig();
            await fetchAudioFeatureEnabled();
            await setMiningNetwork();
            initAnimationAudio();
        }
        void initialize().catch((e) => console.error('Failed to initialize UI config: ', e));
    }, []);

    return null;
}
