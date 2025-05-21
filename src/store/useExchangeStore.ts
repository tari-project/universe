import { create } from 'zustand';
import { ExchangeContent } from '@app/types/exchange.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useConfigBEInMemoryStore } from '@app/store/useAppConfigStore.ts';

interface ExchangeStoreState {
    content?: ExchangeContent | null;
    showModal: boolean | null;
}

const initialState = {
    showModal: null,
};
export const useExchangeStore = create<ExchangeStoreState>()(() => ({ ...initialState }));

export const setShowExchangeModal = (showModal: boolean) => {
    useExchangeStore.setState({ showModal });
};

export const setExchangeContent = (content?: ExchangeContent | null) => {
    useExchangeStore.setState({ content });
};

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
