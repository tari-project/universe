import { useEffect } from 'react';

import setupLogger from '../utils/shared-logger';

import { airdropSetup } from '../store/actions/airdropStoreActions';
import { getMiningNetwork } from '../store/actions/miningStoreActions';

import useTauriEventsListener from '../hooks/app/useTauriEventsListener';
import { useDisableRefresh } from '../hooks/app/useDisableRefresh';
import { useDetectMode } from '../hooks/helpers/useDetectMode';
import { useProgressEventsListener } from '@app/hooks/app/useProgressEventsListener';
import { fetchBackendInMemoryConfig } from '@app/store/actions/appConfigStoreActions.ts';

// This component is used to initialise the app and listen for any events that need to be listened to
// Created as a separate component to avoid cluttering the main App component and unwanted re-renders

setupLogger();

export default function AppEffects() {
    useEffect(() => {
        async function initialize() {
            await fetchBackendInMemoryConfig();
            await getMiningNetwork();
            await airdropSetup();
        }
        void initialize();
    }, []);

    useDetectMode();
    useDisableRefresh();
    useTauriEventsListener();
    useProgressEventsListener();

    return null;
}
