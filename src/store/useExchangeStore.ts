import { create } from 'zustand';
import { ExchangeContent } from '@app/types/exchange.ts';

interface ExchangeStoreState {
    content: ExchangeContent;
    showModal: boolean;
}

const testExchange: ExchangeContent = {
    createdAt: '2025-05-08T12:03:09.110Z',
    updatedAt: '2025-05-08T12:17:04.393Z',
    id: '28bef841-a8cd-4a9a-ba64-4cd295fcec86',
    exchange_name: 'TariExchange',
    exchange_campaign_cta: 'Connect to TariExchange to Earn Bonus XTM',
    exchange_campaign_description: 'Mine to TariExchange and earn bonus XTM',
    exchange_campaign_description_extra: 'Mine Tari and get 20% bonus XTM per month',
    exchange_wallet_label: 'Enter your TariExchange Tari address',
    exchange_hero_img: '/assets/img/coins.png',
    exchange_logo_img: '/assets/img/tari-outline.svg',
    primary_col: '#07C9C9',
    secondary_col: '#20FF79',
};
const showModalInitial = import.meta.env.VITE_SHOW_EXCHANGE;

const initialState = {
    content: testExchange,
    showModal: showModalInitial, // TODO - get from BE, though should true first thing
};
export const useExchangeStore = create<ExchangeStoreState>()(() => ({ ...initialState }));

export const setShowExchangeModal = (showModal: boolean) => {
    useExchangeStore.setState({ showModal });
};
