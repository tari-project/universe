import { useUIStore } from '@app/store';
import { setConnectionStatus, setIsReconnecting } from '@app/store/actions/uiStoreActions';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { ResumingAllProcessesPayload } from './useListenForAppResuming';

export type ConnectionStatusPayload = 'InProgress' | 'Succeed' | 'Failed';

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
        const resumingProcessesListener = listen(
            'resuming-all-processes',
            ({ payload }: { payload: ResumingAllProcessesPayload }) => {
                if (!payload.is_resuming) {
                    setConnectionStatus('connected');
                }
            }
        );
        const reconnectingListener = listen('reconnecting', ({ payload }: { payload: ConnectionStatusPayload }) => {
            if (payload === 'InProgress') {
                setIsReconnecting(true);
            } else if (payload === 'Succeed') {
                setIsReconnecting(false);
                setConnectionStatus('connected');
            } else if (payload === 'Failed') {
                setIsReconnecting(false);
            }
        });

        return () => {
            resumingProcessesListener.then((unlisten) => unlisten());
            reconnectingListener.then((unlisten) => unlisten());
        };
    }, []);
};
