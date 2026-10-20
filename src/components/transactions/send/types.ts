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

/** The wallet's refusal of a send or burn that leaves too little for its change output. */
export const CHANGE_NOT_AFFORDABLE_RE = /not enough funds for a change output/i;
