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
    setAirdropTokensInConfig,
    useAirdropStore,
    useAppConfigStore,
    UserDetails,
    UserEntryPoints,
    UserPoints,
} from '@app/store';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';

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
    const localStorageTokens = localStorage.getItem('airdrop-store');
    const parsedStorageTokens = localStorageTokens ? JSON.parse(localStorageTokens) : undefined;
    const storedTokens = useAppConfigStore.getState().airdrop_tokens || parsedStorageTokens;
    if (storedTokens) {
        try {
            if (!storedTokens?.token || !storedTokens?.refreshToken) {
                return undefined;
            }

            useAirdropStore.setState((currentState) => ({
                ...currentState,
                airdropTokens: {
                    ...storedTokens,
                    expiresAt: parseJwt(storedTokens.token).exp,
                },
            }));
            setAirdropTokensInConfig(storedTokens);
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
            await fetchAllUserData();
        }
    } catch (error) {
        console.error('Error in airdropSetup: ', error);
    }
};
export const handleAirdropLogout = async (isUserLogout = false) => {
    if (!isUserLogout) {
        console.error('Error fetching user details, logging out');
    } else {
        console.info('User logout | removing airdrop tokens');
    }
    await setAirdropTokens(undefined);
};

export const setAirdropTokens = async (airdropTokens?: AirdropTokens) => {
    if (airdropTokens) {
        useAirdropStore.setState({
            airdropTokens: {
                ...airdropTokens,
                expiresAt: parseJwt(airdropTokens.token).exp,
            },
        });

        setAirdropTokensInConfig({
            token: airdropTokens.token,
            refreshToken: airdropTokens.refreshToken,
        });
    } else {
        // User not connected
        useAirdropStore.setState((currentState) => ({
            ...currentState,
            ...clearState,
            syncedWithBackend: true,
            airdropTokens: undefined,
        }));
        try {
            setAirdropTokensInConfig(undefined);
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

export const fetchAllUserData = async () => {
    const fetchUserDetails = async () => {
        return await handleAirdropRequest<UserDetails>({
            path: '/user/details',
            method: 'GET',
            onError: () => handleAirdropLogout(),
        })
            .then((data) => {
                if (data?.user?.id) {
                    setUserDetails(data);
                    return data.user;
                } else {
                    handleAirdropLogout();
                }
            })
            .catch(() => {
                handleAirdropLogout();
            });
    };
    // GET USER POINTS
    const fetchUserPoints = async () => {
        const data = await handleAirdropRequest<UserEntryPoints>({
            path: '/user/score',
            method: 'GET',
        });
        if (!data?.entry || !data?.entry?.gems) return;
        setUserPoints({
            base: {
                gems: data.entry.gems,
                shells: data.entry.shells,
                hammers: data.entry.hammers,
            },
        });
    };
    // GET USER REFERRAL POINTS
    const fetchUserReferralPoints = async () => {
        const data = await handleAirdropRequest<{ count: ReferralCount }>({
            path: '/miner/download/referral-count',
            method: 'GET',
        });
        if (!data?.count) return;
        setReferralCount({
            gems: data.count.gems,
            count: data.count.count,
        });
    };
    // FETCH BONUS TIERS
    const fetchBonusTiers = async () => {
        const data = await handleAirdropRequest<{ tiers: BonusTier[] }>({
            path: '/miner/download/bonus-tiers',
            method: 'GET',
        });
        if (!data?.tiers) return;
        setBonusTiers(data?.tiers);
    };
    const fetchData = async () => {
        const details = await fetchUserDetails();

        if (!details) return;
        const requests: Promise<void>[] = [];
        if (!details?.rank?.gems) {
            requests.push(fetchUserPoints());
        }
        requests.push(fetchUserReferralPoints());
        requests.push(fetchBonusTiers());

        await Promise.all(requests);
    };

    if (useAirdropStore.getState().airdropTokens?.token) {
        await fetchData();
    }
};
