import { useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

import setupLogger from '../utils/shared-logger';

import { airdropSetup } from '../store/actions/airdropStoreActions';
import { setMiningNetwork } from '../store/actions/miningStoreActions';

import useTauriEventsListener from '../hooks/app/useTauriEventsListener';
import { useDisableRefresh } from '../hooks/app/useDisableRefresh';
import { useDetectMode } from '../hooks/helpers/useDetectMode';

// This component is used to initialise the app and listen for any events that need to be listened to
// Created as separate component to avoid cluttering the main App component and unwanted re-renders

setupLogger();

export default function AppEffects() {
    useEffect(() => {
        async function initialize() {
            await setMiningNetwork();
            await airdropSetup();
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

    useDetectMode();
    useDisableRefresh();
    useTauriEventsListener();

    return null;
}
