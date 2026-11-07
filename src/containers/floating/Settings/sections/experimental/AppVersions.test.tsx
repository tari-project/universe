import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { useAppStateStore } from '@app/store/appStateStore';
import type { ApplicationsVersions } from '@app/types/app-status';
import AppVersions from './AppVersions';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const sampleVersions: ApplicationsVersions = {
    tari_universe: { version: '1.6.22' },
    minotari_node: { version: '6.3.0', port: 18142 },
    xmrig: { version: '6.22.2', port: 0 },
    mm_proxy: { version: '6.3.0', port: 18081 },
    lolminer: { version: '1.98a', port: 0 },
    bridge: { version: '0.1.69' },
};

describe('AppVersions', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset();
        useAppStateStore.setState({ applications_versions: undefined });
    });

    it('renders the lolminer label and version from applications_versions', () => {
        useAppStateStore.setState({ applications_versions: sampleVersions });
        render(<AppVersions />);

        expect(screen.getByText('lolminer')).toBeInTheDocument();
        expect(screen.getByText('1.98a')).toBeInTheDocument();
        expect(screen.queryByText('xtrgpuminer')).not.toBeInTheDocument();
    });

    it('refreshes application versions via get_applications_versions', async () => {
        vi.mocked(invoke).mockImplementation((async (cmd: string) =>
            cmd === 'get_applications_versions' ? sampleVersions : undefined) as typeof invoke);
        render(<AppVersions />);

        fireEvent.click(screen.getByRole('button'));
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('get_applications_versions'));
        expect(await screen.findByText('lolminer')).toBeInTheDocument();
        expect(screen.getByText('1.98a')).toBeInTheDocument();
    });
});
