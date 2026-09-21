import { TappletCallableMethod } from './TappletSigner';

export interface TransactionEvent {
    methodName: TappletCallableMethod;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    args: any[];
    id: number;
}
