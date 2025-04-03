import { useAirdropStore } from '@app/store';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { useCallback } from 'react';

export interface WebsocketMessageType {
    event: string;
    data: unknown;
    signature?: string;
    pubKey?: string;
}

export default function useSendWsMessage() {
    const appWebview = getCurrentWebviewWindow();
    const airdropToken = useAirdropStore((s) => s.airdropTokens?.token);
    return useCallback(
        (message: WebsocketMessageType) => {
            if (airdropToken) {
                appWebview.emitTo('main', 'ws-tx', message);
            } else {
                console.error('cannot send ws message, user not logged in');
            }
        },
        [airdropToken, appWebview]
    );
}
