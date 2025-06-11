import { create } from 'zustand';
import { ExchangeContent, ExchangeMinerAssets } from '@app/types/exchange.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useConfigBEInMemoryStore } from '@app/store/useAppConfigStore.ts';
import { setSeedlessUI } from '@app/store/actions/uiStoreActions.ts';

interface ExchangeStoreState {
    content?: ExchangeMinerAssets | null;
    showExchangeAddressModal: boolean | null;
    exchangeMiners?: ExchangeMinerAssets[];
    currentExchangeMiner: ExchangeContent;
    showUniversalModal: boolean | null;
}

export const universalExchangeMinerOption: ExchangeMinerAssets = {
    id: 'universal',
    slug: 'universal',
    name: 'Tari Universe',
    logo_img_url: '/assets/img/TU-logo.svg',
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

export const setExchangeContent = (content?: ExchangeContent | null) => {
    useExchangeStore.setState({ content });
};

export const setShowUniversalModal = (showUniversalModal: boolean) => {
    useExchangeStore.setState({ showUniversalModal: showUniversalModal });
};

export const setExchangeMiners = (exchangeMiners?: ExchangeMinerAssets[]) => {
    useExchangeStore.setState({ exchangeMiners });
};

export const setCurrentExchangeMiner = (currentExchangeMiner?: ExchangeContent) => {
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
                exchanges: ExchangeContent[];
            };
            const filteredList = list.exchanges.filter((ex) => ex.slug !== 'universal' || ex.is_hidden);
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
        const xcContent = (await content.json()) as ExchangeContent;
        const walletIsGenerated = useWalletStore.getState().is_tari_address_generated;
        if (xcContent) {
            setExchangeContent(xcContent);
            setSeedlessUI(true);
            if (!isUniversalMiner) setShowExchangeModal(!!walletIsGenerated);
        }
        return xcContent;
    } catch (e) {
        console.error('Could not fetch exchange content', e);
    }
}
