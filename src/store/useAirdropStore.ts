import { create } from './create';

export const GIFT_GEMS = 5000;
export const REFERRAL_GEMS = 5000;

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

export interface BackendInMemoryConfig {
    airdropUrl: string;
    airdropApiUrl: string;
    airdropTwitterAuthUrl: string;
}
export type AnimationType = 'GoalComplete' | 'FriendAccepted' | 'BonusGems';

interface MiningPoint {
    blockHeight: string;
    reward: number;
}
//////////////////////////////////////////

export interface AirdropStoreState {
    authUuid?: string;
    airdropTokens?: AirdropTokens;
    userDetails?: UserDetails;
    userPoints?: UserPoints;
    backendInMemoryConfig?: BackendInMemoryConfig;
    flareAnimationType?: AnimationType;
    bonusTiers?: BonusTier[];
    miningRewardPoints?: MiningPoint;
}

const initialState: AirdropStoreState = {
    authUuid: '',
    airdropTokens: undefined,
    miningRewardPoints: undefined,
    userDetails: undefined,
    userPoints: undefined,
    bonusTiers: undefined,
    flareAnimationType: undefined,
};

export const useAirdropStore = create<AirdropStoreState>()(() => ({ ...initialState }));
