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
    public async getAccount(): Promise<any> {
        console.info('🤝🤝🤝🤝🤝🤝🤝🤝🤝   [TU Tapplet][TEST][getAccount]');
    }

    public isConnected(): boolean {
        return true; //TODO tmp solution shoule be better one
    }

    // TODO JUST TEST - RENAME AND REFACTOR THIS FCT
    public async getPublicKey(branch: string, index: number): Promise<any> {
        console.info('🤝🤝🤝🤝🤝🤝🤝🤝🤝   [TU Tapplet][TEST][IS CONNECTED]');
        const payload = {
            amount: index ?? 1,
            destination: 'f22p3ubvTRM2SW6qrBg1gYb2gSbrWygByywTv14YU13umzphPWV2jDkZHZb1WN7nLKsYTesaZEnGt3vTpVoQBrhZxHj',
            paymentId: branch,
        };
        console.info('🤝🤝🤝🤝🤝🤝🤝🤝🤝 [TU Tapplet][TEST] payload', payload);
        try {
            // if (!address || !amount) {
            //     setStoreError(`Transaction arguments missing`);
            //     return;
            // }

            await invoke('send_one_sided_to_stealth_address', {
                ...payload,
                amount: payload.amount.toString(),
            });
        } catch (error) {
            setStoreError(`Error sending transaction: ${error}`);
        }
    }
}
