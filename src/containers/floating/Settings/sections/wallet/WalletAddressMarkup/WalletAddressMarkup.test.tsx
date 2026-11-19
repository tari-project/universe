import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@app/test/test-utils';
import { initialState, useWalletStore } from '@app/store/useWalletStore.ts';
import WalletAddressMarkup from './WalletAddressMarkup';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));
vi.mock('@app/hooks/exchanges/fetchExchangeContent.ts', () => ({
    useFetchExchangeBranding: () => ({ data: undefined }),
}));
vi.mock('@app/hooks/wallet/useValidate.ts', () => ({
    useValidateTariAddress: () => ({ validateAddress: vi.fn(async () => true) }),
}));

describe('WalletAddressMarkup', () => {
    beforeEach(() => {
        useWalletStore.setState({
            ...initialState,
            tari_address_base58: '125ohcEDcG8s832D3G7b28f',
            tari_address_emoji: '🐢🚀🌟🔥💎⚡🌈🎯',
        });
    });

    it('renders the tari-wallet-address heading alongside the emoji and base58 address controls', () => {
        render(<WalletAddressMarkup />);

        expect(screen.getByRole('heading', { name: 'tari-wallet-address' })).toBeInTheDocument();
        expect(screen.getByTestId('wallet-tari-address')).toHaveValue('125ohcEDcG8s832D3G7b28f');
    });

    it('labels tari-wallet-address with XTM across all settings locale files', () => {
        const localesDir = resolve(process.cwd(), 'public/locales');
        const localeDirs = readdirSync(localesDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => entry.name);

        expect(localeDirs.length).toBeGreaterThanOrEqual(14);

        const enSettings = JSON.parse(readFileSync(resolve(localesDir, 'en/settings.json'), 'utf8')) as Record<
            string,
            unknown
        >;
        expect(enSettings['tari-wallet-address']).toBe('XTM Wallet Address');

        for (const locale of localeDirs) {
            const settings = JSON.parse(readFileSync(resolve(localesDir, locale, 'settings.json'), 'utf8')) as Record<
                string,
                unknown
            >;
            const label = String(settings['tari-wallet-address'] ?? '');
            expect(label).toContain('XTM');
            expect(label).not.toMatch(/Tari|तारी/);
        }
    });
});
