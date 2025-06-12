import { create } from 'zustand';

import { useConfigBEInMemoryStore } from '@app/store/useAppConfigStore.ts';

import { ExchangeBranding } from '@app/types/exchange.ts';

interface ExchangeStoreState {
    showExchangeAddressModal: boolean | null;
    exchangeMiners?: ExchangeBranding[];
    currentExchangeMinerId: string;
    showUniversalModal: boolean | null;
}

export const universalExchangeMinerOption: ExchangeBranding = {
    id: 'universal',
    slug: 'universal',
    name: 'Tari Universe',
    is_hidden: false,
    exchange_id: 'universal',
};

const initialState = {
    showExchangeAddressModal: null,
    showUniversalModal: null,
    currentExchangeMinerId: universalExchangeMinerOption.exchange_id,
};
export const useExchangeStore = create<ExchangeStoreState>()(() => ({ ...initialState }));

export const setShowExchangeModal = (showExchangeAddressModal: boolean) => {
    useExchangeStore.setState({ showExchangeAddressModal });
};

export const setShowUniversalModal = (showUniversalModal: boolean) => {
    useExchangeStore.setState({ showUniversalModal: showUniversalModal });
};

export const setExchangeMiners = (exchangeMiners?: ExchangeBranding[]) => {
    if (!exchangeMiners) return;
    useExchangeStore.setState({ exchangeMiners });
};

export const setCurrentExchangeMinerId = (currentExchangeMinerId?: string) => {
    if (!currentExchangeMinerId) return;
    useExchangeStore.setState({ currentExchangeMinerId });
};

export async function fetchExchangeMiners() {
    const apiUrl = useConfigBEInMemoryStore.getState().airdropApiUrl;
    if (!apiUrl) return;
    const endpoint = `${apiUrl}/miner/exchanges`;
    try {
        const res = await fetch(`${endpoint}`);
        if (res.ok) {
            const list = (await res.json()) as {
                exchanges: ExchangeBranding[];
            };
            const filteredList = list.exchanges.filter((ex) => !ex.is_hidden);
            filteredList.push(universalExchangeMinerOption);
            setExchangeMiners(filteredList);
        }
    } catch (e) {
        console.error('Could not fetch exchange miners', e);
    }
}
