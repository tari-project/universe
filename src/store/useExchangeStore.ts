import { create } from 'zustand';
import { ExchangeContent, ExchangeMiner } from '@app/types/exchange.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useConfigBEInMemoryStore } from '@app/store/useAppConfigStore.ts';

interface ExchangeStoreState {
    content?: ExchangeContent | null;
    showClassicModal: boolean | null;
    exchangeMiners?: ExchangeMiner[];
    showUniversalModal: boolean | null;
}

const initialState = {
    showClassicModal: null,
    showUniversalModal: null,
};
export const useExchangeStore = create<ExchangeStoreState>()(() => ({ ...initialState }));

export const setShowExchangeModal = (showClassicModal: boolean) => {
    useExchangeStore.setState({ showClassicModal: showClassicModal });
};

export const setExchangeContent = (content?: ExchangeContent | null) => {
    useExchangeStore.setState({ content });
};

export const setShowUniversalModal = (showUniversalModal: boolean) => {
    useExchangeStore.setState({ showUniversalModal: showUniversalModal });
};

export const setExchangeMiners = (exchangeMiners?: ExchangeMiner[]) => {
    useExchangeStore.setState({ exchangeMiners });
};

export async function fetchExchangeMiners() {
    const mocked_list = [
        { id: '1', name: 'Mocked Miner 1', slug: 'mocked-miner-1' },
        { id: '2', name: 'Mocked Miner 2', slug: 'mocked-miner-2' },
        { id: '3', name: 'Mocked Miner 3', slug: 'mocked-miner-3' },
    ];
    setExchangeMiners(mocked_list);
}

export async function fetchExchangeContent(exchangeId: string) {
    const apiUrl = useConfigBEInMemoryStore.getState().airdropApiUrl;
    const endpoint = `${apiUrl}/miner/exchanges`;
    try {
        const content = await fetch(`${endpoint}/${exchangeId}`);
        const xcContent = (await content.json()) as ExchangeContent;
        const walletIsGenerated = useWalletStore.getState().is_tari_address_generated;
        if (xcContent) {
            setExchangeContent(xcContent);
            setShowExchangeModal(!!walletIsGenerated);
        }
    } catch (e) {
        console.error('Could not fetch exchange content', e);
    }
}
