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
    return useCallback(
        (message: WebsocketMessageType) => {
            appWebview.emitTo('main', 'ws-tx', message);
        },
        [appWebview]
    );
}
