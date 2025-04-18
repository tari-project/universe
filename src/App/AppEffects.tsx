import { useEffect } from 'react';

import setupLogger from '../utils/shared-logger';

import { airdropSetup } from '../store/actions/airdropStoreActions';
import { setMiningNetwork } from '../store/actions/miningStoreActions';

import useTauriEventsListener from '../hooks/app/useTauriEventsListener';
import { useDisableRefresh } from '../hooks/app/useDisableRefresh';
import { useDetectMode } from '../hooks/helpers/useDetectMode';
import { useProgressEventsListener } from '@app/hooks/app/useProgressEventsListener';
import { useConnectionStatusListener } from '@app/hooks/app/useConnecionStatusListener.ts';

// This component is used to initialise the app and listen for any events that need to be listened to
// Created as separate component to avoid cluttering the main App component and unwanted re-renders

setupLogger();

export default function AppEffects() {
    useEffect(() => {
        async function initialize() {
            await setMiningNetwork();
            await airdropSetup();
        }
        void initialize();
    }, []);

    useDetectMode();
    useDisableRefresh();
    useTauriEventsListener();
    useConnectionStatusListener();
    useProgressEventsListener();

    return null;
}
