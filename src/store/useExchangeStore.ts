import { create } from 'zustand';
import { ExchangeContent } from '@app/types/exchange.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';

interface ExchangeStoreState {
    content?: ExchangeContent;
    showModal: boolean | null;
}

const initialState = {
    showModal: null,
};
export const useExchangeStore = create<ExchangeStoreState>()(() => ({ ...initialState }));

export const setShowExchangeModal = (showModal: boolean) => {
    useExchangeStore.setState({ showModal });
};

export const setExchangeContent = (content: ExchangeContent) => {
    useExchangeStore.setState({ content });
};

export async function fetchExchangeContent(exchangeId: string) {
    const endpoint = `https://rwa.y.at/miner/exchanges`;
    try {
        const content = await fetch(`${endpoint}/${exchangeId}`);
        const xcContent = (await content.json()) as ExchangeContent;
        const walletIsGenerated = useWalletStore.getState().is_tari_address_generated;
        console.debug(`xcContent= `, xcContent);
        console.debug(`walletIsGenerated= `, walletIsGenerated);
        if (xcContent) {
            setExchangeContent(xcContent);
            setShowExchangeModal(!!walletIsGenerated);
        }
    } catch (e) {
        console.error('Could not fetch exchange content', e);
    }
}
