import { useUIStore } from '@app/store/useUIStore';
import { useCallback, useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { TauriEvent } from '../../types.ts';

import { invoke } from '@tauri-apps/api/core';

import { useAppStateStore } from '../../store/appStateStore.ts';

import { useAirdropStore } from '@app/store/useAirdropStore.ts';
import { useHandleAirdropTokensRefresh } from '../airdrop/stateHelpers/useAirdropTokensRefresh.ts';
import { TransactionInfo, WalletBalance } from '@app/types/app-status.ts';
import { Transaction } from '@app/types/wallet.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';

export function useSetUp() {
    const isInitializingRef = useRef(false);
    const handleRefreshAirdropTokens = useHandleAirdropTokensRefresh();
    const adminShow = useUIStore((s) => s.adminShow);
    const setSetupDetails = useAppStateStore((s) => s.setSetupDetails);
    const setCriticalError = useAppStateStore((s) => s.setCriticalError);
    const setSettingUpFinished = useAppStateStore((s) => s.setSettingUpFinished);
    const setTransactions = useWalletStore((s) => s.setTransactions);
    const setWalletBalance = useWalletStore((s) => s.setWalletBalance);
    const fetchWalletDetails = useWalletStore((s) => s.fetchWalletDetails);

    const fetchApplicationsVersionsWithRetry = useAppStateStore((s) => s.fetchApplicationsVersionsWithRetry);
    const syncedAidropWithBackend = useAirdropStore((s) => s.syncedWithBackend);

    const fetchBackendInMemoryConfig = useAirdropStore((s) => s.fetchBackendInMemoryConfig);

    useEffect(() => {
        const refreshTokens = async () => {
            const backendInMemoryConfig = await fetchBackendInMemoryConfig();
            if (backendInMemoryConfig?.airdropApiUrl) {
                await handleRefreshAirdropTokens(backendInMemoryConfig.airdropApiUrl);
            }
        };
        refreshTokens();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const clearStorage = useCallback(() => {
        // clear all storage except airdrop data
        const airdropStorage = localStorage.getItem('airdrop-store');
        localStorage.clear();
        if (airdropStorage) {
            localStorage.setItem('airdrop-store', airdropStorage);
        }
    }, []);
    const handlePostSetup = useCallback(async () => {
        await fetchApplicationsVersionsWithRetry();
        await setSettingUpFinished();
    }, [fetchApplicationsVersionsWithRetry, setSettingUpFinished]);

    useEffect(() => {
        const unlistenPromise = listen(
            'transaction_history_updated',
            async ({ payload }: { payload: TransactionInfo[] }) => {
                const sortedTransactions = payload.sort((a, b) => b.timestamp - a.timestamp);
                const mapped = sortedTransactions?.map((tx) => {
                    const blockHeight = tx.message.split(': ')[1];
                    return blockHeight ? { ...tx, blockHeight } : tx;
                }) as Transaction[];

                if (mapped?.length) {
                    setTransactions(mapped);
                }
            }
        );
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [setTransactions]);

    useEffect(() => {
        const unlistenPromise = listen('wallet_balance_updated', async ({ payload }: { payload: WalletBalance }) => {
            console.log('wallet_balance_updated', payload);
            setWalletBalance(payload);
        });
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [setWalletBalance]);

    useEffect(() => {
        if (adminShow === 'setup') return;
        const unlistenPromise = listen('message', async ({ event: e, payload: p }: TauriEvent) => {
            switch (p.event_type) {
                case 'setup_status':
                    if (p.progress > 0) {
                        setSetupDetails(p.title, p.title_params, p.progress);
                    }
                    if (p.progress >= 0.75) {
                        fetchWalletDetails();
                    }
                    if (p.progress >= 1) {
                        await handlePostSetup();
                    }
                    break;
                default:
                    console.warn('Unknown tauri event: ', { e, p });
                    break;
            }
        });
        if (syncedAidropWithBackend && !isInitializingRef.current) {
            isInitializingRef.current = true;
            clearStorage();
            invoke('setup_application').catch((e) => {
                console.error(`Failed to setup application: ${e}`);
                setCriticalError(`Failed to setup application: ${e}`);
            });
        }
        return () => {
            unlistenPromise.then((unlisten) => unlisten());
        };
    }, [
        clearStorage,
        handlePostSetup,
        setCriticalError,
        setSetupDetails,
        adminShow,
        syncedAidropWithBackend,
        fetchWalletDetails,
    ]);
}
