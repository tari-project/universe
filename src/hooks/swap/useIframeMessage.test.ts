/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { MessageType, useIframeMessage } from './useIframeMessage';

const SWAP_URL = 'https://swap.tari.com/app';
const SWAP_ORIGIN = 'https://swap.tari.com';

function mountSwapIframe(src = SWAP_URL) {
    const iframe = document.createElement('iframe');
    iframe.title = 'Swap Iframe';
    iframe.src = src;
    document.body.appendChild(iframe);
    return iframe;
}

function postToApp(origin: string, source: MessageEventSource | null) {
    window.dispatchEvent(
        new MessageEvent('message', {
            data: { type: MessageType.SWAP_HEIGHT_CHANGE, payload: { height: 100 } },
            origin,
            source,
        })
    );
}

describe('useIframeMessage', () => {
    beforeEach(() => {
        vi.spyOn(console, 'warn')
            .mockImplementation(() => undefined)
            .mockClear();
    });

    afterEach(() => {
        document.body.innerHTML = '';
    });

    it('forwards a message from the swap iframe', () => {
        const iframe = mountSwapIframe();
        const onMessage = vi.fn();
        renderHook(() => useIframeMessage(onMessage));

        postToApp(SWAP_ORIGIN, iframe.contentWindow);

        expect(onMessage).toHaveBeenCalledTimes(1);
    });

    it('ignores a message from the wrong origin', () => {
        const iframe = mountSwapIframe();
        const onMessage = vi.fn();
        renderHook(() => useIframeMessage(onMessage));

        postToApp('https://evil.example', iframe.contentWindow);

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('ignores a message from a window we did not embed', () => {
        mountSwapIframe();
        const onMessage = vi.fn();
        renderHook(() => useIframeMessage(onMessage));

        postToApp(SWAP_ORIGIN, window);
        postToApp(SWAP_ORIGIN, null);

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('ignores a message from another iframe on a different origin', () => {
        mountSwapIframe();
        const otherFrame = mountSwapIframe('https://evil.example/app');
        const onMessage = vi.fn();
        renderHook(() => useIframeMessage(onMessage));

        postToApp(SWAP_ORIGIN, otherFrame.contentWindow);

        expect(onMessage).not.toHaveBeenCalled();
    });

    it('warns only once about untrusted senders', () => {
        const iframe = mountSwapIframe();
        renderHook(() => useIframeMessage(vi.fn()));

        postToApp('https://evil.example', iframe.contentWindow);
        postToApp('https://evil.example', iframe.contentWindow);

        expect(console.warn).toHaveBeenCalledTimes(1);
    });
});
