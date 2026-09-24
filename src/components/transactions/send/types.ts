export interface SendInputs {
    message?: string;
    address: string;
    amount?: number;
    /** Burn only: hex L2 claim public key. */
    claimPublicKey?: string;
}
export type InputName = keyof SendInputs;
