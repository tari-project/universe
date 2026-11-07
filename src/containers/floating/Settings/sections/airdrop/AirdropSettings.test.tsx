import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@app/test/test-utils';
import { useAirdropStore, type UserDetails } from '@app/store/useAirdropStore';
import SettingsNavigation from '../../components/Navigation';
import { AirdropSettings } from './AirdropSettings';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));
vi.mock('@tauri-apps/plugin-shell', () => ({ open: vi.fn() }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
        i18n: { language: 'en', changeLanguage: vi.fn() },
    }),
    Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}));

const sampleUserDetails: UserDetails = {
    user: {
        is_bot: false,
        twitter_followers: 10,
        id: 'user-1',
        referral_code: 'REF123',
        yat_user_id: 'yat-1',
        name: 'tari_miner',
        role: 'user',
        image_url: 'https://example.com/avatar.png',
        rank: {
            gems: 100,
            shells: 0,
            hammers: 0,
            totalScore: 100,
            rank: '1',
        },
    },
};

describe('Airdrop settings section', () => {
    beforeEach(() => {
        useAirdropStore.setState({ userDetails: undefined, authUuid: '' });
    });

    it('hides the Airdrop settings tab when the user is logged out and shows it when logged in', () => {
        render(<SettingsNavigation activeSection="general" onChangeActiveSection={vi.fn()} />);
        expect(screen.queryByTestId('settings-tab-airdrop')).not.toBeInTheDocument();

        act(() => useAirdropStore.setState({ userDetails: sampleUserDetails }));
        expect(screen.getByTestId('settings-tab-airdrop')).toBeInTheDocument();

        act(() => useAirdropStore.setState({ userDetails: undefined }));
        expect(screen.queryByTestId('settings-tab-airdrop')).not.toBeInTheDocument();
    });

    it('renders nothing in AirdropSettings when logged out and renders logout controls when logged in', () => {
        const { container } = render(<AirdropSettings />);
        expect(container).toBeEmptyDOMElement();

        act(() => useAirdropStore.setState({ userDetails: sampleUserDetails }));
        expect(screen.getByDisplayValue('tari_miner')).toBeInTheDocument();
    });
});
