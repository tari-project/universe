import { useAirdropStore } from '@app/store';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { useHandleWsUserIdEvent } from './useHandleWsUserIdEvent';
import { WebsocketUserEvent } from '@app/types/ws';
import './useSendWsMessage'; // dummy import to bypass knip

export interface WebsocketEventType {
    event: string;
    data: unknown;
    signature?: string;
    pubKey?: string;
}

export default function useAirdropWebsocket() {
    const userId = useAirdropStore((s) => s.userDetails?.user?.id);
    const userEventHandler = useHandleWsUserIdEvent();

    useEffect(() => {
        const unlistenPromise = listen('ws-status-change', (event) => {
            console.info(`websocket status changed: `, event);
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, []);

    useEffect(() => {
        const unlistenPromise = listen<unknown>('ws-rx', (event) => {
            const payload: WebsocketEventType = event.payload as WebsocketEventType;
            // Handle both string and object data
            let data;
            try {
                data = typeof payload?.data === 'string' ? JSON.parse(payload.data) : payload?.data;
            } catch (error) {
                console.error('Failed to parse WebSocket data:', error);
                return;
            }
            if (payload.event === `${userId}`) {
                userEventHandler(data as WebsocketUserEvent);
            } else {
                console.warn(`unknown websocket user event ${payload.event}`);
            }
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [userEventHandler, userId]);
}
