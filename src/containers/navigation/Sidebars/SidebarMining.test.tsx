import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@app/test/test-utils';
import { useUIStore } from '@app/store/useUIStore.ts';
import SidebarMining from './SidebarMining';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));
vi.mock('@tauri-apps/plugin-os', () => ({ type: vi.fn(() => 'linux') }));

describe('SidebarMining', () => {
    beforeEach(() => {
        useUIStore.setState({ miningPageOpen: true, showTapplet: false });
    });

    it('renders the mining page with the mining controls and pool settings', () => {
        render(<SidebarMining />);

        expect(screen.getByTestId('sidebar-mining-page')).toBeInTheDocument();
        expect(screen.getByText('mining-page.title')).toBeInTheDocument();
        expect(screen.getByText('mining-page.pool-settings')).toBeInTheDocument();
    });
});
