import { create } from 'zustand';

import { ExchangeBranding } from '@app/types/exchange.ts';

interface ExchangeStoreState {
    showExchangeAddressModal: boolean | null;
    currentExchangeMinerId: string;
    showUniversalModal: boolean | null;
    reward_end_date?: string;
    reward_earn_cap_percentage?: number;
}

const UNIVERSE_LOGO_PATH = '/assets/img/tari_round.png';
export const universalExchangeMinerOption: ExchangeBranding = {
    id: 'universal',
    slug: 'universal',
    name: 'Tari Universe',
    is_hidden: false,
    exchange_id: 'universal',
    logo_img_small_url: UNIVERSE_LOGO_PATH,
    wxtm_mode: false,
};

// Built-in aggregator for wXTM exchange: Rubic widget preconfigured to swap into wXTM on Ethereum
export const WXTM_AGGREGATOR_URL = 'https://app.rubic.exchange/?from=wXTM&fromChain=ETH&to=USDT&toChain=ETH';
export const aggregatorExchangeMinerOption: ExchangeBranding = {
    id: 'wxtm-aggregator',
    slug: 'wxtm-aggregator',
    name: 'Rubic',
    is_hidden: false,
    exchange_id: 'wxtm-aggregator',
    exchange_url: WXTM_AGGREGATOR_URL,
    wxtm_mode: true,
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

export const setCurrentExchangeMinerId = (currentExchangeMinerId?: string) => {
    if (!currentExchangeMinerId) return;
    useExchangeStore.setState({ currentExchangeMinerId });
};

export const setRewardData = ({
    reward_end_date,
    reward_earn_cap_percentage,
}: {
    reward_end_date?: string;
    reward_earn_cap_percentage?: number;
}) => {
    useExchangeStore.setState((c) => ({ ...c, reward_end_date, reward_earn_cap_percentage }));
};
