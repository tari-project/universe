import { create } from 'zustand';
import type { ConfigBackendInMemory } from '@app/types/configs.ts';
import type { XSpaceEvent } from '@app/types/ws';
import type { AirdropClaimState, TrancheStatus, BalanceSummary } from '@app/types/airdrop-claim';

export const GIFT_GEMS = 5000;

export interface BonusTier {
    id: string;
    target: number;
    bonusGems: number;
}

export interface ReferralCount {
    gems: number;
    count: number;
}

export interface UserPoints {
    base: {
        gems: number;
        shells: number;
        hammers: number;
        rank?: string;
    };
    referralCount?: ReferralCount;
}

export interface User {
    is_bot: boolean;
    twitter_followers: number;
    id: string;
    referral_code: string;
    yat_user_id: string;
    name: string;
    role: string;
    image_url: string;
    rank: {
        gems: number;
        shells: number;
        hammers: number;
        totalScore: number;
        rank: string;
    };
}

export interface UserEntryPoints {
    entry: {
        createdAt: string;
        updatedAt: string;
        id: string;
        userId: string;
        name: string;
        photo: string;
        totalScore: number;
        gems: number;
        shells: number;
        hammers: number;
        yatHolding: number;
        followers: number;
        isBot: boolean;
        mandatoryComplete: boolean;
    };
}

export interface UserDetails {
    user: User;
}

export interface AirdropTokens {
    token: string;
    refreshToken: string;
    expiresAt?: number;
    installReward?: boolean;
}

export type AnimationType = 'GoalComplete' | 'FriendAccepted' | 'BonusGems';

interface MiningPoint {
    blockHeight: string;
    reward: number;
}

export type MessageType = 'info' | 'warning' | 'error';

export interface CommunityMessage {
    id: string;
    message: string;
    isVisible: boolean;
    createdAt: string;
    textHtml: string;
    type: MessageType;
}

export type RewardType = 'mining_hours' | 'mining_days' | 'pool_hashes' | 'pool_shares' | 'pool_amount';

export type RewardStatus = 'incomplete' | 'pending' | 'earned' | 'claimed' | 'expired';

export interface CrewMemberReward {
    id: string;
    rewardType: RewardType;
    amount: number;
    status: RewardStatus;
    earnedAt: Date;
    claimedAt?: Date;
    readyToClaim: boolean;
    active: boolean;
    progressTowardsReward: {
        miningMinutesProgress: number;
        miningDaysProgress: number;
        currentDayProgress: number;
        poolHashesProgress: number;
        poolSharesProgress: number;
        poolAmountProgress: number;
        isComplete: boolean;
    };
}

export interface CrewMember {
    id: string;
    userId: string;
    walletReceiveKey: string;
    completed: boolean;
    totalMiningMinutes: number;
    weeklyGoalProgress: number;
    lastActivityDate: Date;
    milestones: string[];
    user?: {
        id: string;
        name: string;
        displayName?: string;
        image?: string;
    };
    rewards: CrewMemberReward[];
}

export interface PaginationInfo {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface ReferrerProgress {
    currentStreak: number;
    longestStreak: number;
    totalMiningMinutes: number;
    todayMiningMinutes: number;
    lastMiningDate: Date;
    isCurrentlyMining: boolean;
    meetsMinimumDays: boolean;
    totalClaimedRewards: number;
    minReferrerDaysRequired: number;
}

export interface CrewMembersTotals {
    all: number;
    completed: number;
    active: number;
    inactive: number;
}

export interface MinRequirements {
    minDailyMiningMinutes: number;
    totalDaysRequired: number;
    minShares: number;
    minHashes: number;
    minAmtPaid: bigint;
}

export interface MembersResponse {
    members: CrewMember[];
    pagination: PaginationInfo;
    filters: {
        status: 'all' | 'completed' | 'active' | 'inactive';
    };
}

export interface ReferrerProgressResponse {
    referrerProgress: ReferrerProgress;
    totals: CrewMembersTotals;
    memberImages: string[];
    minRequirements: MinRequirements;
    members: {
        name: string;
        displayName: string;
        image: string;
        isCurrentlyMining: boolean;
        lastActivityDate: string;
    }[];
    membersToNudge: {
        id: string;
        name: string;
        displayName?: string;
        imageUrl?: string;
    }[];
    rewardsConfig: {
        referrerRewards: number;
        referralRewards: number;
        requirement: number;
    };
}

export interface Reward {
    id: string;
    name: string;
    description: string;
    points: number;
    claimedAt?: string;
}

export type AirdropConfigBackendInMemory = Omit<ConfigBackendInMemory, 'exchange_id'>;

//////////////////////////////////////////
export interface AirdropStoreState {
    authUuid?: string;
    airdropTokens?: AirdropTokens;
    userDetails?: UserDetails;
    userPoints?: UserPoints;
    backendInMemoryConfig?: AirdropConfigBackendInMemory;
    flareAnimationType?: AnimationType;
    bonusTiers?: BonusTier[];
    miningRewardPoints?: MiningPoint;
    latestXSpaceEvent?: XSpaceEvent | null;
    uiSendRecvEnabled: boolean;
    communityMessages?: CommunityMessage[];
    features?: string[];
    crewMembers?: CrewMember[];

    crewRewards?: Reward[];
    crewTotals?: CrewMembersTotals;
    referrerProgress?: ReferrerProgress;
    minRequirements?: MinRequirements;
    crewQueryParams: {
        status: 'all' | 'completed' | 'active' | 'inactive';
        page: number;
        limit: number;
    };

    // Airdrop claim state
    claim?: AirdropClaimState;

    // Tranche state
    trancheStatus?: TrancheStatus;
    balanceSummary?: BalanceSummary;

    // Modal state
    showTrancheModal: boolean;
}

const initialState: AirdropStoreState = {
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
};

export const useAirdropStore = create<AirdropStoreState>()(() => ({
    ...initialState,
}));
