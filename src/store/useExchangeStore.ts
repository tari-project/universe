import { create } from 'zustand';
import { ExchangeContent } from '@app/types/exchange.ts';

interface ExchangeStoreState {
    content?: ExchangeContent;
    showModal: boolean;
}

const canShowModal = import.meta.env.VITE_SHOW_EXCHANGE; // TODO - get from BE, though should true first thing

const initialState = {
    showModal: canShowModal,
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
        if (canShowModal && json.exchange_id) {
            setShowExchangeModal(true);
        }
    } catch (e) {
        console.error('Could not fetch exchange content', e);
    }
}
