/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import type { TrancheStatus } from '@app/types/airdrop-claim';

// Mock Tauri internals before any imports that trigger store barrel
beforeAll(() => {
    (window as any).__TAURI_INTERNALS__ = {
        metadata: { currentWindow: { label: 'main' } },
        invoke: vi.fn(),
    };
});

// Must be imported after Tauri mock is set up — use dynamic import
let calculateBalanceSummary: (trancheStatus: TrancheStatus, nextTrancheAmount?: number) => any;

beforeAll(async () => {
    const mod = await import('./useTrancheStatus');
    calculateBalanceSummary = mod.calculateBalanceSummary;
});

describe('calculateBalanceSummary', () => {
    it('calculates totals for empty tranches', () => {
        const status: TrancheStatus = {
            totalTranches: 0,
            claimedCount: 0,
            availableCount: 0,
            nextAvailable: null,
            tranches: [],
        };
        const result = calculateBalanceSummary(status);

        expect(result.totalXtm).toBe(0);
        expect(result.totalClaimed).toBe(0);
        expect(result.totalPending).toBe(0);
        expect(result.totalExpired).toBe(0);
        expect(result.nextAvailableAmount).toBeUndefined();
    });

    it('calculates totals for all claimed tranches', () => {
        const status: TrancheStatus = {
            totalTranches: 3,
            claimedCount: 3,
            availableCount: 0,
            nextAvailable: null,
            tranches: [
                {
                    id: '1',
                    trancheNumber: 1,
                    amount: 1000,
                    validFrom: '2025-01-01',
                    validTo: '2025-12-31',
                    claimed: true,
                    claimedAt: '2025-06-01',
                    canClaim: false,
                },
                {
                    id: '2',
                    trancheNumber: 2,
                    amount: 2000,
                    validFrom: '2025-01-01',
                    validTo: '2025-12-31',
                    claimed: true,
                    claimedAt: '2025-06-01',
                    canClaim: false,
                },
                {
                    id: '3',
                    trancheNumber: 3,
                    amount: 3000,
                    validFrom: '2025-01-01',
                    validTo: '2025-12-31',
                    claimed: true,
                    claimedAt: '2025-06-01',
                    canClaim: false,
                },
            ],
        };
        const result = calculateBalanceSummary(status);

        expect(result.totalXtm).toBe(6000);
        expect(result.totalClaimed).toBe(6000);
        expect(result.totalPending).toBe(0);
        expect(result.totalExpired).toBe(0);
    });

    it('calculates totals for all pending tranches', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const status: TrancheStatus = {
            totalTranches: 2,
            claimedCount: 0,
            availableCount: 2,
            nextAvailable: null,
            tranches: [
                {
                    id: '1',
                    trancheNumber: 1,
                    amount: 1000,
                    validFrom: '2025-01-01',
                    validTo: futureDate.toISOString(),
                    claimed: false,
                    claimedAt: null,
                    canClaim: true,
                },
                {
                    id: '2',
                    trancheNumber: 2,
                    amount: 2000,
                    validFrom: '2025-01-01',
                    validTo: futureDate.toISOString(),
                    claimed: false,
                    claimedAt: null,
                    canClaim: true,
                },
            ],
        };
        const result = calculateBalanceSummary(status);

        expect(result.totalXtm).toBe(3000);
        expect(result.totalClaimed).toBe(0);
        expect(result.totalPending).toBe(3000);
        expect(result.totalExpired).toBe(0);
    });

    it('calculates totals for expired tranches', () => {
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);

        const status: TrancheStatus = {
            totalTranches: 2,
            claimedCount: 0,
            availableCount: 0,
            nextAvailable: null,
            tranches: [
                {
                    id: '1',
                    trancheNumber: 1,
                    amount: 1000,
                    validFrom: '2023-01-01',
                    validTo: pastDate.toISOString(),
                    claimed: false,
                    claimedAt: null,
                    canClaim: false,
                },
                {
                    id: '2',
                    trancheNumber: 2,
                    amount: 2000,
                    validFrom: '2023-01-01',
                    validTo: pastDate.toISOString(),
                    claimed: false,
                    claimedAt: null,
                    canClaim: false,
                },
            ],
        };
        const result = calculateBalanceSummary(status);

        expect(result.totalXtm).toBe(3000);
        expect(result.totalClaimed).toBe(0);
        expect(result.totalPending).toBe(0);
        expect(result.totalExpired).toBe(3000);
    });

    it('calculates mixed tranche states correctly', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);

        const status: TrancheStatus = {
            totalTranches: 4,
            claimedCount: 2,
            availableCount: 1,
            nextAvailable: null,
            tranches: [
                {
                    id: '1',
                    trancheNumber: 1,
                    amount: 1000,
                    validFrom: '2025-01-01',
                    validTo: '2025-12-31',
                    claimed: true,
                    claimedAt: '2025-06-01',
                    canClaim: false,
                },
                {
                    id: '2',
                    trancheNumber: 2,
                    amount: 2000,
                    validFrom: '2025-01-01',
                    validTo: futureDate.toISOString(),
                    claimed: false,
                    claimedAt: null,
                    canClaim: true,
                },
                {
                    id: '3',
                    trancheNumber: 3,
                    amount: 3000,
                    validFrom: '2023-01-01',
                    validTo: pastDate.toISOString(),
                    claimed: false,
                    claimedAt: null,
                    canClaim: false,
                },
                {
                    id: '4',
                    trancheNumber: 4,
                    amount: 4000,
                    validFrom: '2023-01-01',
                    validTo: pastDate.toISOString(),
                    claimed: true,
                    claimedAt: '2024-01-01',
                    canClaim: false,
                },
            ],
        };
        const result = calculateBalanceSummary(status);

        expect(result.totalXtm).toBe(10000);
        expect(result.totalClaimed).toBe(5000);
        expect(result.totalPending).toBe(2000);
        expect(result.totalExpired).toBe(3000);
    });

    it('claimed tranches are not counted as expired even if past validTo', () => {
        const pastDate = new Date();
        pastDate.setFullYear(pastDate.getFullYear() - 1);

        const status: TrancheStatus = {
            totalTranches: 1,
            claimedCount: 1,
            availableCount: 0,
            nextAvailable: null,
            tranches: [
                {
                    id: '1',
                    trancheNumber: 1,
                    amount: 5000,
                    validFrom: '2023-01-01',
                    validTo: pastDate.toISOString(),
                    claimed: true,
                    claimedAt: '2024-01-01',
                    canClaim: false,
                },
            ],
        };
        const result = calculateBalanceSummary(status);

        expect(result.totalXtm).toBe(5000);
        expect(result.totalClaimed).toBe(5000);
        expect(result.totalPending).toBe(0);
        expect(result.totalExpired).toBe(0);
    });

    it('passes through nextTrancheAmount', () => {
        const status: TrancheStatus = {
            totalTranches: 1,
            claimedCount: 0,
            availableCount: 0,
            nextAvailable: null,
            tranches: [
                {
                    id: '1',
                    trancheNumber: 1,
                    amount: 1000,
                    validFrom: '2025-01-01',
                    validTo: '2027-12-31',
                    claimed: false,
                    claimedAt: null,
                    canClaim: false,
                },
            ],
        };
        const result = calculateBalanceSummary(status, 500);

        expect(result.nextAvailableAmount).toBe(500);
    });

    it('handles tranches with program field', () => {
        const futureDate = new Date();
        futureDate.setFullYear(futureDate.getFullYear() + 1);

        const status: TrancheStatus = {
            totalTranches: 2,
            claimedCount: 1,
            availableCount: 1,
            nextAvailable: null,
            tranches: [
                {
                    id: '1',
                    trancheNumber: 1,
                    amount: 1000,
                    validFrom: '2025-01-01',
                    validTo: '2025-12-31',
                    claimed: true,
                    claimedAt: '2025-06-01',
                    canClaim: false,
                    program: 'airdrop',
                },
                {
                    id: '2',
                    trancheNumber: 1,
                    amount: 500,
                    validFrom: '2025-01-01',
                    validTo: futureDate.toISOString(),
                    claimed: false,
                    claimedAt: null,
                    canClaim: true,
                    program: 'investor',
                },
            ],
        };
        const result = calculateBalanceSummary(status);

        expect(result.totalXtm).toBe(1500);
        expect(result.totalClaimed).toBe(1000);
        expect(result.totalPending).toBe(500);
    });
});
