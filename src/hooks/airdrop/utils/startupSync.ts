import { listen, UnlistenFn } from '@tauri-apps/api/event';

let tokensReadyPromise: Promise<void> | null = null;
let tokensReady = false;

/**
 * Wait for the backend to finish token initialization
 * Returns immediately if tokens are already ready
 */
export async function waitForTokensReady(): Promise<void> {
    if (tokensReady) {
        return Promise.resolve();
    }

    if (tokensReadyPromise) {
        return tokensReadyPromise;
    }

    console.info('Waiting for tokens-ready event from backend...');

    tokensReadyPromise = new Promise<void>((resolve) => {
        let unlisten: UnlistenFn | null = null;

        const setupListener = async () => {
            try {
                unlisten = await listen('tokens-ready', (event) => {
                    console.info('Received tokens-ready event:', event.payload);
                    tokensReady = true;
                    tokensReadyPromise = null;
                    if (unlisten) {
                        unlisten();
                    }
                    resolve();
                });
            } catch (error) {
                console.error('Failed to set up tokens-ready listener:', error);
                // Fallback: just resolve after a short delay to prevent hanging
                setTimeout(() => {
                    tokensReady = true;
                    tokensReadyPromise = null;
                    resolve();
                }, 100);
            }
        };

        setupListener();

        // Timeout fallback in case event never comes
        setTimeout(() => {
            if (!tokensReady) {
                console.warn('tokens-ready event timeout, proceeding anyway');
                tokensReady = true;
                tokensReadyPromise = null;
                if (unlisten) {
                    unlisten();
                }
                resolve();
            }
        }, 5000); // 5 second timeout
    });

    return tokensReadyPromise;
}

/**
 * Check if tokens are ready without waiting
 */
export function areTokensReady(): boolean {
    return tokensReady;
}

/**
 * Mark tokens as ready (for testing or manual initialization)
 */
export function markTokensReady(): void {
    tokensReady = true;
    tokensReadyPromise = null;
}

/**
 * Reset the ready state (for testing)
 */
export function resetTokensReady(): void {
    tokensReady = false;
    tokensReadyPromise = null;
}
