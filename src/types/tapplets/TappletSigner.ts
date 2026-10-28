import { BackendBridgeTransaction, setError as setStoreError, useConfigUIStore, useWalletStore } from '@app/store';
import { invoke } from '@tauri-apps/api/core';
import { BaseNodeStatus, BridgeEnvs } from '../app-status';
import { L2Account, L2WalletState } from '../events-payloads';
import { selectL2Account, useL2WalletStore } from '@app/store/useL2WalletStore.ts';
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
const MICRO_AMOUNT_RE = /^[1-9][0-9]{0,15}$/;
/** Above this the PIN prompt, which gets the amount as a JS number, could show a different amount. */
const MAX_MICRO_AMOUNT = BigInt(Number.MAX_SAFE_INTEGER);
/** Ootle addresses and transaction ids are far shorter; this only bounds what a tapplet can send. */
const MAX_FIELD_LENGTH = 300;
/**
 * After a denied PIN prompt, tapplet sends are refused this long, doubling per denial up to the max.
 * A success, or no denial for the max after a cooldown ends, starts it over.
 */
const DENIAL_COOLDOWN_MS = 10_000;
const MAX_DENIAL_COOLDOWN_MS = 5 * 60_000;
/** After a send that failed for any other reason. */
const FAILURE_COOLDOWN_MS = 3_000;
/** A new wait for an id starts polling no sooner than this after the last one ended. */
const WAIT_RESTART_MS = 5_000;
const MAX_WAIT_SECS = 600;
const WAIT_POLL_MS = 2000;
const MAX_OOTLE_WAITS = 4;
/** The backend's errors for a cancelled or timed-out PIN prompt, a wrong PIN, a lockout or a denied dialog. */
const PIN_DENIED_RE = /PIN entry cancelled|Wrong PIN entered|Pin is locked out|Transaction denied by user/;
/** Transaction statuses that won't change any more; anything else keeps the wait polling. */
const FINAL_TX_STATUSES = ['Accepted', 'Rejected', 'InvalidTransaction', 'OnlyFeeAccepted'];

function invalidArgsResult(method: string): { error: string } {
    console.warn(`Blocked tapplet signer call to "${method}" with invalid arguments`);
    return { error: `Invalid arguments for tapplet signer method: ${method}` };
}

/** The signer refusing a call (bad arguments, 'busy'). The tapplet gets a `resultError`, the user no toast. */
export class TappletSignerRejection extends Error {}

/** For the Ootle methods: bad arguments throw, so the tapplet gets a `resultError` reply. */
function invalidArgsError(method: string): Error {
    console.warn(`Blocked tapplet signer call to "${method}" with invalid arguments`);
    return new TappletSignerRejection(`Invalid arguments for tapplet signer method: ${method}`);
}

function busyError(): Error {
    return new TappletSignerRejection('busy');
}

type SendOutcome = 'sent' | 'denied' | 'failed' | 'none';

/** Backend error text stays local: the tapplet gets only 'denied' or 'failed'. */
function backendError(method: string, error: unknown): Error {
    console.error(`Tapplet signer method "${method}" failed: ${error}`);
    return new Error(PIN_DENIED_RE.test(`${error}`) ? 'denied' : 'failed');
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
        BigInt(req.amount) <= MAX_MICRO_AMOUNT &&
        isNonEmptyString(req.address) &&
        req.address === req.address.trim() &&
        req.address.length <= MAX_FIELD_LENGTH &&
        typeof req.payRef === 'string' &&
        PAY_REF_RE.test(req.payRef)
    );
}

function isWaitOotleTransactionRequest(value: unknown): value is WaitOotleTransactionRequest {
    if (!value || typeof value !== 'object') return false;
    const req = value as Record<string, unknown>;
    return (
        isNonEmptyString(req.transactionId) &&
        req.transactionId.length <= MAX_FIELD_LENGTH &&
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

/** The open L2 wallet's default account from `l2_get_state`, or undefined when L2 can't be used right now. */
async function readOotleAccount(): Promise<L2Account | undefined> {
    let state: L2WalletState;
    try {
        state = await invoke<L2WalletState>('l2_get_state');
    } catch {
        return undefined;
    }
    if (!state.enabled || state.locked) return undefined;
    return selectL2Account(state);
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
    /** One tapplet send (L1 or L2) at a time, so queued sends can't take over the user's PIN prompts. */
    private sendInFlight = false;
    private sendCooldownUntil = 0;
    /** Denials since the last successful send; each one doubles the cooldown. */
    private denials = 0;
    private denialCooldownUntil = 0;
    /** When the last wait for each id finished. */
    private ootleWaitEndedAt = new Map<string, number>();
    /** Ids sendOotleStealth returned; the only ones waitOotleTransaction will poll for. */
    private ootleSentIds = new Set<string>();
    /** Running waits by transaction id, so a remounted tapplet joins the wait it left behind. */
    private ootleWaits = new Map<string, Promise<{ status: string } | { error: string }>>();

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
                if (!isSendOotleStealthRequest(req)) throw invalidArgsError(method);
                return this.sendOotleStealth(req);
            }
            case 'waitOotleTransaction': {
                const req = callArgs[0];
                if (!isWaitOotleTransactionRequest(req)) throw invalidArgsError(method);
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

    /**
     * The open L2 wallet's default account, or undefined when L2 can't be used right now. Taken from
     * the L2 store the wallet events keep current, so a tapplet polling these methods doesn't make the
     * wallet rebuild its state each time. Only when the store has no open wallet does it ask
     * `l2_get_state`, which answers without touching the wallet when it is locked, off or not on L2.
     */
    private async defaultOotleAccount(): Promise<L2Account | undefined> {
        const stored = useL2WalletStore.getState();
        if (stored.enabled && !stored.locked && stored.accounts.length > 0) return selectL2Account(stored);
        return readOotleAccount();
    }

    /** Throws 'busy' while another tapplet send runs or a denial cooldown is on, else claims the slot. */
    private startTappletSend(): void {
        if (this.sendInFlight || Date.now() < this.sendCooldownUntil) throw busyError();
        this.sendInFlight = true;
    }

    private finishTappletSend(outcome: SendOutcome): void {
        this.sendInFlight = false;
        if (outcome === 'sent') this.denials = 0;
        if (outcome === 'denied') {
            if (Date.now() >= this.denialCooldownUntil + MAX_DENIAL_COOLDOWN_MS) this.denials = 0;
            const cooldown = Math.min(DENIAL_COOLDOWN_MS * 2 ** this.denials, MAX_DENIAL_COOLDOWN_MS);
            this.denialCooldownUntil = Date.now() + cooldown;
            this.sendCooldownUntil = this.denialCooldownUntil;
            this.denials += 1;
        }
        if (outcome === 'failed') this.sendCooldownUntil = Date.now() + FAILURE_COOLDOWN_MS;
    }

    public async sendOneSided(req: SendOneSidedRequest): Promise<boolean> {
        this.startTappletSend();
        let outcome: SendOutcome = 'none';
        try {
            await invoke('send_one_sided_to_stealth_address', {
                amount: req.amount,
                destination: req.address,
                paymentId: req.paymentId,
            });
            outcome = 'sent';
            return true;
        } catch (error) {
            outcome = PIN_DENIED_RE.test(`${error}`) ? 'denied' : 'failed';
            setStoreError(`Error sending transaction: ${error}`);
            return false;
        } finally {
            this.finishTappletSend(outcome);
        }
    }

    public async getOotleAccount(): Promise<OotleAccountData | { error: string }> {
        const account = await this.defaultOotleAccount();
        if (!account) return L2_UNAVAILABLE;
        try {
            const network = await invoke('get_network');
            return { address: account.address, network: network as string };
        } catch (error) {
            throw backendError('getOotleAccount', error);
        }
    }

    /** The L2 state has no pending balance, so `pending` is always 0. */
    public async getOotleBalance(): Promise<OotleBalance | { error: string }> {
        const account = await this.defaultOotleAccount();
        if (!account) return L2_UNAVAILABLE;
        return { available: account.balance.total, pending: '0' };
    }

    /**
     * Sends from the default L2 account behind the PIN prompt, labelled as a tapplet send.
     * Throws 'busy' while another send is in flight or after a denial, 'denied' or 'failed' when
     * the backend refuses.
     */
    public async sendOotleStealth(
        req: SendOotleStealthRequest
    ): Promise<{ transactionId: string } | { error: string }> {
        this.startTappletSend();
        let outcome: SendOutcome = 'none';
        try {
            const account = await this.defaultOotleAccount();
            if (!account) return L2_UNAVAILABLE;
            try {
                await invoke('l2_validate_address', { address: req.address });
            } catch {
                throw invalidArgsError('sendOotleStealth');
            }
            try {
                const transactionId = await invoke<string>('l2_send_from_tapplet', {
                    account: account.component_address,
                    destination: req.address,
                    amount: microToXtr(req.amount),
                    payRef: req.payRef,
                });
                this.ootleSentIds.add(transactionId);
                outcome = 'sent';
                return { transactionId };
            } catch (error) {
                const code = backendError('sendOotleStealth', error);
                outcome = code.message === 'denied' ? 'denied' : 'failed';
                throw code;
            }
        } finally {
            this.finishTappletSend(outcome);
        }
    }

    /**
     * Polls the L2 state until the transaction reaches a final status, or the timeout runs out.
     * Only for ids sendOotleStealth returned. A repeat call for an id already being waited on
     * joins that wait and keeps its deadline. A new wait within five seconds of the last one for
     * this id starts polling once those five seconds are up; its timeout counts from then.
     * Throws 'busy' when four other ids are waited on.
     */
    public async waitOotleTransaction(
        req: WaitOotleTransactionRequest
    ): Promise<{ status: string } | { error: string }> {
        if (!this.ootleSentIds.has(req.transactionId)) throw invalidArgsError('waitOotleTransaction');
        const running = this.ootleWaits.get(req.transactionId);
        if (running) return running;
        if (this.ootleWaits.size >= MAX_OOTLE_WAITS) throw busyError();
        const endedAt = this.ootleWaitEndedAt.get(req.transactionId) ?? -Infinity;
        const delayMs = endedAt + WAIT_RESTART_MS - Date.now();
        const start = delayMs > 0 ? new Promise((resolve) => setTimeout(resolve, delayMs)) : Promise.resolve();
        const wait = start
            .then(() => this.pollOotleTransaction(req))
            .finally(() => {
                this.ootleWaits.delete(req.transactionId);
                this.ootleWaitEndedAt.set(req.transactionId, Date.now());
            });
        this.ootleWaits.set(req.transactionId, wait);
        return wait;
    }

    private async pollOotleTransaction(
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
            if (FINAL_TX_STATUSES.includes(status)) return { status };
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
