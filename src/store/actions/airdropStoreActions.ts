import { invoke } from '@tauri-apps/api/core';
import { handleRefreshAirdropTokens } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh.ts';
import {
    AirdropStoreState,
    AirdropTokens,
    AnimationType,
    BackendInMemoryConfig,
    BonusTier,
    ReferralCount,
    ReferralQuestPoints,
    useAirdropStore,
    UserDetails,
    UserPoints,
} from '@app/store';

interface TokenResponse {
    exp: number;
    iat: number;
    id: string;
    provider: string;
    role: string;
    scope: string;
}

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

const clearState: AirdropStoreState = {
    authUuid: '',
    airdropTokens: undefined,
    miningRewardPoints: undefined,
    userDetails: undefined,
    userPoints: undefined,
    referralQuestPoints: undefined,
    bonusTiers: undefined,
    flareAnimationType: undefined,
};

const fetchBackendInMemoryConfig = async () => {
    let backendInMemoryConfig: BackendInMemoryConfig | undefined = undefined;

    try {
        backendInMemoryConfig = await invoke('get_app_in_memory_config', {});
        const airdropTokens = (await invoke('get_airdrop_tokens')) || {};
        const newState: AirdropStoreState = {
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

export const handleAirdropLogout = async () => {
    await setAirdropTokens(undefined);
};
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
export const setAuthUuid = (authUuid: string) => useAirdropStore.setState({ authUuid });
export const setBonusTiers = (bonusTiers: BonusTier[]) => useAirdropStore.setState({ bonusTiers });
export const setFlareAnimationType = (flareAnimationType?: AnimationType) =>
    useAirdropStore.setState({ flareAnimationType });
export const setReferralCount = (referralCount: ReferralCount) => useAirdropStore.setState({ referralCount });
export const setReferralQuestPoints = (referralQuestPoints: ReferralQuestPoints) =>
    useAirdropStore.setState({ referralQuestPoints });
export const setUserDetails = (userDetails?: UserDetails) => useAirdropStore.setState({ userDetails });
export const setUserGems = (userGems: number) =>
    useAirdropStore.setState((state) => {
        const userPointsFormatted = {
            ...state.userPoints,
            base: { ...state.userPoints?.base, gems: userGems },
        } as UserPoints;

        return {
            userPoints: userPointsFormatted,
        };
    });
export const setUserPoints = (userPoints: UserPoints) =>
    useAirdropStore.setState({ userPoints, referralCount: userPoints?.referralCount });
