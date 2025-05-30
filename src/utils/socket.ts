import { invoke } from '@tauri-apps/api/core';
import { listen, UnlistenFn } from '@tauri-apps/api/event';

let socketInitialised = false;
let unlistenWsStatusChange: UnlistenFn | null = null;

const setupWsStatusListener = async () => {
    if (unlistenWsStatusChange) {
        // Listener already set up
        return;
    }

    unlistenWsStatusChange = await listen<string>('ws-status-change', (event) => {
        if (event.payload === 'Connected' || event.payload === 'Reconnecting') {
            socketInitialised = true;
        }
        if (event.payload === 'Stopped') {
            socketInitialised = false;
        }
        console.info(`websocket status changed: `, event.payload);
    });
    console.info('WebSocket status listener initiated.');
};

const initialiseSocket = async () => {
    if (!socketInitialised) {
        await setupWsStatusListener(); // Ensure listener is set up once
        console.info(`connecting to websocket...`);
        invoke('websocket_connect').catch((e) => {
            console.error(e);
            socketInitialised = false;
        });
    }
};

function removeSocket() {
    if (socketInitialised) {
        console.info(`closing websocket connection...`);
        invoke('websocket_close').catch(console.error);
    }

    // Always clean up the listener when removing socket
    if (unlistenWsStatusChange) {
        unlistenWsStatusChange();
        unlistenWsStatusChange = null;
        console.info('WebSocket status listener unlistened.');
    }
}

export { socketInitialised, initialiseSocket, removeSocket };
