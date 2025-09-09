import { BackendBridgeTransaction, setError as setStoreError, useConfigUIStore, useWalletStore } from '@app/store';
import { invoke } from '@tauri-apps/api/core';
import { BaseNodeStatus, BridgeEnvs, WalletBalance } from '../app-status';
import { AccountData, BridgeTxDetails, SendOneSidedRequest, TappletSignerParams, WindowSize } from './tapplet.types';
import { useTappletsStore } from '@app/store/useTappletsStore';
import { IPCRpcTransport, TappletSignerL2 } from './TappletSignerL2';
import { WalletDaemonClient } from '@tari-project/wallet_jrpc_client';

export class TappletSigner extends TappletSignerL2 {
    public providerName = 'TappletSigner';
    id: string;
    params: TappletSignerParams;

    private constructor(
        params: TappletSignerParams,
        connection: WalletDaemonClient,
        public width = 0,
        public height = 0
    ) {
        super(params, connection);
        this.params = params;
        this.id = params.id;
    }

    static build(params: TappletSignerParams): TappletSigner {
        const client = WalletDaemonClient.new(new IPCRpcTransport());
        return new TappletSigner(params, client);
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
    async runOne(method: any, args: any[]): Promise<any> {
        // Check if method exists on the class prototype
        if (method in TappletSigner.prototype) {
            // Call the method with the correct 'this' context and args
            const res = (this[method] as (...args: any) => Promise<any>)(...args);
            return res;
        } else {
            console.warn(`Method "${method}" does not exist on TappletSigner.`);
            return undefined;
        }
    }

    // TODO MAKE SURE BRIDGE USES RENAMED 'getTariAccount'!
    public async getTariAccount(): Promise<AccountData> {
        return {
            account_id: 0, // default id - currently we don't support multi accounts
            // Use only base address that have seed words
            address: useWalletStore.getState().tari_address_base58,
        };
    }

    public async setOngoingBridgeTx(tx: BridgeTxDetails): Promise<void> {
        const setTx = useTappletsStore.getState().setOngoingBridgeTx;
        setTx(tx);
    }

    public async removeOngoingBridgeTx(): Promise<void> {
        const removeTx = useTappletsStore.getState().removeOngoingBridgeTx;
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

    public async getTariBalance(): Promise<WalletBalance> {
        const walletBalance = useWalletStore.getState().balance;
        return (
            walletBalance ?? {
                available_balance: 0,
                timelocked_balance: 0,
                pending_incoming_balance: 0,
                pending_outgoing_balance: 0,
            }
        );
    }

    public async getAppLanguage(): Promise<string | undefined> {
        const appLanguage = useConfigUIStore.getState().application_language;
        return appLanguage;
    }

    public async getBridgeEnvs(): Promise<BridgeEnvs | undefined> {
        try {
            console.warn(`🔥ENVS GET"`);
            const envs = await invoke('get_bridge_envs');
            console.warn(`🔥ENVS "${envs}"`);
            return envs;
        } catch (error) {
            setStoreError(`Error sending transaction: ${error}`);
        }
    }

    public async getBackendBridgeTxs(): Promise<BackendBridgeTransaction[]> {
        const bridgeTxs = useWalletStore.getState().bridge_transactions;
        return bridgeTxs;
    }
}
