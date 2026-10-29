import { useAirdropStore } from '@app/store';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { useHandleWsUserIdEvent } from './useHandleWsUserIdEvent';
import { GLOBAL_EVENT_NAME, WebsocketGlobalEvent, WebsocketUserEvent } from '@app/types/ws';
import { useHandleWsGlobalEvent } from './useHandleWsGlobalEvent';
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
    const globalEventHandler = useHandleWsGlobalEvent();

    useEffect(() => {
        let cancelled = false;
        let unlistenFn: UnlistenFn | null = null;

        listen('ws-status-change', (event) => {
            if (cancelled) return;
            console.info('websocket status changed:', event.payload);
        }).then((unlisten) => {
            if (cancelled) {
                unlisten();
            } else {
                unlistenFn = unlisten;
            }
        });

        return () => {
            cancelled = true;
            unlistenFn?.();
        };
    }, []);

    useEffect(() => {
        let cancelled = false;
        let unlistenFn: UnlistenFn | null = null;

        listen<unknown>('ws-rx', (event) => {
            if (cancelled) return;
            const payload: WebsocketEventType = event.payload as WebsocketEventType;
            // Handle both string and object data
            let data;
            try {
                data = typeof payload?.data === 'string' ? JSON.parse(payload.data) : payload?.data;
            } catch (error) {
                console.error('Failed to parse WebSocket data:', error);
                return;
            }
            switch (payload.event) {
                case GLOBAL_EVENT_NAME: {
                    globalEventHandler(data as WebsocketGlobalEvent);
                    break;
                }
                case `${userId}`: {
                    userEventHandler(data as WebsocketUserEvent);
                    break;
                }
                default: {
                    console.warn(`unknown websocket user event ${payload.event}`);
                    break;
                }
            }
        }).then((unlisten) => {
            if (cancelled) {
                unlisten();
            } else {
                unlistenFn = unlisten;
            }
        });

        return () => {
            cancelled = true;
            unlistenFn?.();
        };
    }, [globalEventHandler, userEventHandler, userId]);
}
