import { useConfigBEInMemoryStore, useConfigUIStore } from '@app/store';
import { useQuery } from '@tanstack/react-query';
import { setRewardData, universalExchangeMinerOption } from '@app/store/useExchangeStore.ts';
import { ExchangeBranding } from '@app/types/exchange.ts';
import { queryClient } from '@app/App/queryClient.ts';
import { WalletUIMode } from '@app/types/events-payloads';
import { handleAirdropRequest } from '@app/hooks/airdrop/utils/useHandleRequest.ts';

export const KEY_XC_LIST = 'exchanges-list';

function handleRewardData(list: ExchangeBranding[]) {
    const highestAmt = list.sort((a, b) => (b?.reward_percentage || 0) - (a?.reward_percentage || 0))?.[0]
        ?.reward_percentage;
    const latestDate = list.sort((a, b) => {
        const timeStampA = a.reward_expiry_date ? new Date(a.reward_expiry_date).getTime() : 0;
        const timeStampB = b.reward_expiry_date ? new Date(b.reward_expiry_date).getTime() : 0;
        return timeStampB - timeStampA;
    })?.[0]?.reward_expiry_date;

    setRewardData({ reward_earn_cap_percentage: highestAmt, reward_end_date: latestDate });
}

const queryFn = async (apiUrl: string) => {
    const path = `/miner/exchanges?include_wXTM=true`;
    if (!apiUrl.length) return [];
    try {
        const res = await handleAirdropRequest<{ exchanges: ExchangeBranding[] }>({
            path,
            method: 'GET',
            publicRequest: true,
        });
        if (res?.exchanges) {
            const filteredList = res.exchanges.filter((ex) => !ex.is_hidden);
            if (filteredList.length) {
                handleRewardData(filteredList);
            }
            filteredList.push(universalExchangeMinerOption);

            return filteredList;
        } else {
            return [];
        }
    } catch (e) {
        console.error('Could not fetch exchange miners', e);
    }
};

export function useFetchExchangeList() {
    const isWalletUIExchangeSpecific = useConfigUIStore((s) => s.wallet_ui_mode === WalletUIMode.ExchangeSpecificMiner);
    const apiUrl = useConfigBEInMemoryStore((s) => s.airdrop_api_url);
    return useQuery({
        queryKey: [KEY_XC_LIST],
        enabled: Boolean(apiUrl.length && !isWalletUIExchangeSpecific),
        queryFn: async () => await queryFn(apiUrl),
        refetchOnWindowFocus: true,
        refetchInterval: 60 * 1000 * 60 * 3, // every three hours
    });
}

export async function fetchExchangeList() {
    return await queryClient.fetchQuery({ queryKey: [KEY_XC_LIST] });
}
