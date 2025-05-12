import { SendInputs } from '@app/components/transactions/send/types';
import { setError as setStoreError } from '@app/store';

import { invoke } from '@tauri-apps/api/core';

export interface WindowSize {
    width: number;
    height: number;
}

export interface TappletProviderParams {
    id: string;
    name?: string;
    onConnection?: () => void;
}

export interface AccountData {
    account_id: number;
    address: string;
}

export class TappletProvider {
    public providerName = 'TappletProvider';
    id: string;
    params: TappletProviderParams;

    private constructor(
        params: TappletProviderParams,
        public width = 0,
        public height = 0
    ) {
        this.params = params;
        this.id = params.id;
    }

    static build(params: TappletProviderParams): TappletProvider {
        return new TappletProvider(params);
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

    // TODO JUST TEST - RENAME AND REFACTOR THIS FCT
    public async getAccount(): Promise<AccountData> {
        console.info('🤝🤝🤝 [TU Tapplet][get account]');
        const tariAddress = await invoke('get_tari_wallet_address');
        console.info('🤝🤝🤝 [TU Tapplet][get account] SUCCESS', tariAddress);
        return {
            account_id: 0,
            address: tariAddress,
        };
    }

    public async isConnected(): Promise<boolean> {
        console.info('🤝🤝🤝 [TU Tapplet][is connected]');
        return true; //TODO tmp solution shoule be better one
    }

    public async sendOneSided(req: SendOneSidedRequest): Promise<any> {
        console.info('🤝🤝🤝   [TU Tapplet][SEND ONE SIDED]');
        try {
            // if (!address || !amount) {
            //     setStoreError(`Transaction arguments missing`);
            //     return;
            // }
            console.info('🤝🤝🤝 [TU Tapplet][SEND ONE SIDED] req', { req });
            const payload = {
                amount: req.amount,
                destination: req.address,
                paymentId: req.message,
            };
            console.info('🤝🤝🤝 [TU Tapplet][SEND ONE SIDED] payload', { payload });

            await invoke('send_one_sided_to_stealth_address', {
                ...payload,
                amount: payload.amount.toString(),
            });
            console.info(
                '🤝🤝🤝 [TU Tapplet][SEND ONE SIDED] finished',
                payload.amount,
                payload.destination,
                payload.paymentId
            );
        } catch (error) {
            setStoreError(`Error sending transaction: ${error}`);
        }
    }
}

export interface SendOneSidedRequest {
    amount: number;
    address?: string;
    message?: string;
}
