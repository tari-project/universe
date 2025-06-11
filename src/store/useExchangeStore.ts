import { create } from 'zustand';

import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useConfigBEInMemoryStore } from '@app/store/useAppConfigStore.ts';
import { setSeedlessUI } from '@app/store/actions/uiStoreActions.ts';
import { ExchangeBranding } from '@app/types/exchange.ts';

interface ExchangeStoreState {
    content?: ExchangeBranding | null;
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

export const setExchangeContent = (content?: ExchangeBranding | null) => {
    useExchangeStore.setState({ content });
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
    const apiUrl = useConfigBEInMemoryStore.getState().airdropApiUrl;
    const isUniversalMiner = useConfigBEInMemoryStore.getState().isUniversalMiner;
    const endpoint = `${apiUrl}/miner/exchanges`;
    try {
        const content = await fetch(`${endpoint}/${exchangeId}`);
        const xcContent = (await content.json()) as ExchangeBranding;
        const walletIsGenerated = useWalletStore.getState().is_tari_address_generated;
        if (xcContent) {
            setExchangeContent(xcContent);
            setSeedlessUI(!isUniversalMiner);
            if (!isUniversalMiner) setShowExchangeModal(!!walletIsGenerated);
        }
        return xcContent;
    } catch (e) {
        console.error('Could not fetch exchange content', e);
    }
}
