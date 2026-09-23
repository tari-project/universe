/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({
        onCloseRequested: vi.fn(),
        listen: vi.fn(),
    })),
}));

vi.mock('@tauri-apps/plugin-shell', () => ({
    open: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@app/store/useTappletSignerStore.ts', () => ({
    runTappletTransaction: vi.fn().mockResolvedValue(undefined),
}));

import { open } from '@tauri-apps/plugin-shell';
import { runTappletTransaction } from '@app/store/useTappletSignerStore.ts';
import { render } from '@app/test/test-utils';
import { Tapplet } from './Tapplet';

const TAPPLET_SOURCE = 'http://127.0.0.1:41234';
const TAPPLET_ORIGIN = 'http://127.0.0.1:41234';

function renderTapplet(source = TAPPLET_SOURCE) {
    const { container } = render(<Tapplet source={source} />);
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;
    return { iframe };
}

function postToApp(data: unknown, origin: string, source: MessageEventSource | null) {
    window.dispatchEvent(new MessageEvent('message', { data, origin, source }));
}

describe('Tapplet message handling', () => {
    beforeEach(() => {
        vi.mocked(runTappletTransaction).mockClear();
        vi.mocked(open).mockClear();
        vi.spyOn(console, 'warn')
            .mockImplementation(() => undefined)
            .mockClear();
        vi.spyOn(console, 'info')
            .mockImplementation(() => undefined)
            .mockClear();
    });

    it('dispatches a signer-call coming from the tapplet iframe', () => {
        const { iframe } = renderTapplet();

        postToApp(
            { type: 'signer-call', methodName: 'getAccount', args: [], id: 1 },
            TAPPLET_ORIGIN,
            iframe.contentWindow
        );

        expect(runTappletTransaction).toHaveBeenCalledTimes(1);
    });

    it('ignores a message from another origin', () => {
        const { iframe } = renderTapplet();

        postToApp(
            { type: 'signer-call', methodName: 'sendOneSided', args: [], id: 1 },
            'https://evil.example',
            iframe.contentWindow
        );

        expect(runTappletTransaction).not.toHaveBeenCalled();
    });

    it('ignores a message from a different port on the same host', () => {
        const { iframe } = renderTapplet();

        postToApp(
            { type: 'signer-call', methodName: 'sendOneSided', args: [], id: 1 },
            'http://127.0.0.1:41235',
            iframe.contentWindow
        );

        expect(runTappletTransaction).not.toHaveBeenCalled();
    });

    it('ignores a message from a window that is not the tapplet iframe', () => {
        renderTapplet();
        const otherFrame = document.createElement('iframe');
        document.body.appendChild(otherFrame);

        postToApp(
            { type: 'signer-call', methodName: 'sendOneSided', args: [], id: 1 },
            TAPPLET_ORIGIN,
            otherFrame.contentWindow
        );
        postToApp({ type: 'signer-call', methodName: 'sendOneSided', args: [], id: 1 }, TAPPLET_ORIGIN, window);
        postToApp({ type: 'signer-call', methodName: 'sendOneSided', args: [], id: 1 }, TAPPLET_ORIGIN, null);

        expect(runTappletTransaction).not.toHaveBeenCalled();
        otherFrame.remove();
    });

    it('warns only once about untrusted senders', () => {
        const { iframe } = renderTapplet();

        postToApp({ type: 'signer-call', args: [], id: 1 }, 'https://evil.example', iframe.contentWindow);
        postToApp({ type: 'signer-call', args: [], id: 2 }, 'https://evil.example', iframe.contentWindow);
        postToApp({ type: 'signer-call', args: [], id: 3 }, 'https://evil.example', iframe.contentWindow);

        expect(console.warn).toHaveBeenCalledTimes(1);
    });

    it('does not listen at all when the source is empty', () => {
        const { iframe } = renderTapplet('');

        postToApp({ type: 'signer-call', methodName: 'getAccount', args: [], id: 1 }, '', iframe.contentWindow);

        expect(runTappletTransaction).not.toHaveBeenCalled();
    });

    it('does not listen at all when the source is not a valid url', () => {
        const { iframe } = renderTapplet('not-a-url');

        postToApp({ type: 'signer-call', methodName: 'getAccount', args: [], id: 1 }, 'null', iframe.contentWindow);

        expect(runTappletTransaction).not.toHaveBeenCalled();
    });

    describe('open-external-link', () => {
        it('opens an https link from the tapplet', async () => {
            const { iframe } = renderTapplet();

            postToApp({ type: 'open-external-link', url: 'https://tari.com' }, TAPPLET_ORIGIN, iframe.contentWindow);
            await vi.waitFor(() => expect(open).toHaveBeenCalledWith('https://tari.com'));
        });

        it.each(['javascript:alert(1)', 'file:///etc/passwd', 'custom-scheme://run', '', undefined])(
            'refuses to open %j',
            async (url) => {
                const { iframe } = renderTapplet();

                postToApp({ type: 'open-external-link', url }, TAPPLET_ORIGIN, iframe.contentWindow);
                await Promise.resolve();

                expect(open).not.toHaveBeenCalled();
            }
        );

        it('ignores an open-external-link message from another origin', async () => {
            const { iframe } = renderTapplet();

            postToApp(
                { type: 'open-external-link', url: 'https://evil.example' },
                'https://evil.example',
                iframe.contentWindow
            );
            await Promise.resolve();

            expect(open).not.toHaveBeenCalled();
        });
    });

    describe('GET_INIT_CONFIG', () => {
        it('replies to the tapplet with its own origin as targetOrigin', () => {
            const { iframe } = renderTapplet();
            const postMessage = vi.spyOn(iframe.contentWindow as Window, 'postMessage');

            postToApp({ type: 'GET_INIT_CONFIG' }, TAPPLET_ORIGIN, iframe.contentWindow);

            expect(postMessage).toHaveBeenCalledTimes(2);
            for (const call of postMessage.mock.calls) {
                expect(call[1]).toBe(TAPPLET_ORIGIN);
            }
        });

        it('does not reply to a GET_INIT_CONFIG from another origin', () => {
            const { iframe } = renderTapplet();
            const postMessage = vi.spyOn(iframe.contentWindow as Window, 'postMessage');

            postToApp({ type: 'GET_INIT_CONFIG' }, 'https://evil.example', iframe.contentWindow);

            expect(postMessage).not.toHaveBeenCalled();
        });
    });
});
