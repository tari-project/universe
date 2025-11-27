import { handleRefreshAirdropTokens } from '@app/hooks/airdrop/stateHelpers/useAirdropTokensRefresh.ts';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';
import {
    type AirdropConfigBackendInMemory,
    type AirdropStoreState,
    type AirdropTokens,
    type AnimationType,
    type BonusTier,
    type CommunityMessage,
    type UserDetails,
    type UserEntryPoints,
    type UserPoints,
    useAirdropStore,
    useConfigBEInMemoryStore,
    useUIStore,
} from '@app/store';
import { handleCloseSplashscreen } from '@app/store/actions/uiStoreActions.ts';
import type { XSpaceEvent } from '@app/types/ws.ts';
import type { BackgroundClaimResult, TrancheStatus, BalanceSummary } from '@app/types/airdrop-claim.ts';
import { invoke } from '@tauri-apps/api/core';
import { useConfigCoreStore } from '@app/store/stores/config/useConfigCoreStore.ts';
import { setAirdropTokensInConfig } from '@app/store/actions/config/core.ts';

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
            .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
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
    uiSendRecvEnabled: true,
    crewQueryParams: {
        status: 'active',
        page: 1,
        limit: 20,
    },
    showTrancheModal: false,
};

const getAirdropInMemoryConfig = async () => {
    let airdropInMemoryConfig: AirdropConfigBackendInMemory | undefined = useConfigBEInMemoryStore.getState();

    if (!airdropInMemoryConfig) {
        try {
            airdropInMemoryConfig = await invoke('get_app_in_memory_config', {});
        } catch (e) {
            throw `get_app_in_memory_config error: ${e}`;
        }
    }

    try {
        const airdropTokens = (await invoke('get_airdrop_tokens')) || {};
        const newState: Partial<AirdropStoreState> = {
            backendInMemoryConfig: airdropInMemoryConfig,
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
        throw `get_airdrop_tokens error: ${e}`;
    }

    if (!airdropInMemoryConfig?.airdrop_url?.length) {
        console.error('Error getting BE in memory config');
    }
    return airdropInMemoryConfig;
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
        const beConfig = await getAirdropInMemoryConfig();

        if (beConfig) {
            console.info('Getting existing tokens');
            await getExistingTokens();
            if (beConfig.airdrop_url) {
                console.info('Refreshing airdrop tokens');
                await handleRefreshAirdropTokens();
                await fetchAllUserData();
                if (useUIStore.getState().showSplashscreen) {
                    handleCloseSplashscreen();
                }
            }
        }
    } catch (error) {
        console.error('Error in airdropSetup: ', error);
    }
};
export const handleAirdropLogout = async (isUserLogout = false) => {
    if (isUserLogout) {
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

export async function fetchFeatureFlag(featureName?: string) {
    const path = featureName ? `/features/${featureName}` : '/features';
    return await handleAirdropRequest<{
        features?: string[];
        access?: boolean;
    } | null>({
        publicRequest: true,
        path,
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    });
}

export async function fetchFeatures() {
    const response = await fetchFeatureFlag();
    if (response?.features) {
        const enabledFeatures = response.features;
        useAirdropStore.setState({ features: enabledFeatures });
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

// AIRDROP CLAIM ACTIONS
export const setClaimInProgress = (isInProgress: boolean) => {
    useAirdropStore.setState((state) => ({
        claim: {
            isClaimInProgress: isInProgress,
            lastClaimResult: state.claim?.lastClaimResult || null,
            lastClaimTimestamp: isInProgress ? Date.now() : state.claim?.lastClaimTimestamp || null,
        },
    }));
};

export const setClaimResult = (result: BackgroundClaimResult) => {
    useAirdropStore.setState((_state) => ({
        claim: {
            isClaimInProgress: false,
            lastClaimResult: result,
            lastClaimTimestamp: Date.now(),
        },
    }));
};

// Tranche state actions
export const setTrancheStatus = (trancheStatus: TrancheStatus) => {
    useAirdropStore.setState((_state) => ({
        trancheStatus,
        // Calculate balance summary from tranche data
        balanceSummary: calculateBalanceSummaryFromTranches(trancheStatus),
    }));
};

// Helper function to calculate balance summary from tranche data
function calculateBalanceSummaryFromTranches(trancheStatus: TrancheStatus): BalanceSummary {
    const totalXtm = trancheStatus.tranches.reduce((sum, tranche) => sum + tranche.amount, 0);
    const totalClaimed = trancheStatus.tranches
        .filter((tranche) => tranche.claimed)
        .reduce((sum, tranche) => sum + tranche.amount, 0);

    const now = new Date();
    const totalExpired = trancheStatus.tranches
        .filter((tranche) => !tranche.claimed && new Date(tranche.validTo) < now)
        .reduce((sum, tranche) => sum + tranche.amount, 0);

    const totalPending = totalXtm - totalClaimed - totalExpired;

    return {
        totalXtm,
        totalClaimed,
        totalPending,
        totalExpired,
    };
}

// Modal state actions
export const setShowTrancheModal = (show: boolean) => {
    useAirdropStore.setState({ showTrancheModal: show });
};

export const openTrancheModal = () => {
    setShowTrancheModal(true);
};

export const closeTrancheModal = () => {
    setShowTrancheModal(false);
};
