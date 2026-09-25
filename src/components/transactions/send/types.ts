export interface SendInputs {
    message?: string;
    address: string;
    amount?: number;
    /** Burn only: hex L2 claim public key. */
    claimPublicKey?: string;
    /** L2 send only: Ootle address to send to. */
    l2Address?: string;
}
export type InputName = keyof SendInputs;
