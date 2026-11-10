/**
 * Pure TypeScript mirror of the Rust `plan_scheduled_miner_transition` logic.
 * Used to guard scheduled `Mine { mining_mode }` events against:
 *  - unnecessary restarts when mode is unchanged (no hashrate drop)
 *  - starting disabled miners
 *  - leaving running miners with stale mode settings
 *
 * Issue: https://github.com/tari-project/universe/issues/3494
 */
import { MiningModeType } from '@app/types/configs';

export interface MinerTransitionInput {
    modeChanged: boolean;
    minerEnabled: boolean;
    minerWasRunning: boolean;
}

export interface MinerTransitionResult {
    /** Whether the miner should be stopped before the config update */
    stopRunning: boolean;
    /** Whether the miner should be started after the config update */
    startEnabled: boolean;
}

/**
 * Determines whether a mode change has actually occurred.
 * Uses strict enum comparison — no implicit string coercion.
 */
export function isModeChanged(current: MiningModeType, incoming: MiningModeType): boolean {
    return current !== incoming;
}

/**
 * Decides stop/start actions for a single miner (CPU or GPU) during a
 * scheduled `Mine` event.
 *
 * Rules (mirrors Rust `plan_scheduled_miner_transition`):
 *  - stop  = mode changed AND miner was running
 *  - start = miner enabled AND (was not running OR mode changed)
 */
export function planScheduledMinerTransition(input: MinerTransitionInput): MinerTransitionResult {
    const { modeChanged, minerEnabled, minerWasRunning } = input;
    const stopRunning = modeChanged && minerWasRunning;
    const startEnabled = minerEnabled && (!minerWasRunning || modeChanged);
    return { stopRunning, startEnabled };
}
