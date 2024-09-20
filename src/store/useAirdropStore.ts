import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

interface TokenResponse {
    exp: number;
    iat: number;
    id: string;
    provider: string;
    role: string;
    scope: string;
}

export interface UserPoints {
    gems: number;
    shells: number;
    hammers: number;
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

//////////////////////////////////////////

interface AirdropState {
    authUuid: string;
    wipUI?: boolean;
    airdropTokens?: AirdropTokens;
    userDetails?: UserDetails;
    userPoints?: UserPoints;
    backendInMemoryConfig?: BackendInMemoryConfig;
}

interface AirdropStore extends AirdropState {
    setAuthUuid: (authUuid: string) => void;
    setAirdropTokens: (airdropToken: AirdropTokens) => void;
    setUserDetails: (userDetails?: UserDetails) => void;
    setUserPoints: (userPoints?: UserPoints) => void;
    setWipUI: (wipUI: boolean) => void;
    setBackendInMemoryConfig: (config?: BackendInMemoryConfig) => void;
    logout: () => void;
}

const clearState: AirdropState = {
    authUuid: '',
    airdropTokens: undefined,
    userDetails: undefined,
    userPoints: undefined,
};

export const useAirdropStore = create<AirdropStore>()(
    persist(
        (set) => ({
            authUuid: '',
            setWipUI: (wipUI) => set({ wipUI }),
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
            setUserPoints: (userPoints) => set({ userPoints }),
            setBackendInMemoryConfig: (backendInMemoryConfig) => set({ backendInMemoryConfig }),
        }),
        {
            name: 'airdrop-store',
            partialize: (state) =>
                Object.fromEntries(
                    Object.entries(state).filter(([key]) => !['userPoints', 'backendInMemoryConfig'].includes(key))
                ),
        }
    )
);
