import { BackendBridgeTransaction, setError as setStoreError, useConfigUIStore, useWalletStore } from '@app/store';
import { invoke } from '@tauri-apps/api/core';
import { BaseNodeStatus, BridgeEnvs } from '../app-status';
import { L2Account, L2WalletState } from '../events-payloads';
import {
    AccountData,
    BridgeTxDetails,
    OotleAccountData,
    OotleBalance,
    SendOneSidedRequest,
    SendOotleStealthRequest,
    TappletSignerParams,
    TappletWalletBalance,
    WaitOotleTransactionRequest,
    WindowSize,
} from './tapplet.types';
import {
    useTappletsStore,
    setOngoingBridgeTx as setTx,
    removeOngoingBridgeTx as removeTx,
} from '@app/store/useTappletsStore';

/**
 * Methods a tapplet is allowed to call over `postMessage` (`signer-call`). Mirrors the signer
 * client shipped in the built-in wXTM bridge tapplet - do not widen without a security review.
 */
export type TappletCallableMethod =
    | 'isConnected'
    | 'getAccount'
    | 'getAppLanguage'
    | 'getBackendBridgeTxs'
    | 'getBaseNodeStatus'
    | 'getBridgeEnvs'
    | 'getNetwork'
    | 'getOngoingBridgeTx'
    | 'getTariBalance'
    | 'removeOngoingBridgeTx'
    | 'setOngoingBridgeTx'
    | 'sendOneSided'
    | 'getOotleAccount'
    | 'getOotleBalance'
    | 'sendOotleStealth'
    | 'waitOotleTransaction';

/** Returned by the Ootle methods when L2 is off this network, not enabled, or locked. */
export const L2_UNAVAILABLE = { error: 'l2_unavailable' };
const PAY_REF_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MICRO_AMOUNT_RE = /^[1-9][0-9]*$/;
const MAX_WAIT_SECS = 600;
const WAIT_POLL_MS = 2000;

function invalidArgsResult(method: string): { error: string } {
    console.warn(`Blocked tapplet signer call to "${method}" with invalid arguments`);
    return { error: `Invalid arguments for tapplet signer method: ${method}` };
}

function isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
}

function isSendOneSidedRequest(value: unknown): value is SendOneSidedRequest {
    if (!value || typeof value !== 'object') return false;
    const req = value as Record<string, unknown>;
    return (
        isNonEmptyString(req.amount) &&
        isNonEmptyString(req.address) &&
        (req.paymentId === undefined || req.paymentId === null || typeof req.paymentId === 'string')
    );
}

function isSendOotleStealthRequest(value: unknown): value is SendOotleStealthRequest {
    if (!value || typeof value !== 'object') return false;
    const req = value as Record<string, unknown>;
    return (
        typeof req.amount === 'string' &&
        MICRO_AMOUNT_RE.test(req.amount) &&
        isNonEmptyString(req.address) &&
        typeof req.payRef === 'string' &&
        PAY_REF_RE.test(req.payRef)
    );
}

function isWaitOotleTransactionRequest(value: unknown): value is WaitOotleTransactionRequest {
    if (!value || typeof value !== 'object') return false;
    const req = value as Record<string, unknown>;
    return (
        isNonEmptyString(req.transactionId) &&
        Number.isInteger(req.timeoutSecs) &&
        (req.timeoutSecs as number) > 0 &&
        (req.timeoutSecs as number) <= MAX_WAIT_SECS
    );
}

/** `l2_send` takes XTR, the tapplet sends micro XTR. */
function microToXtr(micro: string): string {
    const value = BigInt(micro);
    const million = BigInt(1_000_000);
    return `${value / million}.${(value % million).toString().padStart(6, '0')}`;
}

/** The open L2 wallet's default account, or undefined when L2 can't be used right now. */
async function defaultOotleAccount(): Promise<L2Account | undefined> {
    let state: L2WalletState;
    try {
        state = await invoke<L2WalletState>('l2_get_state');
    } catch {
        return undefined;
    }
    if (!state.enabled || state.locked) return undefined;
    return state.accounts.find((account) => account.is_default) ?? state.accounts[0];
}

function isBridgeTxDetails(value: unknown): value is BridgeTxDetails {
    if (!value || typeof value !== 'object') return false;
    const tx = value as Record<string, unknown>;
    return (
        isNonEmptyString(tx.amount) &&
        typeof tx.amountToReceive === 'string' &&
        isNonEmptyString(tx.destinationAddress) &&
        typeof tx.paymentId === 'string'
    );
}

export class TappletSigner {
    public providerName = 'TappletSigner';
    id: string;
    params: TappletSignerParams;

    private constructor(
        params: TappletSignerParams,
        public width = 0,
        public height = 0
    ) {
        this.params = params;
        this.id = params.id;
    }

    static build(params: TappletSignerParams): TappletSigner {
        return new TappletSigner(params);
    }
    public setWindowSize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }

    public sendWindowSizeMessage(tappletWindow: Window | null, targetOrigin: string): void {
        tappletWindow?.postMessage({ height: this.height, width: this.width, type: 'resize' }, targetOrigin);
    }

    public requestParentSize(): Promise<WindowSize> {
        return Promise.resolve({ width: this.width, height: this.height });
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    /**
     * Entry point for `signer-call` messages coming from a tapplet. Dispatch is an explicit
     * allowlist - never a dynamic lookup on the prototype - so a tapplet can't reach anything
     * beyond the methods below, and argument shapes are validated before any Tauri command runs.
     */
    async runOne(method: unknown, args: unknown): Promise<any> {
        const callArgs: unknown[] = Array.isArray(args) ? args : [];

        switch (method) {
            case 'isConnected':
                return this.isConnected();
            case 'getAccount':
                return this.getAccount();
            case 'getAppLanguage':
                return this.getAppLanguage();
            case 'getBackendBridgeTxs':
                return this.getBackendBridgeTxs();
            case 'getBaseNodeStatus':
                return this.getBaseNodeStatus();
            case 'getBridgeEnvs':
                return this.getBridgeEnvs();
            case 'getNetwork':
                return this.getNetwork();
            case 'getOngoingBridgeTx':
                return this.getOngoingBridgeTx();
            case 'getTariBalance':
                return this.getTariBalance();
            case 'removeOngoingBridgeTx':
                return this.removeOngoingBridgeTx();
            case 'setOngoingBridgeTx': {
                const tx = callArgs[0];
                if (!isBridgeTxDetails(tx)) return invalidArgsResult(method);
                return this.setOngoingBridgeTx(tx);
            }
            case 'sendOneSided': {
                const req = callArgs[0];
                if (!isSendOneSidedRequest(req)) return invalidArgsResult(method);
                return this.sendOneSided(req);
            }
            case 'getOotleAccount':
                return this.getOotleAccount();
            case 'getOotleBalance':
                return this.getOotleBalance();
            case 'sendOotleStealth': {
                const req = callArgs[0];
                if (!isSendOotleStealthRequest(req)) return invalidArgsResult(method);
                return this.sendOotleStealth(req);
            }
            case 'waitOotleTransaction': {
                const req = callArgs[0];
                if (!isWaitOotleTransactionRequest(req)) return invalidArgsResult(method);
                return this.waitOotleTransaction(req);
            }
            default:
                console.warn(`Blocked tapplet signer call to unsupported method "${String(method)}"`);
                return { error: `Unsupported tapplet signer method: ${String(method)}` };
        }
    }

    public async getAccount(): Promise<AccountData> {
        return {
            account_id: 0, // default id - currently we don't support multi accounts
            // Use only base address that have seed words
            address: useWalletStore.getState().tari_address_base58,
        };
    }

    public async isConnected(): Promise<boolean> {
        return true;
    }

    public async setOngoingBridgeTx(tx: BridgeTxDetails): Promise<void> {
        setTx(tx);
    }

    public async removeOngoingBridgeTx(): Promise<void> {
        removeTx();
    }

    public async getOngoingBridgeTx(): Promise<BridgeTxDetails | undefined> {
        const bridgeTx = useTappletsStore.getState().ongoingBridgeTx;
        return bridgeTx;
    }

    public async sendOneSided(req: SendOneSidedRequest): Promise<boolean> {
        try {
            await invoke('send_one_sided_to_stealth_address', {
                amount: req.amount,
                destination: req.address,
                paymentId: req.paymentId,
            });
            return true;
        } catch (error) {
            setStoreError(`Error sending transaction: ${error}`);
            return false;
        }
    }

    public async getOotleAccount(): Promise<OotleAccountData | { error: string }> {
        const account = await defaultOotleAccount();
        if (!account) return L2_UNAVAILABLE;
        const network = await invoke('get_network');
        return { address: account.address, network: network as string };
    }

    /** The L2 state has no pending balance, so `pending` is always 0. */
    public async getOotleBalance(): Promise<OotleBalance | { error: string }> {
        const account = await defaultOotleAccount();
        if (!account) return L2_UNAVAILABLE;
        const available = BigInt(account.balance.revealed) + BigInt(account.balance.confidential);
        return { available: available.toString(), pending: '0' };
    }

    /** Sends from the default L2 account. `l2_send` asks for the PIN, a failure or denial throws. */
    public async sendOotleStealth(
        req: SendOotleStealthRequest
    ): Promise<{ transactionId: string } | { error: string }> {
        const account = await defaultOotleAccount();
        if (!account) return L2_UNAVAILABLE;
        try {
            await invoke('l2_validate_address', { address: req.address });
        } catch {
            return invalidArgsResult('sendOotleStealth');
        }
        const transactionId = await invoke<string>('l2_send', {
            account: account.component_address,
            destination: req.address,
            amount: microToXtr(req.amount),
            payRef: req.payRef,
        });
        return { transactionId };
    }

    /** Polls the L2 state until the transaction leaves New/Pending, or the timeout runs out. */
    public async waitOotleTransaction(
        req: WaitOotleTransactionRequest
    ): Promise<{ status: string } | { error: string }> {
        const deadline = Date.now() + req.timeoutSecs * 1000;
        let status = 'Pending';
        while (Date.now() < deadline) {
            let state: L2WalletState;
            try {
                state = await invoke<L2WalletState>('l2_get_state');
            } catch {
                return L2_UNAVAILABLE;
            }
            for (const account of state.accounts) {
                const tx = account.transactions.find((t) => t.id === req.transactionId);
                if (tx) status = tx.status;
            }
            if (status !== 'New' && status !== 'Pending') return { status };
            await new Promise((resolve) => setTimeout(resolve, WAIT_POLL_MS));
        }
        return { status };
    }

    public async getBaseNodeStatus(): Promise<BaseNodeStatus> {
        const status = await invoke('get_base_node_status');
        return status;
    }
    /** Maps the wallet's `AccountBalance` onto the field names the shipped bridge tapplet reads. */
    public async getTariBalance(): Promise<TappletWalletBalance> {
        const accountBalance = useWalletStore.getState().account_balance;
        return {
            available_balance: accountBalance?.available || 0,
            timelocked_balance: accountBalance?.locked || 0,
            pending_incoming_balance: accountBalance?.unconfirmed || 0,
            pending_outgoing_balance: 0,
        };
    }

    public async getAppLanguage(): Promise<string | undefined> {
        const appLanguage = useConfigUIStore.getState().application_language;
        return appLanguage;
    }

    public async getBridgeEnvs(): Promise<BridgeEnvs | undefined> {
        try {
            const envs = await invoke('get_bridge_envs');
            return envs;
        } catch (error) {
            setStoreError(`Error sending transaction: ${error}`);
        }
    }

    public async getNetwork(): Promise<string | undefined> {
        try {
            const network = await invoke('get_network');
            return network as string;
        } catch (error) {
            setStoreError(`Error getting Tari network: ${error}`);
        }
    }

    public async getBackendBridgeTxs(): Promise<BackendBridgeTransaction[]> {
        const bridgeTxs = useWalletStore.getState().bridge_transactions;
        return bridgeTxs;
    }
}
