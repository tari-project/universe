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
