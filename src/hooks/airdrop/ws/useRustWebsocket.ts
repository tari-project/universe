import { useAirdropStore } from '@app/store';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { useHandleWsUserIdEvent } from './useHandleWsUserIdEvent';
import { WebsocketGlobalEvent, WebsocketUserEvent } from '@app/types/ws';
import { useHandleWsGlobalEvent } from './useHandleWsGlobalEvent';

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
        listen('ws-status-change', (event) => {
            console.info(`websocket status changed: ${event}`);
        });
    }, []);

    useEffect(() => {
        listen<unknown>('ws-rx', (event) => {
            const payload: WebsocketEventType = event.payload as WebsocketEventType;
            const data = JSON.parse(payload?.data as string);
            switch (payload.event) {
                case 'global-event': {
                    const data = payload.data;
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
    }, [globalEventHandler, userEventHandler, userId]);
}
