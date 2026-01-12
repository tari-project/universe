import { BackendBridgeTransaction, setError as setStoreError, useConfigUIStore, useWalletStore } from '@app/store';
import { invoke } from '@tauri-apps/api/core';
import { BaseNodeStatus, BridgeEnvs, WalletBalance } from '../app-status';
import { AccountData, BridgeTxDetails, SendOneSidedRequest, TappletSignerParams, WindowSize } from './tapplet.types';
import { useTappletsStore } from '@app/store/useTappletsStore';

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
    async runOne(method: any, args: any[]): Promise<any> {
        // Check if method exists on the class prototype
        if (method in TappletSigner.prototype) {
            // Call the method with the correct 'this' context and args

            return (this[method] as (...args: any) => Promise<any>)(...args);
        } else {
            console.warn(`Method "${method}" does not exist on TappletSigner.`);
            return undefined;
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
        const setTx = useTappletsStore.getState().setOngoingBridgeTx;
        setTx(tx);
    }

    public async removeOngoingBridgeTx(): Promise<void> {
        const removeTx = useTappletsStore.getState().removeOngoingBridgeTx;
        removeTx();
    }

    public async getOngoingBridgeTx(): Promise<BridgeTxDetails | undefined> {
        return useTappletsStore.getState().ongoingBridgeTx;
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
        return await invoke('get_base_node_status');
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
        return useConfigUIStore.getState().application_language;
    }

    public async getBridgeEnvs(): Promise<BridgeEnvs | undefined> {
        try {
            const envs = await invoke('get_bridge_envs');
            if (envs && envs.every((e) => e.length)) {
                return envs;
            } else {
                console.error(`Error getting bridge envs, none returned`);
            }
        } catch (error) {
            console.error(`Error getting bridge envs: `, error);
            setStoreError(`Error getting bridge envs: ${error}`);
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
        return useWalletStore.getState().bridge_transactions;
    }
}
