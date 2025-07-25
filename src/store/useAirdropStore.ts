import { XSpaceEvent } from '@app/types/ws';
import { create } from './create';
import { ConfigBackendInMemory } from '@app/types/configs.ts';

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
    profileimageurl: string;
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

export type RewardStatus = 'pending' | 'earned' | 'claimed' | 'expired';

export interface CrewMemberReward {
    id: string;
    rewardType: RewardType;
    amount: number;
    status: RewardStatus;
    earnedAt: Date;
    claimedAt?: Date;
    readyToClaim: boolean;
    progressTowardsReward: {
        miningHoursProgress: number; // Raw total mining hours (e.g., 45.5)
        miningDaysProgress: number; // Raw number of qualifying days completed (e.g., 8)
        totalDaysRequired: number; // Total days required for completion (e.g., 14)
        currentDayProgress: number; // Today's progress percentage (0-100%, e.g., 75.0)
        poolHashesProgress: number; // Raw total hashes (e.g., 1250000)
        poolSharesProgress: number; // Raw valid shares (e.g., 850)
        poolAmountProgress: number; // Raw amount paid (e.g., 0.00045)
        isComplete: boolean; // Boolean completion status
    };
}

export interface CrewMember {
    id: string;
    userId: string;
    walletViewKeyHashed: string;
    walletReceiveKeyHashed: string;
    completed: boolean;
    totalMiningHours: number;
    weeklyGoalProgress: number;
    lastActivityDate: Date;
    milestones: string[];
    user?: {
        name: string;
        displayName?: string;
        referralCode?: string;
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
    totalMiningHours: number;
    todayMiningHours: number;
    lastMiningDate: Date;
    isCurrentlyMining: boolean;
    meetsMinimumDays: boolean;
    totalClaimedRewards: number;
    minReferrerDaysRequired: number;
}

export interface CrewMembersResponse {
    members: CrewMember[];
    pagination: PaginationInfo;
    filters: {
        status: 'all' | 'completed' | 'active' | 'inactive';
    };
    referrerProgress: ReferrerProgress;
    totals: {
        all: number;
        completed: number;
        active: number;
        inactive: number;
    };
}

export interface CrewAnalytics {
    totalMembers: number;
    activeMembers: number;
    performanceMetrics: Record<string, any>;
}

export interface Reward {
    id: string;
    name: string;
    description: string;
    points: number;
    claimedAt?: string;
}

export type AirdropConfigBackendInMemory = Omit<ConfigBackendInMemory, 'exchangeId'>;

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
    crewAnalytics?: CrewAnalytics;
    crewRewards?: Reward[];
    crewQueryParams: {
        status: 'all' | 'completed' | 'active' | 'inactive';
        page: number;
        limit: number;
    };
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
        status: 'all',
        page: 1,
        limit: 20,
    },
};

export const useAirdropStore = create<AirdropStoreState>()(() => ({ ...initialState }));
