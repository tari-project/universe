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

interface User {
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
    };
}

interface UserDetails {
    user: User;
}

interface AirdropTokens {
    token: string;
    refreshToken: string;
    expiresAt?: number;
}

//////////////////////////////////////////

interface AirdropState {
    authUuid: string;
    airdropTokens?: AirdropTokens;
    userDetails?: UserDetails;
    userPoints?: UserPoints;
}

interface AirdropStore extends AirdropState {
    setAuthUuid: (authUuid: string) => void;
    setAirdropTokens: (airdropToken: AirdropTokens) => void;
    setUserDetails: (userDetails?: UserDetails) => void;
    setUserPoints: (userPoints?: UserPoints) => void;
    logout: () => void;
}

export const useAirdropStore = create<AirdropStore>()(
    persist(
        (set) => ({
            authUuid: '',
            logout: () => set({ airdropTokens: undefined }),
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
        }),
        {
            name: 'airdrop-store',
            partialize: (state) =>
                Object.fromEntries(Object.entries(state).filter(([key]) => key !== 'userPoints')),
        }
    )
);
