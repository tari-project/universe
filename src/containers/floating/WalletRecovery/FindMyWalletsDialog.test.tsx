/**
 * @vitest-environment jsdom
 */
import { invoke } from '@tauri-apps/api/core';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
    invoke: vi.fn(),
}));

import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import { FindWalletsResult } from '@app/types/wallet-recovery.ts';
import FindMyWalletsDialog from './FindMyWalletsDialog';

// `invoke` is declared as a long overload list, so the mock is reached through one loose handle.
const mockedInvoke = invoke as unknown as Mock;

const FOUND: FindWalletsResult = {
    kind: 'found',
    wallets: [
        { wallet_id: 'one', address_prefix: '12345678', is_linked: true, is_active: true, status: 'readable' },
        { wallet_id: 'two', address_prefix: 'abcdefgh', is_linked: false, is_active: false, status: 'readable' },
    ],
};

/** Both rows carry a "use" button; the active wallet's is disabled, so this picks the other one. */
function enabledUseButton() {
    return screen
        .getAllByRole('button', { name: 'find-my-wallets-use' })
        .find((button) => !button.hasAttribute('disabled')) as HTMLElement;
}

function relinkCalls() {
    return mockedInvoke.mock.calls.filter(([command]) => command === 'relink_wallet');
}

async function renderSearched() {
    mockedInvoke.mockImplementation((command: string) => {
        if (command === 'find_my_wallets') return Promise.resolve(FOUND);
        return Promise.resolve('abcdefgh');
    });
    render(<FindMyWalletsDialog open onOpenChange={vi.fn()} />);
    fireEvent.click(screen.getByText('find-my-wallets-search'));
    await screen.findAllByRole('button', { name: 'find-my-wallets-use' });
}

describe('FindMyWalletsDialog', () => {
    beforeEach(() => {
        mockedInvoke.mockReset();
        vi.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    it('asks for confirmation before switching wallets', async () => {
        await renderSearched();

        fireEvent.click(enabledUseButton());

        await screen.findByText('find-my-wallets-confirm-description');
        expect(relinkCalls()).toHaveLength(0);
    });

    it('switches the wallet once the confirmation is accepted', async () => {
        await renderSearched();

        fireEvent.click(enabledUseButton());
        fireEvent.click(await screen.findByText('find-my-wallets-confirm'));

        await waitFor(() => expect(relinkCalls()).toEqual([['relink_wallet', { walletId: 'two' }]]));
    });

    it('does nothing when the confirmation is cancelled', async () => {
        await renderSearched();

        fireEvent.click(enabledUseButton());
        fireEvent.click(await screen.findByText('cancel'));

        await waitFor(() => expect(screen.queryByText('find-my-wallets-confirm-description')).not.toBeInTheDocument());
        expect(relinkCalls()).toHaveLength(0);
    });

    it('renders a translation key instead of the raw backend error', async () => {
        mockedInvoke.mockRejectedValue('Keyring had no entry for: inner_wallet_credentials_esmeralda_abc123');
        render(<FindMyWalletsDialog open onOpenChange={vi.fn()} />);

        fireEvent.click(screen.getByText('find-my-wallets-search'));

        await screen.findByText('find-my-wallets-error-keyring');
        expect(screen.queryByText(/inner_wallet_credentials/)).not.toBeInTheDocument();
    });
});
