import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The store barrel reaches Tauri window APIs at import time, which don't exist under jsdom.
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: () => ({
        listen: vi.fn().mockResolvedValue(() => undefined),
        onResized: vi.fn().mockResolvedValue(() => undefined),
        label: 'main',
    }),
}));

import { useAirdropStore, useUIStore } from '@app/store';
import type { CommunityMessage } from '@app/store/useAirdropStore';
import { CommunityMessages } from './CommunityMessages';

function setMessage(textHtml: string) {
    const message: CommunityMessage = {
        id: 'msg-1',
        message: 'plain',
        isVisible: true,
        createdAt: '2026-01-01T00:00:00Z',
        textHtml,
        type: 'info',
    };
    useAirdropStore.setState({ communityMessages: [message] });
    useUIStore.setState({ sidebarOpen: true });
}

describe('CommunityMessages', () => {
    beforeEach(() => {
        useAirdropStore.setState({ communityMessages: undefined });
    });

    it('strips script tags from remote community-message HTML before rendering', () => {
        setMessage('<b>hello</b><script>window.__pwned = true;</script>');
        const { container } = render(<CommunityMessages />);

        expect(container.querySelector('script')).toBeNull();
        expect(container.innerHTML).not.toContain('__pwned');
        // Benign markup survives so legitimate messages still render.
        expect(container.querySelector('b')?.textContent).toBe('hello');
    });

    it('strips event-handler attributes that would run script', () => {
        setMessage('<img src="x" onerror="window.__pwned = true">');
        const { container } = render(<CommunityMessages />);

        const img = container.querySelector('img');
        expect(img?.getAttribute('onerror')).toBeNull();
        expect(container.innerHTML).not.toContain('onerror');
    });
});
