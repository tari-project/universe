import { TappletProvider } from './TappletProvider';

export interface TransactionEvent {
    methodName: Exclude<keyof TappletProvider, 'runOne'>;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    args: any[];
    id: number;
}
