import { describe, it, expect, beforeEach } from 'vitest';
import { useAirdropStore, GIFT_GEMS } from './useAirdropStore';
import type { XSpaceEvent } from '@app/types/ws.ts';
import type { TrancheStatus } from '@app/types/airdrop-claim.ts';

describe('useAirdropStore', () => {
    beforeEach(() => {
        useAirdropStore.setState({
            authUuid: '',
            airdropTokens: undefined,
            miningRewardPoints: undefined,
            userDetails: undefined,
            userPoints: undefined,
            bonusTiers: undefined,
            flareAnimationType: undefined,
            latestXSpaceEvent: null,
            uiSendRecvEnabled: true,
            crewQueryParams: {
                status: 'active',
                page: 1,
                limit: 20,
            },
            showTrancheModal: false,
            backendInMemoryConfig: undefined,
            communityMessages: undefined,
            features: undefined,
            crewMembers: undefined,
            crewRewards: undefined,
            crewTotals: undefined,
            referrerProgress: undefined,
            minRequirements: undefined,
            claim: undefined,
            trancheStatus: undefined,
            balanceSummary: undefined,
        });
    });

    describe('constants', () => {
        it('exports GIFT_GEMS as 5000', () => {
            expect(GIFT_GEMS).toBe(5000);
        });
    });

    describe('initial state', () => {
        it('has authUuid as empty string', () => {
            expect(useAirdropStore.getState().authUuid).toBe('');
        });

        it('has airdropTokens as undefined', () => {
            expect(useAirdropStore.getState().airdropTokens).toBeUndefined();
        });

        it('has userDetails as undefined', () => {
            expect(useAirdropStore.getState().userDetails).toBeUndefined();
        });

        it('has userPoints as undefined', () => {
            expect(useAirdropStore.getState().userPoints).toBeUndefined();
        });

        it('has bonusTiers as undefined', () => {
            expect(useAirdropStore.getState().bonusTiers).toBeUndefined();
        });

        it('has flareAnimationType as undefined', () => {
            expect(useAirdropStore.getState().flareAnimationType).toBeUndefined();
        });

        it('has latestXSpaceEvent as null', () => {
            expect(useAirdropStore.getState().latestXSpaceEvent).toBeNull();
        });

        it('has uiSendRecvEnabled as true', () => {
            expect(useAirdropStore.getState().uiSendRecvEnabled).toBe(true);
        });

        it('has default crewQueryParams', () => {
            expect(useAirdropStore.getState().crewQueryParams).toEqual({
                status: 'active',
                page: 1,
                limit: 20,
            });
        });

        it('has showTrancheModal as false', () => {
            expect(useAirdropStore.getState().showTrancheModal).toBe(false);
        });

        it('has miningRewardPoints as undefined', () => {
            expect(useAirdropStore.getState().miningRewardPoints).toBeUndefined();
        });
    });

    describe('authUuid state', () => {
        it('can set authUuid', () => {
            useAirdropStore.setState({ authUuid: 'test-uuid-123' });
            expect(useAirdropStore.getState().authUuid).toBe('test-uuid-123');
        });

        it('can clear authUuid', () => {
            useAirdropStore.setState({ authUuid: 'test-uuid-123' });
            useAirdropStore.setState({ authUuid: '' });
            expect(useAirdropStore.getState().authUuid).toBe('');
        });
    });

    describe('airdropTokens state', () => {
        it('can set airdropTokens with all fields', () => {
            const tokens = {
                token: 'jwt-token',
                refreshToken: 'refresh-token',
                expiresAt: 1234567890,
                installReward: true,
            };
            useAirdropStore.setState({ airdropTokens: tokens });
            expect(useAirdropStore.getState().airdropTokens).toEqual(tokens);
        });

        it('can set airdropTokens with minimal fields', () => {
            const tokens = {
                token: 'jwt-token',
                refreshToken: 'refresh-token',
            };
            useAirdropStore.setState({ airdropTokens: tokens });
            expect(useAirdropStore.getState().airdropTokens?.token).toBe('jwt-token');
            expect(useAirdropStore.getState().airdropTokens?.refreshToken).toBe('refresh-token');
        });

        it('can clear airdropTokens', () => {
            useAirdropStore.setState({
                airdropTokens: { token: 'jwt', refreshToken: 'refresh' },
            });
            useAirdropStore.setState({ airdropTokens: undefined });
            expect(useAirdropStore.getState().airdropTokens).toBeUndefined();
        });
    });

    describe('userDetails state', () => {
        it('can set userDetails', () => {
            const userDetails = {
                user: {
                    is_bot: false,
                    twitter_followers: 1000,
                    id: 'user-123',
                    referral_code: 'REF123',
                    yat_user_id: 'yat-123',
                    name: 'Test User',
                    role: 'miner',
                    image_url: 'https://example.com/avatar.png',
                    rank: {
                        gems: 5000,
                        shells: 100,
                        hammers: 50,
                        totalScore: 5150,
                        rank: 'Gold',
                    },
                },
            };
            useAirdropStore.setState({ userDetails });
            expect(useAirdropStore.getState().userDetails).toEqual(userDetails);
        });
    });

    describe('userPoints state', () => {
        it('can set userPoints with base values', () => {
            const userPoints = {
                base: {
                    gems: 10000,
                    shells: 500,
                    hammers: 100,
                },
            };
            useAirdropStore.setState({ userPoints });
            expect(useAirdropStore.getState().userPoints).toEqual(userPoints);
        });

        it('can set userPoints with referral count', () => {
            const userPoints = {
                base: {
                    gems: 10000,
                    shells: 500,
                    hammers: 100,
                    rank: 'Diamond',
                },
                referralCount: {
                    gems: 2500,
                    count: 5,
                },
            };
            useAirdropStore.setState({ userPoints });
            expect(useAirdropStore.getState().userPoints?.referralCount?.count).toBe(5);
            expect(useAirdropStore.getState().userPoints?.referralCount?.gems).toBe(2500);
        });
    });

    describe('bonusTiers state', () => {
        it('can set bonusTiers', () => {
            const tiers = [
                { id: 'tier-1', target: 100, bonusGems: 500 },
                { id: 'tier-2', target: 500, bonusGems: 2500 },
                { id: 'tier-3', target: 1000, bonusGems: 5000 },
            ];
            useAirdropStore.setState({ bonusTiers: tiers });
            expect(useAirdropStore.getState().bonusTiers).toHaveLength(3);
            expect(useAirdropStore.getState().bonusTiers?.[0].target).toBe(100);
        });
    });

    describe('flareAnimationType state', () => {
        it('can set GoalComplete animation', () => {
            useAirdropStore.setState({ flareAnimationType: 'GoalComplete' });
            expect(useAirdropStore.getState().flareAnimationType).toBe('GoalComplete');
        });

        it('can set FriendAccepted animation', () => {
            useAirdropStore.setState({ flareAnimationType: 'FriendAccepted' });
            expect(useAirdropStore.getState().flareAnimationType).toBe('FriendAccepted');
        });

        it('can set BonusGems animation', () => {
            useAirdropStore.setState({ flareAnimationType: 'BonusGems' });
            expect(useAirdropStore.getState().flareAnimationType).toBe('BonusGems');
        });

        it('can clear animation type', () => {
            useAirdropStore.setState({ flareAnimationType: 'GoalComplete' });
            useAirdropStore.setState({ flareAnimationType: undefined });
            expect(useAirdropStore.getState().flareAnimationType).toBeUndefined();
        });
    });

    describe('latestXSpaceEvent state', () => {
        it('can set XSpace event', () => {
            const event = {
                id: 'event-123',
                text: 'Tari Community Call',
                visibilityStart: '2024-01-15T18:00:00Z',
                url: 'https://x.com/spaces/abc123',
            };
            useAirdropStore.setState({ latestXSpaceEvent: event as unknown as XSpaceEvent | null });
            expect(useAirdropStore.getState().latestXSpaceEvent).toEqual(event);
        });

        it('can clear XSpace event', () => {
            useAirdropStore.setState({ latestXSpaceEvent: { id: 'event' } as unknown as XSpaceEvent | null });
            useAirdropStore.setState({ latestXSpaceEvent: null });
            expect(useAirdropStore.getState().latestXSpaceEvent).toBeNull();
        });
    });

    describe('crewQueryParams state', () => {
        it('can update status filter', () => {
            useAirdropStore.setState({
                crewQueryParams: {
                    status: 'completed',
                    page: 1,
                    limit: 20,
                },
            });
            expect(useAirdropStore.getState().crewQueryParams.status).toBe('completed');
        });

        it('can update page', () => {
            useAirdropStore.setState({
                crewQueryParams: {
                    ...useAirdropStore.getState().crewQueryParams,
                    page: 5,
                },
            });
            expect(useAirdropStore.getState().crewQueryParams.page).toBe(5);
        });

        it('can update limit', () => {
            useAirdropStore.setState({
                crewQueryParams: {
                    ...useAirdropStore.getState().crewQueryParams,
                    limit: 50,
                },
            });
            expect(useAirdropStore.getState().crewQueryParams.limit).toBe(50);
        });

        it('supports all status values', () => {
            const statuses: ('all' | 'completed' | 'active' | 'inactive')[] = [
                'all',
                'completed',
                'active',
                'inactive',
            ];
            statuses.forEach((status) => {
                useAirdropStore.setState({
                    crewQueryParams: {
                        status,
                        page: 1,
                        limit: 20,
                    },
                });
                expect(useAirdropStore.getState().crewQueryParams.status).toBe(status);
            });
        });
    });

    describe('showTrancheModal state', () => {
        it('can open modal', () => {
            useAirdropStore.setState({ showTrancheModal: true });
            expect(useAirdropStore.getState().showTrancheModal).toBe(true);
        });

        it('can close modal', () => {
            useAirdropStore.setState({ showTrancheModal: true });
            useAirdropStore.setState({ showTrancheModal: false });
            expect(useAirdropStore.getState().showTrancheModal).toBe(false);
        });
    });

    describe('features state', () => {
        it('can set feature flags', () => {
            const features = ['FE_UI_ECO_ALERT', 'FE_UI_NEW_FEATURE', 'FE_UI_BETA'];
            useAirdropStore.setState({ features });
            expect(useAirdropStore.getState().features).toEqual(features);
        });

        it('can check if feature exists', () => {
            useAirdropStore.setState({ features: ['FE_UI_ECO_ALERT'] });
            expect(useAirdropStore.getState().features?.includes('FE_UI_ECO_ALERT')).toBe(true);
            expect(useAirdropStore.getState().features?.includes('FE_UI_NONEXISTENT')).toBe(false);
        });
    });

    describe('communityMessages state', () => {
        it('can set community messages', () => {
            const messages = [
                {
                    id: 'msg-1',
                    message: 'Welcome to Tari!',
                    isVisible: true,
                    createdAt: '2024-01-15T12:00:00Z',
                    textHtml: '<p>Welcome to Tari!</p>',
                    type: 'info' as const,
                },
                {
                    id: 'msg-2',
                    message: 'Maintenance scheduled',
                    isVisible: true,
                    createdAt: '2024-01-16T12:00:00Z',
                    textHtml: '<p>Maintenance scheduled</p>',
                    type: 'warning' as const,
                },
            ];
            useAirdropStore.setState({ communityMessages: messages });
            expect(useAirdropStore.getState().communityMessages).toHaveLength(2);
            expect(useAirdropStore.getState().communityMessages?.[0].type).toBe('info');
            expect(useAirdropStore.getState().communityMessages?.[1].type).toBe('warning');
        });
    });

    describe('trancheStatus state', () => {
        it('can set tranche status', () => {
            const trancheStatus = {
                tranches: [
                    { id: 't1', amount: 1000, claimed: true, validTo: '2024-12-31' },
                    { id: 't2', amount: 2000, claimed: false, validTo: '2025-06-30' },
                ],
            };
            useAirdropStore.setState({ trancheStatus: trancheStatus as unknown as TrancheStatus });
            expect(useAirdropStore.getState().trancheStatus?.tranches).toHaveLength(2);
        });
    });

    describe('balanceSummary state', () => {
        it('can set balance summary', () => {
            const summary = {
                totalXtm: 10000,
                totalClaimed: 3000,
                totalPending: 5000,
                totalExpired: 2000,
            };
            useAirdropStore.setState({ balanceSummary: summary });
            expect(useAirdropStore.getState().balanceSummary).toEqual(summary);
            expect(useAirdropStore.getState().balanceSummary?.totalXtm).toBe(10000);
        });
    });

    describe('crewMembers state', () => {
        it('can set crew members', () => {
            const crewMembers = [
                {
                    id: 'crew-1',
                    userId: 'user-1',
                    walletReceiveKey: 'wallet-key-1',
                    completed: true,
                    totalMiningMinutes: 60000,
                    weeklyGoalProgress: 100,
                    lastActivityDate: new Date(),
                    milestones: ['first-mine', 'week-1'],
                    rewards: [],
                },
            ];
            useAirdropStore.setState({ crewMembers });
            expect(useAirdropStore.getState().crewMembers).toHaveLength(1);
            expect(useAirdropStore.getState().crewMembers?.[0].completed).toBe(true);
        });
    });

    describe('miningRewardPoints state', () => {
        it('can set mining reward points', () => {
            const miningRewardPoints = {
                blockHeight: '12345',
                reward: 100,
            };
            useAirdropStore.setState({ miningRewardPoints });
            expect(useAirdropStore.getState().miningRewardPoints).toEqual(miningRewardPoints);
        });
    });

    describe('complex state updates', () => {
        it('preserves unrelated state when updating specific fields', () => {
            useAirdropStore.setState({
                authUuid: 'test-uuid',
                showTrancheModal: true,
            });

            useAirdropStore.setState({ showTrancheModal: false });

            expect(useAirdropStore.getState().authUuid).toBe('test-uuid');
            expect(useAirdropStore.getState().showTrancheModal).toBe(false);
        });

        it('can update multiple fields atomically', () => {
            useAirdropStore.setState({
                authUuid: 'auth-123',
                airdropTokens: { token: 'tok', refreshToken: 'ref' },
                showTrancheModal: true,
                features: ['FEATURE_A'],
            });

            const state = useAirdropStore.getState();
            expect(state.authUuid).toBe('auth-123');
            expect(state.airdropTokens?.token).toBe('tok');
            expect(state.showTrancheModal).toBe(true);
            expect(state.features).toEqual(['FEATURE_A']);
        });
    });
});
