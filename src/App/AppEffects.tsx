import { useEffect, useRef } from 'react';

import setupLogger from '../utils/shared-logger';

import { airdropSetup } from '../store/actions/airdropStoreActions';
import { getMiningNetwork } from '../store/actions/miningStoreActions';

import useTauriEventsListener from '../hooks/app/useTauriEventsListener';
import { useDisableRefresh } from '../hooks/app/useDisableRefresh';
import { useDetectMode } from '../hooks/helpers/useDetectMode';
import { fetchBackendInMemoryConfig } from '@app/store/actions/appConfigStoreActions.ts';
import { fetchBridgeColdWalletAddress } from '@app/store/actions/bridgeApiActions';
import { queryClient } from '@app/App/queryClient.ts';
import useMiningTime from '@app/hooks/app/useMiningTime.ts';

// This component is used to initialise the app and listen for any events that need to be listened to
// Created as a separate component to avoid cluttering the main App component and unwanted re-renders

setupLogger();

export default function AppEffects() {
    const initializationRef = useRef(false);

    useEffect(() => {
        if (initializationRef.current) return;
        initializationRef.current = true;
        async function initialize() {
            await fetchBackendInMemoryConfig();
            await getMiningNetwork();
            await airdropSetup();
            await fetchBridgeColdWalletAddress();
            await queryClient.prefetchQuery({ queryKey: ['surveys', 'close'] }); // need this preloaded
        }
        void initialize();
    }, []);

    useMiningTime();
    useDetectMode();
    useDisableRefresh();
    useTauriEventsListener();
    return null;
}
