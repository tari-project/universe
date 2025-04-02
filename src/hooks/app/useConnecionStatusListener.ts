import { useUIStore } from '@app/store';
import { setConnectionStatus } from '@app/store/actions/uiStoreActions';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { ResumingAllProcessesPayload } from './useListenForAppResuming';

export const useConnectionStatusListener = () => {
    const connectionStatus = useUIStore((state) => state.connectionStatus);
    useEffect(() => {
        const unlistenPromise = listen<boolean>('is_stuck', (event) => {
            if (connectionStatus === 'connected' && event.payload) setConnectionStatus('disconnected');
        });
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [connectionStatus]);

    useEffect(() => {
        const listener = listen('resuming-all-processes', ({ payload }: { payload: ResumingAllProcessesPayload }) => {
            if (!payload.is_resuming) {
                setConnectionStatus('connected');
            }
        });

        return () => {
            listener.then((unlisten) => unlisten());
        };
    }, []);
};
