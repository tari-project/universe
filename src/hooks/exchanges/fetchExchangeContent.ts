import { useConfigBEInMemoryStore, useUIStore } from '@app/store';
import { useQuery } from '@tanstack/react-query';
import {
    setCurrentExchangeMinerId,
    setShowExchangeModal,
    universalExchangeMinerOption,
    useExchangeStore,
} from '@app/store/useExchangeStore.ts';
import { ExchangeBranding } from '@app/types/exchange.ts';
import { queryClient } from '@app/App/queryClient.ts';
import { useTheme } from 'styled-components';

export const KEY_XC_CONTENT = 'exchange';

export const queryfn = async (exchangeId: string) => {
    if (exchangeId === 'universal') {
        return Promise.resolve(universalExchangeMinerOption);
    }

    const apiUrl = useConfigBEInMemoryStore.getState().airdropApiUrl;
    const endpoint = `${apiUrl}/miner/exchanges/${exchangeId}`;

    try {
        const res = await fetch(endpoint);
        const content = (await res.json()) as ExchangeBranding;
        const shouldShowExchangeSpecificModal = useUIStore.getState().shouldShowExchangeSpecificModal;

        setCurrentExchangeMinerId(content.id);
        if (content) {
            setShowExchangeModal(shouldShowExchangeSpecificModal);
        }
        return content;
    } catch (e) {
        console.error('Could not fetch exchange content', e);
    }
};

export function useFetchExchangeBranding() {
    const theme = useTheme();
    const exchangeId = useExchangeStore((s) => s.currentExchangeMinerId);

    return useQuery({
        queryKey: [KEY_XC_CONTENT, exchangeId],
        enabled: !!exchangeId?.length,
        queryFn: () => queryfn(exchangeId),
        select: (data) => {
            if (data) {
                let logo_img_small_url = data.logo_img_small_url;
                let logo_img_url = data.logo_img_url;

                if (theme.mode === 'dark') {
                    logo_img_small_url = data.dark_logo_img_small_url ?? data.logo_img_small_url;
                    logo_img_url = data.dark_logo_img_url ?? data.logo_img_url;
                }

                return { ...data, logo_img_url, logo_img_small_url };
            }
        },
        refetchOnWindowFocus: true,
        refetchInterval: 60 * 1000 * 60 * 3, // every three hours
    });
}

export async function fetchExchangeContent(exchangeId: string) {
    return await queryClient.fetchQuery({ queryKey: [KEY_XC_CONTENT, exchangeId], queryFn: () => queryfn(exchangeId) });
}

export const refreshXCContent = async (exchangeId: string) => {
    await queryClient.invalidateQueries({ queryKey: [KEY_XC_CONTENT, exchangeId] });
};
