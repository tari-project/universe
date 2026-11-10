/**
 * TDD tests for scheduler mining mode transition guard logic.
 * Mirrors the Rust `plan_scheduled_miner_transition` semantics in TypeScript.
 *
 * Issue: https://github.com/tari-project/universe/issues/3494
 */
import { describe, it, expect } from 'vitest';
import { MiningModeType } from '@app/types/configs';
import { planScheduledMinerTransition, isModeChanged } from './schedulerModeTransition';

describe('isModeChanged', () => {
    it('returns false when modes are identical', () => {
        expect(isModeChanged(MiningModeType.Eco, MiningModeType.Eco)).toBe(false);
        expect(isModeChanged(MiningModeType.Turbo, MiningModeType.Turbo)).toBe(false);
    });

    it('returns true when modes differ', () => {
        expect(isModeChanged(MiningModeType.Eco, MiningModeType.Turbo)).toBe(true);
        expect(isModeChanged(MiningModeType.Ludicrous, MiningModeType.Eco)).toBe(true);
    });
});

describe('planScheduledMinerTransition', () => {
    // Case 1: mode changed + miner was running → stop then restart
    it('stops and restarts a running miner when mode changes', () => {
        const result = planScheduledMinerTransition({
            modeChanged: true,
            minerEnabled: true,
            minerWasRunning: true,
        });
        expect(result.stopRunning).toBe(true);
        expect(result.startEnabled).toBe(true);
    });

    // Case 2: same mode + miner running → NO restart (no hashrate drop)
    it('does NOT restart a running miner when mode is unchanged', () => {
        const result = planScheduledMinerTransition({
            modeChanged: false,
            minerEnabled: true,
            minerWasRunning: true,
        });
        expect(result.stopRunning).toBe(false);
        expect(result.startEnabled).toBe(false);
    });

    // Case 3: mode changed + miner disabled → stays off, never starts
    it('never starts a disabled miner even when mode changes', () => {
        const result = planScheduledMinerTransition({
            modeChanged: true,
            minerEnabled: false,
            minerWasRunning: false,
        });
        expect(result.stopRunning).toBe(false);
        expect(result.startEnabled).toBe(false);
    });

    // Case 4: mode changed + miner enabled but was NOT running → start it
    it('starts an enabled miner that was stopped when mode changes', () => {
        const result = planScheduledMinerTransition({
            modeChanged: true,
            minerEnabled: true,
            minerWasRunning: false,
        });
        expect(result.stopRunning).toBe(false);
        expect(result.startEnabled).toBe(true);
    });

    // Case 5: disabled miner that was somehow running → stop it, don't restart
    it('stops a running-but-disabled miner and does not restart it', () => {
        const result = planScheduledMinerTransition({
            modeChanged: true,
            minerEnabled: false,
            minerWasRunning: true,
        });
        expect(result.stopRunning).toBe(true);
        expect(result.startEnabled).toBe(false);
    });
});
