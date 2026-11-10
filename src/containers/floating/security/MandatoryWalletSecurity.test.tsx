/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';
import { fireEvent, render, screen, waitFor } from '@app/test/test-utils';
import {
    initialState as initialWalletState,
    setWalletBalance,
    useMiningMetricsStore,
    useMiningStore,
    useSecurityStore,
    useWalletStore,
} from '@app/store';
import { handlePinLocked, handleSeedBackedUp } from '@app/store/actions/walletStoreActions';
import { handleAppModulesUpdate } from '@app/store/actions/setupStoreActions';
import { useExchangeStore } from '@app/store/useExchangeStore';
import { AppModule, AppModuleStatus } from '@app/store/types/setup';
import { useSetupStore } from '@app/store/useSetupStore';
import SecurityPromptDialog from './prompt/SecurityPromptDialog';
import SeedPhrase from './seedphrase/SeedPhrase';
import CreatePinDialog from './pin/CreatePinDialog';
import WalletActions from '@app/components/wallet/components/actions/WalletActions';
import SendModal from '@app/components/transactions/send/SendModal';
import SecureWalletWarning from '@app/components/wallet/sidebarWallet/SecureWalletWarning/SecureWalletWarning';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(() => Promise.resolve()) }));
vi.mock('@tauri-apps/api/event', () => ({ emit: vi.fn(() => Promise.resolve()) }));
vi.mock('@tauri-apps/api/window', () => ({
    getCurrentWindow: vi.fn(() => ({ onCloseRequested: vi.fn(), listen: vi.fn() })),
}));

const FUNDED_BALANCE = {
    total: 5_000_000,
    available: 5_000_000,
    locked: 0,
    unconfirmed: 0,
};

const EMPTY_BALANCE = {
    total: 0,
    available: 0,
    locked: 0,
    unconfirmed: 0,
};

describe('Mandatory PIN and seed backup once the wallet has funds (#3509)', () => {
    beforeEach(() => {
        vi.mocked(invoke).mockReset().mockResolvedValue(undefined);
        vi.mocked(emit).mockReset().mockResolvedValue(undefined);
        useWalletStore.setState({ ...initialWalletState }, true);
        useExchangeStore.setState({
            showExchangeAddressModal: null,
            showUniversalModal: null,
            currentExchangeMinerId: 'universal',
        });
        useSecurityStore.setState({
            modal: null,
            pinResolver: null,
            pinContext: null,
            pinPromptId: null,
        });
        useSetupStore.setState((s) => ({
            ...s,
            app_modules: {
                ...s.app_modules,
                [AppModule.Wallet]: {
                    ...s.app_modules[AppModule.Wallet],
                    status: AppModuleStatus.Initialized,
                },
            },
        }));
    });

    it('keeps security optional on an empty wallet and allows dismissing the intro prompt', async () => {
        await setWalletBalance(EMPTY_BALANCE);
        expect(useSecurityStore.getState().modal).toBeNull();

        useSecurityStore.setState({ modal: 'intro' });
        render(<SecurityPromptDialog />);

        const skipButton = await screen.findByText('skip');
        expect(skipButton).toBeInTheDocument();
        fireEvent.click(skipButton);

        await waitFor(() => expect(useSecurityStore.getState().modal).toBeNull());
        expect(invoke).toHaveBeenCalledWith('set_security_warning_dismissed');
    });

    it('triggers the intro security modal on the first non-zero balance for a standard wallet', async () => {
        await setWalletBalance(FUNDED_BALANCE);
        expect(useSecurityStore.getState().modal).toBe('intro');
    });

    it('triggers on launch when an existing wallet already has funds but lacks PIN or seed backup', async () => {
        useWalletStore.setState({
            account_balance: FUNDED_BALANCE,
            is_pin_locked: false,
            is_seed_backed_up: true,
        });

        await handleAppModulesUpdate({
            module: AppModule.Wallet,
            status: AppModuleStatus.Initialized,
            error_messages: {
                Core: '',
                CpuMining: '',
                GpuMining: '',
                Node: '',
                Wallet: '',
            },
        });

        expect(useSecurityStore.getState().modal).toBe('intro');
    });

    it('opens create_pin directly for exchange miners and treats pinLocked alone as secured', async () => {
        useExchangeStore.setState({ currentExchangeMinerId: 'binance' });

        await setWalletBalance(FUNDED_BALANCE);

        expect(useSecurityStore.getState().modal).toBe('create_pin');
        expect(invoke).toHaveBeenCalledWith('create_pin');

        // Exchange miners only require PIN (isExchangeMiner ? pinLocked : seedBackedUp && pinLocked)
        useSecurityStore.setState({ modal: null });
        vi.mocked(invoke).mockClear();
        handlePinLocked(true);
        handleSeedBackedUp(false);

        render(<SecureWalletWarning $isScrolled={false} isExchangeMiner={true} />);
        expect(useSecurityStore.getState().modal).toBeNull();
        expect(invoke).not.toHaveBeenCalledWith('create_pin');
    });

    it('renders the security flow as a non-dismissible blocking modal until both seed backup and PIN are completed', async () => {
        const seedWords = ['alpha', 'bravo', 'charlie'];
        vi.mocked(invoke).mockImplementation((async (cmd: string) => {
            if (cmd === 'get_seed_words') return seedWords;
            return undefined;
        }) as typeof invoke);

        await setWalletBalance(FUNDED_BALANCE);
        expect(useSecurityStore.getState().modal).toBe('intro');

        render(
            <>
                <SecurityPromptDialog />
                <SeedPhrase />
                <CreatePinDialog />
            </>
        );

        // 1. Intro dialog cannot be skipped or closed
        expect(await screen.findByText('intro.title')).toBeInTheDocument();
        expect(screen.queryByText('skip')).not.toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(useSecurityStore.getState().modal).toBe('intro');

        // Advance to Step 1: Verify seed phrase
        fireEvent.click(screen.getByText('intro.button'));
        await waitFor(() => expect(useSecurityStore.getState().modal).toBe('verify_seedphrase'));

        // SeedPhrase dialog cannot be dismissed with Escape
        expect(await screen.findByText('seedPhrase.title')).toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(useSecurityStore.getState().modal).toBe('verify_seedphrase');

        // Check confirmation box and continue to word verification
        fireEvent.click(screen.getByText('seedPhrase.checkbox'));
        fireEvent.click(screen.getByText('seedPhrase.button'));

        expect(await screen.findByText('verifySeed.title')).toBeInTheDocument();
        for (const word of seedWords) {
            fireEvent.click(screen.getByRole('button', { name: word }));
        }

        const verifyButton = screen.getByText('verifySeed.button').closest('button')!;
        expect(verifyButton).not.toBeDisabled();
        fireEvent.click(verifyButton);

        // Completing seed phrase backup transitions directly to CreatePinDialog
        await waitFor(() => expect(invoke).toHaveBeenCalledWith('set_seed_backed_up'));
        await waitFor(() => expect(useWalletStore.getState().is_seed_backed_up).toBe(true));
        await waitFor(() => expect(useSecurityStore.getState().modal).toBe('create_pin'));
        expect(invoke).toHaveBeenCalledWith('create_pin');

        // 2. CreatePinDialog hides Skip on step 1 and cannot be dismissed with Escape
        expect(await screen.findByTestId('pin-create-submit')).toBeInTheDocument();
        expect(screen.queryByTestId('pin-create-secondary')).not.toBeInTheDocument();
        fireEvent.keyDown(document, { key: 'Escape' });
        expect(useSecurityStore.getState().modal).toBe('create_pin');

        // Enter 6-digit PIN on step 1
        useSecurityStore.setState({ pinPromptId: 99 });
        const step1Inputs = screen.getByTestId('pin-input').querySelectorAll('input');
        step1Inputs.forEach((input, idx) => {
            fireEvent.change(input, { target: { value: `${idx + 1}` } });
        });
        fireEvent.click(screen.getByTestId('pin-create-submit'));

        // Step 2 confirm shows the "enter new" secondary button, and confirming completes setup
        expect(await screen.findByTestId('pin-create-secondary')).toBeInTheDocument();
        const step2Inputs = screen.getByTestId('pin-input').querySelectorAll('input');
        step2Inputs.forEach((input, idx) => {
            fireEvent.change(input, { target: { value: `${idx + 1}` } });
        });
        fireEvent.click(screen.getByTestId('pin-create-submit'));

        await waitFor(() => expect(emit).toHaveBeenCalledWith('pin-dialog-response', { id: 99, pin: '123456' }));
        await waitFor(() => expect(useWalletStore.getState().is_pin_locked).toBe(true));

        // Complete screen can now be closed via Continue
        const continueBtn = await screen.findByText('complete.continue');
        fireEvent.click(continueBtn);
        await waitFor(() => expect(useSecurityStore.getState().modal).toBeNull());
    });

    it('blocks sending until security setup is complete', async () => {
        useWalletStore.setState({
            account_balance: FUNDED_BALANCE,
            is_pin_locked: false,
            is_seed_backed_up: false,
            wallet_scanning: {
                scanned_height: 100,
                total_height: 100,
                progress: 100,
                is_initial_scan_complete: true,
            },
        });

        const setSection = vi.fn();
        const { rerender } = render(<WalletActions section="history" setSection={setSection} />);

        const sendButton = screen.getByTestId('wallet-send-button');
        expect(sendButton).toBeDisabled();

        // Attempting to open SendModal while security is mandatory closes SendModal and opens intro
        render(<SendModal section="send" setSection={setSection} />);
        await waitFor(() => expect(setSection).toHaveBeenCalledWith('history'));
        expect(useSecurityStore.getState().modal).toBe('intro');
        expect(invoke).not.toHaveBeenCalledWith('send_one_sided_to_stealth_address', expect.anything());

        // Once both seed backup and PIN are complete, the Send button is enabled
        useWalletStore.setState({ is_pin_locked: true, is_seed_backed_up: true });
        rerender(<WalletActions section="history" setSection={setSection} />);
        expect(screen.getByTestId('wallet-send-button')).not.toBeDisabled();
    });

    it('does not stop mining while the mandatory security prompt is active', async () => {
        useMiningStore.setState({
            isCpuMiningInitiated: true,
            isGpuMiningInitiated: true,
        });
        useMiningMetricsStore.setState((s) => ({
            ...s,
            cpu_mining_status: { ...s.cpu_mining_status, is_mining: true, hash_rate: 1200 },
            gpu_mining_status: { ...s.gpu_mining_status, is_mining: true, hash_rate: 5400 },
        }));

        await setWalletBalance(FUNDED_BALANCE);

        expect(useSecurityStore.getState().modal).toBe('intro');
        expect(useMiningStore.getState().isCpuMiningInitiated).toBe(true);
        expect(useMiningStore.getState().isGpuMiningInitiated).toBe(true);
        expect(useMiningMetricsStore.getState().cpu_mining_status.is_mining).toBe(true);
        expect(useMiningMetricsStore.getState().gpu_mining_status.is_mining).toBe(true);
        expect(invoke).not.toHaveBeenCalledWith('stop_mining');
        expect(invoke).not.toHaveBeenCalledWith('stop_cpu_mining');
        expect(invoke).not.toHaveBeenCalledWith('stop_gpu_mining');
    });
});
