import { create } from 'zustand';
import { emit } from '@tauri-apps/api/event';
import { invoke } from '@tauri-apps/api/core';
import type { AccountBalance } from '@app/types/app-status.ts';
import type { PinPromptContext } from '@app/types/events-payloads.ts';
import { useWalletStore } from './useWalletStore.ts';
import { useExchangeStore } from './useExchangeStore.ts';

const _DIALOGS = ['intro', 'verify_seedphrase', 'create_pin', 'enter_pin', 'forgot_pin', 'l2_pin_required'] as const;

type DialogsTuple = typeof _DIALOGS;
export type DialogsType = DialogsTuple[number] | null;

interface State {
    modal: DialogsType;
    pinResolver: ((pin?: string) => void) | null;
    /** What the backend is asking the user to authorise, when it told us. */
    pinContext: PinPromptContext | null;
    /** The backend prompt the open PIN dialog answers. */
    pinPromptId: number | null;
}

interface Actions {
    setModal: (modal: DialogsType) => void;
}

const initialState: State = {
    modal: null,
    pinResolver: null,
    pinContext: null,
    pinPromptId: null,
};

export const useSecurityStore = create<State & Actions>()((set) => ({
    ...initialState,
    setModal: (modal) => set({ modal }),
}));

export function hasWalletFunds(balance?: AccountBalance): boolean {
    if (!balance) return false;
    return balance.total > 0 || balance.available > 0 || balance.locked > 0 || balance.unconfirmed > 0;
}

export function isWalletSecured(pinLocked: boolean, seedBackedUp: boolean, isExchangeMiner: boolean): boolean {
    return isExchangeMiner ? pinLocked : seedBackedUp && pinLocked;
}

export function isWalletSecurityMandatory(
    balance: AccountBalance | undefined,
    pinLocked: boolean,
    seedBackedUp: boolean,
    isExchangeMiner: boolean
): boolean {
    return hasWalletFunds(balance) && !isWalletSecured(pinLocked, seedBackedUp, isExchangeMiner);
}

export function getIsWalletSecured(isExchangeMinerOverride?: boolean): boolean {
    const { is_pin_locked, is_seed_backed_up } = useWalletStore.getState();
    const isExchangeMiner =
        isExchangeMinerOverride ?? useExchangeStore.getState().currentExchangeMinerId !== 'universal';
    return isWalletSecured(is_pin_locked, is_seed_backed_up, isExchangeMiner);
}

export function useIsWalletSecured(isExchangeMinerOverride?: boolean): boolean {
    const pinLocked = useWalletStore((s) => s.is_pin_locked);
    const seedBackedUp = useWalletStore((s) => s.is_seed_backed_up);
    const storeExchangeMiner = useExchangeStore((s) => s.currentExchangeMinerId !== 'universal');
    const isExchangeMiner = isExchangeMinerOverride ?? storeExchangeMiner;
    return isWalletSecured(pinLocked, seedBackedUp, isExchangeMiner);
}

export function getIsWalletSecurityMandatory(isExchangeMinerOverride?: boolean): boolean {
    const { account_balance, is_pin_locked, is_seed_backed_up } = useWalletStore.getState();
    const isExchangeMiner =
        isExchangeMinerOverride ?? useExchangeStore.getState().currentExchangeMinerId !== 'universal';
    return isWalletSecurityMandatory(account_balance, is_pin_locked, is_seed_backed_up, isExchangeMiner);
}

export function useIsWalletSecurityMandatory(isExchangeMinerOverride?: boolean): boolean {
    const balance = useWalletStore((s) => s.account_balance);
    const pinLocked = useWalletStore((s) => s.is_pin_locked);
    const seedBackedUp = useWalletStore((s) => s.is_seed_backed_up);
    const storeExchangeMiner = useExchangeStore((s) => s.currentExchangeMinerId !== 'universal');
    const isExchangeMiner = isExchangeMinerOverride ?? storeExchangeMiner;
    return isWalletSecurityMandatory(balance, pinLocked, seedBackedUp, isExchangeMiner);
}

export function openCreatePinFlow(): void {
    useSecurityStore.setState({ modal: 'create_pin' });
    void Promise.resolve(invoke('create_pin')).catch((error) => {
        console.error('Failed to create PIN:', error);
    });
}

export function openWalletSecurityFlow(isExchangeMinerOverride?: boolean): void {
    const isExchangeMiner =
        isExchangeMinerOverride ?? useExchangeStore.getState().currentExchangeMinerId !== 'universal';
    if (isExchangeMiner) {
        openCreatePinFlow();
    } else {
        useSecurityStore.setState({ modal: 'intro' });
    }
}

export function enforceMandatoryWalletSecurity(isExchangeMinerOverride?: boolean): boolean {
    const walletState = useWalletStore.getState();
    if (walletState.is_wallet_importing) {
        return false;
    }
    const isExchangeMiner =
        isExchangeMinerOverride ?? useExchangeStore.getState().currentExchangeMinerId !== 'universal';
    if (!getIsWalletSecurityMandatory(isExchangeMiner)) {
        return false;
    }
    const currentModal = useSecurityStore.getState().modal;
    if (
        currentModal === 'verify_seedphrase' ||
        currentModal === 'create_pin' ||
        currentModal === 'enter_pin' ||
        currentModal === 'forgot_pin'
    ) {
        return true;
    }
    if (currentModal === 'intro' && !isExchangeMiner) {
        return true;
    }
    openWalletSecurityFlow(isExchangeMiner);
    return true;
}

export function requestPin(): Promise<string | undefined> {
    return new Promise((resolve) => {
        const current = useSecurityStore.getState();
        if (current.pinResolver) {
            current.pinResolver(undefined);
        }
        useSecurityStore.setState({ pinResolver: resolve, modal: 'enter_pin', pinContext: null, pinPromptId: null });
    });
}

/** Answers the backend PIN prompt, no PIN meaning cancelled. The prompt id goes back with it so a
 * late or duplicate answer can't satisfy another prompt. */
export function respondToPin(pin?: string) {
    return emit('pin-dialog-response', {
        id: useSecurityStore.getState().pinPromptId,
        pin,
    });
}

/** The backend stopped waiting for prompt `id`; close its dialog if it is still open. */
export function closePinPrompt(id: number) {
    const { modal, pinPromptId } = useSecurityStore.getState();
    if (pinPromptId === id && (modal === 'enter_pin' || modal === 'create_pin')) {
        useSecurityStore.setState({ modal: null, pinContext: null });
        if (modal === 'create_pin') {
            enforceMandatoryWalletSecurity();
        }
    }
}
