import { create } from 'zustand';

import { useConfigBEInMemoryStore } from '@app/store/useAppConfigStore.ts';
import { useUIStore } from './useUIStore';
import { ExchangeBranding } from '@app/types/exchange.ts';

interface ExchangeStoreState {
    showExchangeAddressModal: boolean | null;
    exchangeMiners?: ExchangeBranding[];
    currentExchangeMiner: ExchangeBranding;
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
    currentExchangeMiner: universalExchangeMinerOption,
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

export const setCurrentExchangeMiner = (currentExchangeMiner?: ExchangeBranding) => {
    if (!currentExchangeMiner) return;
    useExchangeStore.setState({ currentExchangeMiner });
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

export async function fetchExchangeContent(exchangeId: string) {
    const currentExchangeContent = useExchangeStore.getState().currentExchangeMiner;
    if (currentExchangeContent?.id === exchangeId) {
        return currentExchangeContent;
    }

    const apiUrl = useConfigBEInMemoryStore.getState().airdropApiUrl;
    const endpoint = `${apiUrl}/miner/exchanges`;
    try {
        const content = await fetch(`${endpoint}/${exchangeId}`);
        const xcContent = (await content.json()) as ExchangeBranding;
        const shouldShowExchangeSpecificModal = useUIStore.getState().shouldShowExchangeSpecificModal;
        if (xcContent) {
            setCurrentExchangeMiner(xcContent);
            setShowExchangeModal(shouldShowExchangeSpecificModal);
        }
        return xcContent;
    } catch (e) {
        console.error('Could not fetch exchange content', e);
    }
}
