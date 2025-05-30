import { setError as setStoreError, useConfigUIStore } from '@app/store';
import { invoke } from '@tauri-apps/api/core';
import { BridgeEnvs, WalletBalance } from '../app-status';
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
        const res = (this[method] as (...args: any) => Promise<any>)(...args);
        return res;
    }

    public async getAccount(): Promise<AccountData> {
        const tariAddress = await invoke('get_tari_wallet_address');
        return {
            account_id: 0, // default id - currently we don't support multi accounts
            address: tariAddress,
        };
    }

    public async isConnected(): Promise<boolean> {
        return true;
    }

    public async addPendingTappletTx(tx: BridgeTxDetails): Promise<void> {
        const addTx = useTappletsStore.getState().addPendingTappletTx;
        addTx(tx);
    }

    public async removePendingTappletTx(paymentId: string): Promise<void> {
        const removeTx = useTappletsStore.getState().removePendingTappletTx;
        removeTx(paymentId);
    }

    public async getPendingTappletTx(): Promise<BridgeTxDetails | undefined> {
        const bridgeTx = useTappletsStore.getState().pendingBridgeTx;
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

    public async getTariBalance(): Promise<WalletBalance> {
        const balance = await invoke('get_tari_wallet_balance');
        return balance;
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
}
