import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

let socketInitialised = false;
export const SUBSCRIBE_EVENT = 'subscribe-to-gem-updates';

listen<string>('ws-status-change', (event) => {
    if (event.payload === 'Connected' || event.payload === 'Reconnecting') {
        socketInitialised = true;
    }
    if (event.payload === 'Stopped') {
        socketInitialised = false;
    }
    console.info(`websocket status changed: event.payload`);
});

const initialiseSocket = () => {
    if (!socketInitialised) {
        console.info(`connecting to websocket`);
        invoke('websocket_connect').catch(console.error);
    }
};

function removeSocket() {
    if (socketInitialised) {
        console.info(`closing websocket connection`);
        invoke('websocket_close').catch(console.error);
    }
}
export { socketInitialised, initialiseSocket, removeSocket };
