import { createWithEqualityFn as create } from 'zustand/traditional';
import { invoke } from '@tauri-apps/api/core';
import { handleRefreshAirdropTokens } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh';

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
    authUuid?: string;
    airdropTokens?: AirdropTokens;
    userDetails?: UserDetails;
    userPoints?: UserPoints;
    referralCount?: ReferralCount;
    backendInMemoryConfig?: BackendInMemoryConfig;
    flareAnimationType?: AnimationType;
    bonusTiers?: BonusTier[];
    referralQuestPoints?: ReferralQuestPoints;
    miningRewardPoints?: MiningPoint;
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

const clearState: Partial<AirdropState> = {
    authUuid: '',
    airdropTokens: undefined,
    miningRewardPoints: undefined,
    userDetails: undefined,
    userPoints: undefined,
    referralQuestPoints: undefined,
    bonusTiers: undefined,
    flareAnimationType: undefined,
};

export const useAirdropStore = create<AirdropStore>()((set) => ({
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
            airdropTokens: {
                ...currentState,
                ...airdropTokens,
                expiresAt: parseJwt(airdropTokens.token).exp,
            },
        });

        await invoke('set_airdrop_tokens', {
            airdropTokens: {
                token: airdropTokens.token,
                refresh_token: airdropTokens.refreshToken,
            },
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

const getExistingTokens = async () => {
    const existingTokensStore = localStorage.getItem('airdrop-store');
    let existingTokens: AirdropTokens | undefined = undefined;
    if (existingTokensStore) {
        try {
            const parsedStore = JSON.parse(existingTokensStore);
            if (parsedStore.state && parsedStore.state.airdropTokens) {
                existingTokens = parsedStore.state.airdropTokens;
                if (!existingTokens?.token || !existingTokens?.refreshToken) {
                    return undefined;
                }

                const currentState = useAirdropStore.getState();

                useAirdropStore.setState({
                    ...currentState,
                    airdropTokens: {
                        ...existingTokens,
                        expiresAt: parseJwt(existingTokens.token).exp,
                    },
                });

                await invoke('set_airdrop_tokens', {
                    airdropTokens: { token: existingTokens.token, refresh_token: existingTokens.refreshToken },
                });

                // Remove old tokens
                localStorage.removeItem('airdrop-store');
                console.info('Previous tokens set local store cleared');
            }
        } catch (e) {
            console.error('Failed to parse existing tokens:', e);
        }
    } else {
        console.info('No existing tokens found');
    }
};

const fetchBackendInMemoryConfig = async () => {
    let backendInMemoryConfig: BackendInMemoryConfig | undefined = undefined;

    try {
        backendInMemoryConfig = await invoke('get_app_in_memory_config', {});
        const airdropTokens = (await invoke('get_airdrop_tokens')) || {};
        const newState: AirdropState = {
            backendInMemoryConfig,
        };

        if (airdropTokens?.token) {
            newState.airdropTokens = {
                ...airdropTokens,
                expiresAt: parseJwt(airdropTokens.token).exp,
                refreshToken: airdropTokens.refresh_token,
            };
        }

        useAirdropStore.setState(newState);
    } catch (e) {
        throw `get_app_in_memory_config error: ${e}`;
    }

    if (!backendInMemoryConfig?.airdropUrl) {
        console.error('Error getting BE in memory config');
    }

    return backendInMemoryConfig;
};

export const airdropSetup = async () => {
    try {
        console.info('Fetching backend in memory config');
        const beConfig = await fetchBackendInMemoryConfig();
        console.info('Getting existing tokens');
        await getExistingTokens();
        if (beConfig?.airdropUrl) {
            console.info('Refreshing airdrop tokens');
            await handleRefreshAirdropTokens(beConfig.airdropUrl);
        }
    } catch (error) {
        console.error('Error in airdropSetup: ', error);
    }
};
