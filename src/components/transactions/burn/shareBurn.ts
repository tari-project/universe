import { FormatPreset, formatNumber } from '@app/utils/formatters';

/** Burns before this are "pre-burns": 11 November 2026, 00:00 UTC. After it a burn is just a burn. */
export const PRE_BURN_ENDS = Date.UTC(2026, 10, 11);

export const BURNS_PAGE_URL = 'https://tari.com/burns';

export function isPreBurn(now = Date.now()): boolean {
    return now < PRE_BURN_ENDS;
}

/** The X post composer with `text` filled in. */
export function xPostUrl(text: string): string {
    return `https://x.com/intent/post?text=${encodeURIComponent(text)}`;
}

export function shareAmount(amountMicroMinotari: number): string {
    return formatNumber(amountMicroMinotari, FormatPreset.XTM_COMPACT);
}
