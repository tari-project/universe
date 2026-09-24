import { BackendBridgeTransaction, setError as setStoreError, useConfigUIStore, useWalletStore } from '@app/store';
import { invoke } from '@tauri-apps/api/core';
import { BaseNodeStatus, BridgeEnvs } from '../app-status';
import {
    AccountData,
    BridgeTxDetails,
    SendOneSidedRequest,
    TappletSignerParams,
    TappletWalletBalance,
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
    | 'sendOneSided';

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
