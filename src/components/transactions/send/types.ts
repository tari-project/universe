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

const COMMAND_ERROR_RE = /^\[([a-z_]+)\] /;

/** The code the backend puts first in a send, burn or abandon error (`[code] message`). Only the
 * leading code counts: the message after it can carry text from a base node. */
export function commandErrorCode(error: unknown): string | undefined {
    return COMMAND_ERROR_RE.exec(String(error))?.[1];
}

/** The translation key for a send or burn error that is the user's call or theirs to fix, by its code. */
export function sendErrorKey(error: unknown): string | undefined {
    switch (commandErrorCode(error)) {
        case 'pin_cancelled':
        case 'denied':
            return 'send.error-denied';
        case 'timeout':
            return 'send.error-timeout';
        case 'change_not_affordable':
            return 'send.error-change-not-affordable';
        default:
            return undefined;
    }
}

/** The error's message, without its code. */
export function commandErrorMessage(error: unknown): string {
    return String(error).replace(COMMAND_ERROR_RE, '');
}
