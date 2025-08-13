import { ActiveTapplet, DevTapplet, TappletConfig } from '@app/types/tapplets/tapplet.types';
const TAPPLET_CONFIG_FILE = 'tapplet.config.json'; // Adjust filename if needed

export function isHttpOrLocalhost(s: string): boolean {
    try {
        const sLower = s.toLowerCase();
        if (sLower.startsWith('http://') || sLower.startsWith('https://') || sLower.includes('localhost')) {
            return true;
        }
    } catch (e) {
        console.warn('Failed to check tapplet source:', e);
    }
    return false;
}

export async function fetchActiveTapplet(tapplet: DevTapplet): Promise<ActiveTapplet | undefined> {
    const url = `${tapplet.source}/${TAPPLET_CONFIG_FILE}`;
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
            package_name: tapplet.package_name,
            version: config.version,
            display_name: tapplet.display_name,
            source: tapplet.source,
            permissions: config.permissions,
            supportedChain: config.supportedChain,
            csp: config.csp,
            tapplet_permissions: config.tapplet_permissions,
        };

        return activeTapplet;
    } catch (error) {
        console.error('Failed to fetch tapplet config:', error);
        return;
    }
}
