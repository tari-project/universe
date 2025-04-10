import { useAirdropStore, useAppStateStore } from '@app/store';
import { listen } from '@tauri-apps/api/event';
import { useCallback, useEffect } from 'react';
import { useHandleWsUserIdEvent } from './useHandleWsUserIdEvent';
import { GLOBAL_EVENT_NAME, WebsocketGlobalEvent, WebsocketUserEvent } from '@app/types/ws';
import { useHandleWsGlobalEvent } from './useHandleWsGlobalEvent';
import './useSendWsMessage'; // dummy import to bypass knip
import { initialiseSocket } from '@app/utils/socket';

export interface WebsocketEventType {
    event: string;
    data: unknown;
    signature?: string;
    pubKey?: string;
}

function useSetupWebsocket() {
    const airdropTokens = useAirdropStore((s) => s.airdropTokens);
    const airdropApiUrl = useAirdropStore((s) => s.backendInMemoryConfig?.airdropApiUrl);

    return useCallback(() => {
        if (airdropApiUrl && airdropTokens) {
            initialiseSocket();
        }
    }, [airdropApiUrl, airdropTokens]);
}

export default function useAirdropWebsocket() {
    const userId = useAirdropStore((s) => s.userDetails?.user?.id);
    const userEventHandler = useHandleWsUserIdEvent();
    const globalEventHandler = useHandleWsGlobalEvent();
    const startWebsocket = useSetupWebsocket();
    const setupComplete = useAppStateStore((s) => s.setupComplete);

    useEffect(() => {
        if (setupComplete) {
            startWebsocket();
        }
    }, [startWebsocket, setupComplete]);

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
    }, [globalEventHandler, userEventHandler, userId]);
}
