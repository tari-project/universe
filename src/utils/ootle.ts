import { ActiveTapplet, DevTapplet, TappletConfig } from '@app/types/tapplets/tapplet.types';

export function isHttpOrLocalhost(s: string): boolean {
    try {
        const url = new URL(s);
        const scheme = url.protocol.replace(':', '');
        if (scheme === 'http' || scheme === 'https') {
            return true;
        }
    } catch {
        // If parsing fails, ignore and continue to string check
    }

    const sLower = s.toLowerCase();
    return sLower.includes('localhost') || sLower.includes('http') || sLower.includes('https');
}

// interface Tapplet {
//     id: string;
//     endpoint: string;
//     display_name: string;
// }

// interface TappletConfig {
//     version: string;
//     permissions: string[];
//     supportedChain: string;
// }

// interface ActiveTapplet {
//     tapplet_id: string;
//     version: string;
//     display_name: string;
//     source: string;
//     permissions: string[];
//     supportedChain: string;
// }

const TAPPLET_CONFIG_FILE = 'config.json'; // Adjust filename if needed

export async function fetchActiveTapplet(tapplet: DevTapplet): Promise<ActiveTapplet | undefined> {
    const url = `${tapplet.endpoint}/${TAPPLET_CONFIG_FILE}`;
    console.info('Dev Tapplet fetch url: ', url);

    try {
        const resp = await fetch(url, { method: 'GET' });
        console.info('Dev Tapplet fetch resp: ', resp);

        if (!resp.ok) return;

        const config: TappletConfig = await resp.json();
        console.info('Dev Tapplet config', config);

        if (!config) return;

        const activeTapplet: ActiveTapplet = {
            tapplet_id: tapplet.id,
            packageName: tapplet.package_name,
            version: config.version,
            displayName: tapplet.displayName,
            source: tapplet.endpoint,
            permissions: config.permissions,
            supportedChain: config.supportedChain,
        };

        return activeTapplet;
    } catch (error) {
        console.error('Failed to fetch tapplet config:', error);
        return;
    }
}
