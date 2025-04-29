import { invoke } from '@tauri-apps/api/core';
import { handleRefreshAirdropTokens } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh.ts';
import {
    AirdropStoreState,
    AirdropTokens,
    AnimationType,
    BackendInMemoryConfig,
    BonusTier,
    CommunityMessage,
    setAirdropTokensInConfig,
    useAirdropStore,
    useConfigCoreStore,
    UserDetails,
    UserEntryPoints,
    UserPoints,
    useUIStore,
} from '@app/store';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import { initialiseSocket, removeSocket } from '@app/utils/socket.ts';
import { XSpaceEvent } from '@app/types/ws.ts';
import { handleCloseSplashscreen } from '@app/store/actions/uiStoreActions.ts';

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
    const storedTokens = useConfigCoreStore.getState().airdrop_tokens || parsedStorageTokens;
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
            await handleRefreshAirdropTokens();
            await fetchAllUserData();
            if (useUIStore.getState().showSplashscreen) {
                handleCloseSplashscreen();
            }
        }
    } catch (error) {
        console.error('Error in airdropSetup: ', error);
    }
};
export const handleAirdropLogout = async (isUserLogout = false) => {
    if (!isUserLogout) {
        removeSocket();
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

        const airdropApiUrl = useAirdropStore.getState().backendInMemoryConfig?.airdropApiUrl;
        const authToken = airdropTokens?.token;

        if (airdropApiUrl && authToken) {
            initialiseSocket(airdropApiUrl, authToken);
        }
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

export const setLatestXSpaceEvent = (latestXSpaceEvent: XSpaceEvent | null) =>
    useAirdropStore.setState({ latestXSpaceEvent });
export const setUserDetails = (userDetails?: UserDetails) => useAirdropStore.setState({ userDetails });

export const setUserPoints = (userPoints: UserPoints) => {
    useAirdropStore.setState({ userPoints });
};

export const setXSpaceEvent = (xSpaceEvent: XSpaceEvent | null) => {
    useAirdropStore.setState({ latestXSpaceEvent: xSpaceEvent });
};

export const handleUsernameChange = async (username: string, onError?: (e: unknown) => void) => {
    return handleAirdropRequest<{ success: boolean; message?: string }>({
        path: '/user/username',
        method: 'POST',
        body: {
            username,
        },
        onError,
    }).then((r) => {
        if (r?.success) {
            fetchAllUserData();
        }
        return r;
    });
};

async function fetchFeatureFlag(route: string) {
    return await handleAirdropRequest<{ access: boolean } | null>({
        publicRequest: true,
        path: `/features/${route}`,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export async function fetchPollingFeatureFlag() {
    const response = await fetchFeatureFlag('polling');
    if (response) {
        useAirdropStore.setState({ pollingEnabled: response.access });
        // Let the BE know we're using the polling feature for mining proofs
        // invoke('set_airdrop_polling', { pollingEnabled: response.access });
    }
    return response;
}

export async function fetchOrphanChainUiFeatureFlag() {
    const response = await fetchFeatureFlag('orphan-chain-ui-disabled');
    if (response) {
        useAirdropStore.setState({ orphanChainUiDisabled: response.access });
    }
    return response;
}

export async function fetchWarmupFeatureFlag() {
    const response = await fetchFeatureFlag('warmup');
    if (response) {
        useUIStore.setState({ showWarmup: response.access });
    }
    return response;
}

export async function fetchCommunityMessages() {
    const response = await handleAirdropRequest<CommunityMessage[] | null>({
        publicRequest: true,
        path: '/miner/community-message',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (response) {
        useAirdropStore.setState({ communityMessages: response });
    }

    return response;
}

export async function fetchLatestXSpaceEvent() {
    const response = await handleAirdropRequest<XSpaceEvent | null>({
        publicRequest: true,
        path: '/miner/x-space-events/latest',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });

    if (response) {
        useAirdropStore.setState({ latestXSpaceEvent: response });
    }

    return response;
}

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
        requests.push(fetchBonusTiers());
        await Promise.all(requests);
    };
    const authToken = useAirdropStore.getState().airdropTokens?.token;
    if (authToken) {
        await fetchData();
    }
};
