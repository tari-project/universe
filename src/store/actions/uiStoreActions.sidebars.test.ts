import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useUIStore } from '@app/store/useUIStore.ts';
import { useConfigUIStore } from '@app/store/useAppConfigStore.ts';
import { setL2Open, setSidebarOpen } from './uiStoreActions.ts';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));
vi.mock('@tari-project/tari-tower', () => ({
    loadTowerAnimation: vi.fn(),
    removeTowerAnimation: vi.fn(),
    setAnimationProperties: vi.fn(),
    setAnimationState: vi.fn(),
}));

describe('wallet cards', () => {
    beforeEach(() => useUIStore.setState({ sidebarOpen: false, l2Open: false }));

    it('open one at a time by default', () => {
        useConfigUIStore.setState({ l2_side_by_side: false });
        setSidebarOpen(true);
        setL2Open(true);
        expect(useUIStore.getState()).toMatchObject({ sidebarOpen: false, l2Open: true });
        setSidebarOpen(true);
        expect(useUIStore.getState()).toMatchObject({ sidebarOpen: true, l2Open: false });
    });

    it('stay open together when side by side is allowed', () => {
        useConfigUIStore.setState({ l2_side_by_side: true });
        setSidebarOpen(true);
        setL2Open(true);
        expect(useUIStore.getState()).toMatchObject({ sidebarOpen: true, l2Open: true });
        setL2Open(false);
        expect(useUIStore.getState()).toMatchObject({ sidebarOpen: true, l2Open: false });
    });
});
