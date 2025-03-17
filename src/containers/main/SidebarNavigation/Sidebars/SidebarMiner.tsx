import { memo } from 'react';

import OrphanChainAlert from '../components/OrphanChainAlert/OrphanChainAlert.tsx';
import LostConnectionAlert from '../components/LostConnectionAlert.tsx';
import MiningButton from '../components/MiningButton/MiningButton.tsx';

import Miner from '../components/Miner/Miner.tsx';

import {
    GridAreaBottom,
    GridAreaTop,
    HistoryLabel,
    HistoryWrapper,
    RewardWrapper,
    SidebarGrid,
} from './SidebarMiner.styles.ts';

import HistoryList from '@app/components/transactions/history/HistoryList.tsx';
import WalletBalanceMarkup from '@app/containers/main/SidebarNavigation/components/Wallet/WalletBalanceMarkup.tsx';
import { useTranslation } from 'react-i18next';
import { useWalletStore } from '@app/store';

const SidebarMiner = memo(function Sidebar() {
    const { t } = useTranslation('wallet', { useSuspense: false });
    const transactions = useWalletStore((s) => s.transactions);
    return (
        <SidebarGrid>
            <GridAreaTop>
                <MiningButton />
                <LostConnectionAlert />
                <OrphanChainAlert />
                <Miner />
            </GridAreaTop>
            <GridAreaBottom>
                <RewardWrapper>
                    <WalletBalanceMarkup />
                    <HistoryWrapper>
                        {transactions?.length ? <HistoryLabel>{t('history.label-rewards')}</HistoryLabel> : null}
                        <HistoryList winsOnly />
                    </HistoryWrapper>
                </RewardWrapper>
            </GridAreaBottom>
        </SidebarGrid>
    );
});

export default SidebarMiner;
