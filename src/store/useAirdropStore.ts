import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const INSTALL_BONUS_GEMS = 5000;
export const GIFT_GEMS = 5000;
export const REFERRAL_GEMS = 5000;

// Helpers
function parseJwt(token: string): TokenResponse {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        window
            .atob(base64)
            .split('')
            .map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            })
            .join('')
    );

    return JSON.parse(jsonPayload);
}

//////////////////////////////////////////
//

export interface BonusTier {
    id: string;
    target: number;
    bonusGems: number;
}

interface TokenResponse {
    exp: number;
    iat: number;
    id: string;
    provider: string;
    role: string;
    scope: string;
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

interface AirdropTokens {
    token: string;
    refreshToken: string;
    expiresAt?: number;
}

export interface BackendInMemoryConfig {
    airdropUrl: string;
    airdropApiUrl: string;
    airdropTwitterAuthUrl: string;
}

type AnimationType = 'GoalComplete' | 'FriendAccepted' | 'BonusGems';

export interface ReferralQuestPoints {
    pointsPerReferral: number;
    pointsForClaimingReferral: number;
}

//////////////////////////////////////////

interface AirdropState {
    authUuid: string;
    airdropTokens?: AirdropTokens;
    userDetails?: UserDetails;
    userPoints?: UserPoints;
    referralCount?: ReferralCount;
    backendInMemoryConfig?: BackendInMemoryConfig;
    flareAnimationType?: AnimationType;
    bonusTiers?: BonusTier[];
    referralQuestPoints?: ReferralQuestPoints;
}

interface AirdropStore extends AirdropState {
    setReferralQuestPoints: (referralQuestPoints: ReferralQuestPoints) => void;

    setAuthUuid: (authUuid: string) => void;
    setAirdropTokens: (airdropToken: AirdropTokens) => void;
    setUserDetails: (userDetails?: UserDetails) => void;
    setUserPoints: (userPoints: UserPoints) => void;
    setBackendInMemoryConfig: (config?: BackendInMemoryConfig) => void;
    setReferralCount: (referralCount: ReferralCount) => void;
    setFlareAnimationType: (flareAnimationType?: AnimationType) => void;
    setBonusTiers: (bonusTiers: BonusTier[]) => void;
    logout: () => void;
}

const clearState: AirdropState = {
    authUuid: '',
    airdropTokens: undefined,
    userDetails: undefined,
    userPoints: undefined,
};

const NOT_PERSISTED_KEYS = ['userPoints', 'backendInMemoryConfig', 'userDetails', 'authUuid', 'referralCount'];
export const useAirdropStore = create<AirdropStore>()(
    persist(
        (set) => ({
            authUuid: '',
            setReferralQuestPoints: (referralQuestPoints) => set({ referralQuestPoints }),
            setFlareAnimationType: (flareAnimationType) => set({ flareAnimationType }),
            setBonusTiers: (bonusTiers) => set({ bonusTiers }),
            logout: () => set(clearState),
            setUserDetails: (userDetails) => set({ userDetails }),
            setAuthUuid: (authUuid) => set({ authUuid }),
            setAirdropTokens: (airdropTokens) =>
                set({
                    airdropTokens: {
                        ...airdropTokens,
                        expiresAt: parseJwt(airdropTokens.token).exp,
                    },
                }),
            setReferralCount: (referralCount) => set({ referralCount }),
            setUserPoints: (userPoints) => set({ userPoints }),
            setBackendInMemoryConfig: (backendInMemoryConfig) => set({ backendInMemoryConfig }),
        }),
        {
            name: 'airdrop-store',
            partialize: (state) =>
                Object.fromEntries(Object.entries(state).filter(([key]) => !NOT_PERSISTED_KEYS.includes(key))),
        }
    )
);
