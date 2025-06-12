import { useConfigBEInMemoryStore, useUIStore } from '@app/store';
import { useQuery } from '@tanstack/react-query';
import { universalExchangeMinerOption } from '@app/store/useExchangeStore.ts';
import { ExchangeBranding } from '@app/types/exchange.ts';
import { queryClient } from '@app/App/queryClient.ts';

export const KEY_XC_LIST = 'exchanges';

export const queryFn = async () => {
    const apiUrl = useConfigBEInMemoryStore.getState().airdropApiUrl;
    const endpoint = `${apiUrl}/miner/exchanges`;

    if (!apiUrl.length) return [];
    try {
        const res = await fetch(`${endpoint}`);
        if (res.ok) {
            const list = (await res.json()) as {
                exchanges: ExchangeBranding[];
            };
            const filteredList = list.exchanges.filter((ex) => !ex.is_hidden);
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
    const isAppExchangeSpecific = useUIStore((s) => s.isAppExchangeSpecific);

    return useQuery({
        queryKey: [KEY_XC_LIST],
        enabled: !isAppExchangeSpecific,
        queryFn: () => queryFn(),
        refetchOnWindowFocus: true,
        refetchInterval: 60 * 1000 * 60 * 3, // every three hours
    });
}

export async function fetchExchangeList() {
    return await queryClient.fetchQuery({ queryKey: [KEY_XC_LIST], queryFn: () => queryFn() });
}
