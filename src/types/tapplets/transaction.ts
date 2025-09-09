import { TappletSigner } from './TappletSigner';

export interface TransactionEvent {
    payload: {
        methodName: Exclude<keyof TappletSigner, 'runOne'>;
        /* eslint-disable @typescript-eslint/no-explicit-any */
        args: any[];
        id: number;
    };
}
