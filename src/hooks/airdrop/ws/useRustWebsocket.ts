import { useAirdropStore } from '@app/store';
import { listen } from '@tauri-apps/api/event';
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
        });

        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [globalEventHandler, userEventHandler, userId]);
}
