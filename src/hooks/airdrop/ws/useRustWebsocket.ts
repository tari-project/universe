import { useAirdropStore } from '@app/store';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { useHandleWsUserIdEvent } from './useHandleWsUserIdEvent';
import { WebsocketGlobalEvent, WebsocketUserEvent } from '@app/types/ws';
import { useHandleWsGlobalEvent } from './useHandleWsGlobalEvent';
import useSendWsMessage from './useSendWsMessage';
import { SUBSCRIBE_EVENT } from '@app/utils/socket';

export interface WebsocketEventType {
    event: string;
    data: unknown;
    signature?: string;
    pubKey?: string;
}

const AUTH_EVENT = 'auth';

export default function useAirdropWebsocket() {
    const userId = useAirdropStore((s) => s.userDetails?.user?.id);
    const userEventHandler = useHandleWsUserIdEvent();
    const globalEventHandler = useHandleWsGlobalEvent();
    const airdropToken = useAirdropStore((s) => s.airdropTokens?.token);
    const sendWsMessage = useSendWsMessage();

    useEffect(() => {
        listen('ws-status-change', (event) => {
            if ((event.payload as string) === 'Connected') {
                if (airdropToken) {
                    const authMessage = {
                        event: AUTH_EVENT,
                        data: airdropToken,
                    };
                    sendWsMessage(authMessage);
                    const subscribeToGemUpdatesMessage = {
                        event: SUBSCRIBE_EVENT,
                        data: undefined,
                    };
                    sendWsMessage(subscribeToGemUpdatesMessage);
                }
            }
            console.log(`websocket status changed: ${event}`);
        });
    }, [airdropToken, sendWsMessage]);

    useEffect(() => {
        if (airdropToken) {
            const authMessage = {
                event: AUTH_EVENT,
                data: airdropToken,
            };
            sendWsMessage(authMessage);
            const subscribeToGemUpdatesMessage = {
                event: SUBSCRIBE_EVENT,
                data: undefined,
            };
            sendWsMessage(subscribeToGemUpdatesMessage);
        }
    }, [airdropToken, sendWsMessage]);

    useEffect(() => {
        listen<any>('ws-rx', (event) => {
            console.log(`------------WS EVENT----`, event);

            const payload: WebsocketEventType = event.payload;
            const data = payload?.data;
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
