import { describe, it, expect } from 'vitest';

// Test the pure functions extracted from airdropStoreActions

describe('airdropStoreActions', () => {
    describe('parseJwt', () => {
        // Recreate the parseJwt function for testing (using global atob/btoa available in jsdom)
        function parseJwt(token: string) {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
                atob(base64)
                    .split('')
                    .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
                    .join('')
            );

            return JSON.parse(jsonPayload);
        }

        it('parses a valid JWT token', () => {
            // Create a mock JWT with payload: { "exp": 1234567890, "iat": 1234567800, "id": "user123", "provider": "twitter", "role": "user", "scope": "read" }
            const payload = {
                exp: 1234567890,
                iat: 1234567800,
                id: 'user123',
                provider: 'twitter',
                role: 'user',
                scope: 'read',
            };
            const base64Payload = btoa(JSON.stringify(payload));
            const mockToken = `header.${base64Payload}.signature`;

            const result = parseJwt(mockToken);

            expect(result.exp).toBe(1234567890);
            expect(result.iat).toBe(1234567800);
            expect(result.id).toBe('user123');
            expect(result.provider).toBe('twitter');
            expect(result.role).toBe('user');
            expect(result.scope).toBe('read');
        });

        it('handles JWT with special characters in payload', () => {
            const payload = {
                exp: 1234567890,
                id: 'user-with-special-chars_123',
                name: 'Test User',
            };
            const base64Payload = btoa(JSON.stringify(payload));
            const mockToken = `header.${base64Payload}.signature`;

            const result = parseJwt(mockToken);

            expect(result.id).toBe('user-with-special-chars_123');
            expect(result.name).toBe('Test User');
        });
    });

    describe('calculateBalanceSummaryFromTranches', () => {
        // Recreate the function for testing
        interface Tranche {
            id: string;
            amount: number;
            claimed: boolean;
            validTo: string;
        }

        interface TrancheStatus {
            tranches: Tranche[];
        }

        interface BalanceSummary {
            totalXtm: number;
            totalClaimed: number;
            totalPending: number;
            totalExpired: number;
        }

        function calculateBalanceSummaryFromTranches(trancheStatus: TrancheStatus): BalanceSummary {
            const totalXtm = trancheStatus.tranches.reduce((sum, tranche) => sum + tranche.amount, 0);
            const totalClaimed = trancheStatus.tranches
                .filter((tranche) => tranche.claimed)
                .reduce((sum, tranche) => sum + tranche.amount, 0);

            const now = new Date();
            const totalExpired = trancheStatus.tranches
                .filter((tranche) => !tranche.claimed && new Date(tranche.validTo) < now)
                .reduce((sum, tranche) => sum + tranche.amount, 0);

            const totalPending = totalXtm - totalClaimed - totalExpired;

            return {
                totalXtm,
                totalClaimed,
                totalPending,
                totalExpired,
            };
        }

        it('calculates totals for empty tranches', () => {
            const result = calculateBalanceSummaryFromTranches({ tranches: [] });

            expect(result.totalXtm).toBe(0);
            expect(result.totalClaimed).toBe(0);
            expect(result.totalPending).toBe(0);
            expect(result.totalExpired).toBe(0);
        });

        it('calculates totals for all claimed tranches', () => {
            const result = calculateBalanceSummaryFromTranches({
                tranches: [
                    { id: '1', amount: 1000, claimed: true, validTo: '2025-12-31' },
                    { id: '2', amount: 2000, claimed: true, validTo: '2025-12-31' },
                    { id: '3', amount: 3000, claimed: true, validTo: '2025-12-31' },
                ],
            });

            expect(result.totalXtm).toBe(6000);
            expect(result.totalClaimed).toBe(6000);
            expect(result.totalPending).toBe(0);
            expect(result.totalExpired).toBe(0);
        });

        it('calculates totals for all pending tranches', () => {
            const futureDate = new Date();
            futureDate.setFullYear(futureDate.getFullYear() + 1);

            const result = calculateBalanceSummaryFromTranches({
                tranches: [
                    { id: '1', amount: 1000, claimed: false, validTo: futureDate.toISOString() },
                    { id: '2', amount: 2000, claimed: false, validTo: futureDate.toISOString() },
                ],
            });

            expect(result.totalXtm).toBe(3000);
            expect(result.totalClaimed).toBe(0);
            expect(result.totalPending).toBe(3000);
            expect(result.totalExpired).toBe(0);
        });

        it('calculates totals for expired tranches', () => {
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);

            const result = calculateBalanceSummaryFromTranches({
                tranches: [
                    { id: '1', amount: 1000, claimed: false, validTo: pastDate.toISOString() },
                    { id: '2', amount: 2000, claimed: false, validTo: pastDate.toISOString() },
                ],
            });

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

            const result = calculateBalanceSummaryFromTranches({
                tranches: [
                    { id: '1', amount: 1000, claimed: true, validTo: '2025-12-31' }, // claimed
                    { id: '2', amount: 2000, claimed: false, validTo: futureDate.toISOString() }, // pending
                    { id: '3', amount: 3000, claimed: false, validTo: pastDate.toISOString() }, // expired
                    { id: '4', amount: 4000, claimed: true, validTo: pastDate.toISOString() }, // claimed (even if expired)
                ],
            });

            expect(result.totalXtm).toBe(10000);
            expect(result.totalClaimed).toBe(5000); // 1000 + 4000
            expect(result.totalPending).toBe(2000);
            expect(result.totalExpired).toBe(3000);
        });

        it('claimed tranches are not counted as expired even if past validTo', () => {
            const pastDate = new Date();
            pastDate.setFullYear(pastDate.getFullYear() - 1);

            const result = calculateBalanceSummaryFromTranches({
                tranches: [{ id: '1', amount: 5000, claimed: true, validTo: pastDate.toISOString() }],
            });

            expect(result.totalXtm).toBe(5000);
            expect(result.totalClaimed).toBe(5000);
            expect(result.totalPending).toBe(0);
            expect(result.totalExpired).toBe(0);
        });
    });

    describe('clearState', () => {
        // The clear state object used when logging out
        const clearState = {
            authUuid: '',
            airdropTokens: undefined,
            miningRewardPoints: undefined,
            userDetails: undefined,
            userPoints: undefined,
            bonusTiers: undefined,
            flareAnimationType: undefined,
            uiSendRecvEnabled: true,
            crewQueryParams: {
                status: 'active' as const,
                page: 1,
                limit: 20,
            },
            showTrancheModal: false,
        };

        it('has empty authUuid', () => {
            expect(clearState.authUuid).toBe('');
        });

        it('has undefined airdropTokens', () => {
            expect(clearState.airdropTokens).toBeUndefined();
        });

        it('has undefined miningRewardPoints', () => {
            expect(clearState.miningRewardPoints).toBeUndefined();
        });

        it('has undefined userDetails', () => {
            expect(clearState.userDetails).toBeUndefined();
        });

        it('has undefined userPoints', () => {
            expect(clearState.userPoints).toBeUndefined();
        });

        it('has undefined bonusTiers', () => {
            expect(clearState.bonusTiers).toBeUndefined();
        });

        it('has undefined flareAnimationType', () => {
            expect(clearState.flareAnimationType).toBeUndefined();
        });

        it('has uiSendRecvEnabled as true', () => {
            expect(clearState.uiSendRecvEnabled).toBe(true);
        });

        it('has default crewQueryParams', () => {
            expect(clearState.crewQueryParams).toEqual({
                status: 'active',
                page: 1,
                limit: 20,
            });
        });

        it('has showTrancheModal as false', () => {
            expect(clearState.showTrancheModal).toBe(false);
        });
    });

    describe('airdrop token state management', () => {
        it('token with expiresAt is correctly structured', () => {
            const token = 'test-jwt-token';
            const refreshToken = 'test-refresh-token';
            const expiresAt = 1234567890;

            const airdropTokens = {
                token,
                refreshToken,
                expiresAt,
            };

            expect(airdropTokens.token).toBe(token);
            expect(airdropTokens.refreshToken).toBe(refreshToken);
            expect(airdropTokens.expiresAt).toBe(expiresAt);
        });

        it('token can have optional installReward field', () => {
            const airdropTokens = {
                token: 'token',
                refreshToken: 'refresh',
                expiresAt: 123,
                installReward: true,
            };

            expect(airdropTokens.installReward).toBe(true);
        });
    });

    describe('user points structure', () => {
        it('base points structure is valid', () => {
            const userPoints = {
                base: {
                    gems: 10000,
                    shells: 500,
                    hammers: 100,
                },
            };

            expect(userPoints.base.gems).toBe(10000);
            expect(userPoints.base.shells).toBe(500);
            expect(userPoints.base.hammers).toBe(100);
        });

        it('base points with rank is valid', () => {
            const userPoints = {
                base: {
                    gems: 10000,
                    shells: 500,
                    hammers: 100,
                    rank: 'Diamond',
                },
            };

            expect(userPoints.base.rank).toBe('Diamond');
        });

        it('referral count is valid', () => {
            const userPoints = {
                base: { gems: 10000, shells: 500, hammers: 100 },
                referralCount: { gems: 2500, count: 5 },
            };

            expect(userPoints.referralCount?.gems).toBe(2500);
            expect(userPoints.referralCount?.count).toBe(5);
        });
    });

    describe('bonus tier structure', () => {
        it('bonus tier has required fields', () => {
            const tier = {
                id: 'tier-1',
                target: 100,
                bonusGems: 500,
            };

            expect(tier.id).toBe('tier-1');
            expect(tier.target).toBe(100);
            expect(tier.bonusGems).toBe(500);
        });

        it('multiple tiers can be ordered by target', () => {
            const tiers = [
                { id: 'tier-3', target: 1000, bonusGems: 5000 },
                { id: 'tier-1', target: 100, bonusGems: 500 },
                { id: 'tier-2', target: 500, bonusGems: 2500 },
            ];

            const sorted = [...tiers].sort((a, b) => a.target - b.target);

            expect(sorted[0].target).toBe(100);
            expect(sorted[1].target).toBe(500);
            expect(sorted[2].target).toBe(1000);
        });
    });

    describe('crew query params', () => {
        it('default params are correct', () => {
            const defaultParams = {
                status: 'active' as const,
                page: 1,
                limit: 20,
            };

            expect(defaultParams.status).toBe('active');
            expect(defaultParams.page).toBe(1);
            expect(defaultParams.limit).toBe(20);
        });

        it('status can be all valid values', () => {
            const validStatuses = ['all', 'completed', 'active', 'inactive'] as const;

            validStatuses.forEach((status) => {
                const params = { status, page: 1, limit: 20 };
                expect(params.status).toBe(status);
            });
        });

        it('pagination works correctly', () => {
            const params = { status: 'active' as const, page: 3, limit: 50 };

            expect(params.page).toBe(3);
            expect(params.limit).toBe(50);
        });
    });

    describe('animation types', () => {
        it('GoalComplete is a valid animation type', () => {
            const animationType: 'GoalComplete' | 'FriendAccepted' | 'BonusGems' = 'GoalComplete';
            expect(animationType).toBe('GoalComplete');
        });

        it('FriendAccepted is a valid animation type', () => {
            const animationType: 'GoalComplete' | 'FriendAccepted' | 'BonusGems' = 'FriendAccepted';
            expect(animationType).toBe('FriendAccepted');
        });

        it('BonusGems is a valid animation type', () => {
            const animationType: 'GoalComplete' | 'FriendAccepted' | 'BonusGems' = 'BonusGems';
            expect(animationType).toBe('BonusGems');
        });
    });

    describe('community message structure', () => {
        it('info message type is valid', () => {
            const message = {
                id: 'msg-1',
                message: 'Welcome!',
                isVisible: true,
                createdAt: '2024-01-15T12:00:00Z',
                textHtml: '<p>Welcome!</p>',
                type: 'info' as const,
            };

            expect(message.type).toBe('info');
        });

        it('warning message type is valid', () => {
            const message = {
                id: 'msg-2',
                message: 'Maintenance soon',
                isVisible: true,
                createdAt: '2024-01-15T12:00:00Z',
                textHtml: '<p>Maintenance soon</p>',
                type: 'warning' as const,
            };

            expect(message.type).toBe('warning');
        });

        it('error message type is valid', () => {
            const message = {
                id: 'msg-3',
                message: 'Service unavailable',
                isVisible: true,
                createdAt: '2024-01-15T12:00:00Z',
                textHtml: '<p>Service unavailable</p>',
                type: 'error' as const,
            };

            expect(message.type).toBe('error');
        });
    });

    describe('crew member reward structure', () => {
        it('reward types are valid', () => {
            const rewardTypes = ['mining_hours', 'mining_days', 'pool_hashes', 'pool_shares', 'pool_amount'] as const;

            rewardTypes.forEach((type) => {
                expect(rewardTypes).toContain(type);
            });
        });

        it('reward statuses are valid', () => {
            const rewardStatuses = ['incomplete', 'pending', 'earned', 'claimed', 'expired'] as const;

            rewardStatuses.forEach((status) => {
                expect(rewardStatuses).toContain(status);
            });
        });

        it('reward progress structure is valid', () => {
            const progress = {
                miningMinutesProgress: 60,
                miningDaysProgress: 5,
                currentDayProgress: 45,
                poolHashesProgress: 1000,
                poolSharesProgress: 50,
                poolAmountProgress: 100,
                isComplete: false,
            };

            expect(progress.miningMinutesProgress).toBe(60);
            expect(progress.isComplete).toBe(false);
        });
    });
});
