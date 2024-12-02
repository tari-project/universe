import { createWithEqualityFn as create } from 'zustand/traditional';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';
import { useMiningStore } from './useMiningStore';
import { Socket } from 'socket.io-client';

export const GIFT_GEMS = 5000;
export const REFERRAL_GEMS = 5000;
export const MAX_GEMS = 10000;

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

export interface AirdropTokens {
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

interface MiningPoint {
    blockHeight: string;
    reward: number;
}

interface AirdropState {
    authUuid: string;
    syncedWithBackend: boolean;
    airdropTokens?: AirdropTokens;
    userDetails?: UserDetails;
    userPoints?: UserPoints;
    referralCount?: ReferralCount;
    backendInMemoryConfig?: BackendInMemoryConfig;
    flareAnimationType?: AnimationType;
    bonusTiers?: BonusTier[];
    referralQuestPoints?: ReferralQuestPoints;
    miningRewardPoints?: MiningPoint;
    seenPermissions: boolean;
}

interface AirdropStore extends AirdropState {
    setReferralQuestPoints: (referralQuestPoints: ReferralQuestPoints) => void;
    setMiningRewardPoints: (miningRewardPoints?: MiningPoint) => void;
    setAuthUuid: (authUuid: string) => void;
    setAirdropTokens: (airdropToken?: AirdropTokens) => Promise<void>;
    setUserDetails: (userDetails?: UserDetails) => void;
    setUserPoints: (userPoints: UserPoints) => void;
    fetchBackendInMemoryConfig: (config?: BackendInMemoryConfig) => Promise<BackendInMemoryConfig | undefined>;
    setReferralCount: (referralCount: ReferralCount) => void;
    setFlareAnimationType: (flareAnimationType?: AnimationType) => void;
    setBonusTiers: (bonusTiers: BonusTier[]) => void;
    setUserGems: (userGems: number) => void;
    logout: () => Promise<void>;
}

const initialState: AirdropState = {
    authUuid: '',
    seenPermissions: false,
    syncedWithBackend: false,
};

const clearState: Partial<AirdropState> = {
    authUuid: '',
    airdropTokens: undefined,
    miningRewardPoints: undefined,
    userDetails: undefined,
    userPoints: undefined,
};

export const useAirdropStore = create<AirdropStore>()(
    persist(
        (set) => ({
            ...initialState,
            setReferralQuestPoints: (referralQuestPoints) => set({ referralQuestPoints }),
            setFlareAnimationType: (flareAnimationType) => set({ flareAnimationType }),
            setBonusTiers: (bonusTiers) => set({ bonusTiers }),
            setUserDetails: (userDetails) => set({ userDetails }),
            setAuthUuid: (authUuid) => set({ authUuid }),
            setAirdropTokens: async (airdropTokens) => {
                if (airdropTokens) {
                    try {
                        await invoke('set_airdrop_access_token', { token: airdropTokens.token });
                    } catch (error) {
                        console.error('Error getting airdrop tokens:', error);
                    }
                    set({
                        syncedWithBackend: true,
                        airdropTokens: {
                            ...airdropTokens,
                            expiresAt: parseJwt(airdropTokens.token).exp,
                        },
                    });
                } else {
                    // User not connected
                    set({ syncedWithBackend: true });
                }
            },
            setReferralCount: (referralCount) => set({ referralCount }),
            setUserPoints: (userPoints) => set({ userPoints }),
            setUserGems: (userGems: number) =>
                set((state) => {
                    const userPointsFormatted = {
                        ...state.userPoints,
                        base: { ...state.userPoints?.base, gems: userGems },
                    } as UserPoints;

                    return {
                        userPoints: userPointsFormatted,
                    };
                }),
            fetchBackendInMemoryConfig: async () => {
                let backendInMemoryConfig: BackendInMemoryConfig | undefined = undefined;
                try {
                    backendInMemoryConfig = await invoke('get_app_in_memory_config', {});
                    set({ backendInMemoryConfig });
                } catch (e) {
                    console.error('get_app_in_memory_config error:', e);
                }
                return backendInMemoryConfig;
            },
            setMiningRewardPoints: (miningRewardPoints) => set({ miningRewardPoints, flareAnimationType: 'BonusGems' }),

            logout: async () => {
                set(clearState);
                await useMiningStore.getState().restartMining();
            },
        }),
        {
            name: 'airdrop-store',
            partialize: (s) => ({
                airdropTokens: s.airdropTokens,
                miningRewardPoints: s.miningRewardPoints,
                referralQuestPoints: s.referralQuestPoints,
            }),
        }
    )
);
