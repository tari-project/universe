/** Burns before this are "pre-burns": 11 November 2026, 00:00 UTC. After it a burn is just a burn. */
export const PRE_BURN_ENDS = Date.UTC(2026, 10, 11);

export function isPreBurn(now = Date.now()): boolean {
    return now < PRE_BURN_ENDS;
}
