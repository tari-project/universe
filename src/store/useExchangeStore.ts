import { create } from 'zustand';
import { ExchangeContent } from '@app/types/exchange.ts';

interface ExchangeStoreState {
    content?: ExchangeContent;
    showModal: boolean;
}

const initialState = {
    showModal: false,
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
        const json = (await content.json()) as ExchangeContent;
        setExchangeContent(json);
        const canShowModal = json?.exchange_id && json?.exchange_id.length > 0 && json?.exchange_id !== 'universal';
        if (canShowModal) {
            setShowExchangeModal(true);
        }
    } catch (e) {
        console.error('Could not fetch exchange content', e);
    }
}
