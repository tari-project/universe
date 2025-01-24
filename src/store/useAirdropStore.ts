import { createWithEqualityFn as create } from 'zustand/traditional';
import { invoke } from '@tauri-apps/api/core';

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

    setUserDetails: (userDetails?: UserDetails) => void;
    setUserPoints: (userPoints: UserPoints) => void;
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
    referralQuestPoints: undefined,
    bonusTiers: undefined,
    flareAnimationType: undefined,
    seenPermissions: false,
};

export const useAirdropStore = create<AirdropStore>()((set) => ({
    ...initialState,
    setReferralQuestPoints: (referralQuestPoints) => set({ referralQuestPoints }),
    setFlareAnimationType: (flareAnimationType) => set({ flareAnimationType }),
    setBonusTiers: (bonusTiers) => set({ bonusTiers }),
    setUserDetails: (userDetails) => set({ userDetails }),
    setAuthUuid: (authUuid) => set({ authUuid }),
    setReferralCount: (referralCount) => set({ referralCount }),
    setUserPoints: (userPoints) => set({ userPoints, referralCount: userPoints?.referralCount }),
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
    setMiningRewardPoints: (miningRewardPoints) => set({ miningRewardPoints, flareAnimationType: 'BonusGems' }),
    logout: async () => {
        await setAirdropTokens(undefined);
    },
}));

export const setAirdropTokens = async (airdropTokens?: AirdropTokens) => {
    const currentState = useAirdropStore.getState();
    if (airdropTokens) {
        useAirdropStore.setState({
            syncedWithBackend: true,
            airdropTokens: {
                ...currentState,
                ...airdropTokens,
                expiresAt: parseJwt(airdropTokens.token).exp,
            },
        });

        await invoke('set_airdrop_tokens', {
            airdropTokens: { token: airdropTokens.token, refresh_token: airdropTokens.refreshToken },
        });
    } else {
        // User not connected
        const clearedState = { ...currentState, ...clearState, syncedWithBackend: true, airdropTokens: undefined };
        useAirdropStore.setState(clearedState);
        try {
            await invoke('set_airdrop_tokens', { airdropTokens: undefined });
        } catch (e) {
            console.error('Error clearing airdrop access token:', e);
        }
    }
};

export const fetchBackendInMemoryConfig = async () => {
    const currentState = useAirdropStore.getState();

    // Checks for old persisted tokens
    const existingTokensStore = localStorage.getItem('airdrop-store');
    let existingTokens: AirdropTokens | undefined = undefined;
    if (existingTokensStore) {
        try {
            existingTokens = (JSON.parse(existingTokensStore).state as AirdropState).airdropTokens;
        } catch (e) {
            console.error('Failed to parse existing tokens:', e);
        }
    }
    ////////////////////////////

    let backendInMemoryConfig: BackendInMemoryConfig | undefined = undefined;

    try {
        backendInMemoryConfig = await invoke('get_app_in_memory_config', {});
        const airdropTokens = (await invoke('get_airdrop_tokens')) || {};
        const newState = {
            ...currentState,
            backendInMemoryConfig,
        };

        if (airdropTokens?.token) {
            newState.airdropTokens = {
                ...airdropTokens,
                expiresAt: parseJwt(airdropTokens.token).exp,
            };
        } else if (existingTokens?.token) {
            try {
                await invoke('set_airdrop_tokens', {
                    airdropTokens: { token: existingTokens.token, refresh_token: existingTokens.refreshToken },
                });

                newState.airdropTokens = {
                    ...existingTokens,
                    expiresAt: parseJwt(existingTokens.token).exp,
                };

                // Remove old tokens
                localStorage.removeItem('airdrop-store');
            } catch (e) {
                console.error('get_app_in_memory_config error:', e);
            }
        }

        useAirdropStore.setState(newState);
    } catch (e) {
        console.error('get_app_in_memory_config error:', e);
    }
    return backendInMemoryConfig;
};
