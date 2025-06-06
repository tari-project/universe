import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ArrowRightSVG } from '@app/assets/icons/arrow-right.tsx';
import SyncTooltip from '@app/containers/navigation/components/Wallet/SyncTooltip/SyncTooltip.tsx';
import { usePaperWalletStore } from '@app/store';
import { FilterCTA, FilterWrapper, Wrapper, SyncButton, NavWrapper } from './styles.ts';
export type TxHistoryFilter = 'rewards' | 'transactions';
const FILTER_TYPES: TxHistoryFilter[] = ['rewards', 'transactions'] as const;

export default function ListActions() {
    const { t } = useTranslation(['wallet', 'sidebar']);
    const setShowPaperWalletModal = usePaperWalletStore((s) => s.setShowModal);

    const [filter, setFilter] = useState<TxHistoryFilter>('rewards');

    function handleFilterChange(newFilter: TxHistoryFilter) {
        setFilter(newFilter);
    }

    return (
        <Wrapper style={{ marginBottom: `-4px` }}>
            <NavWrapper>
                <FilterWrapper>
                    {FILTER_TYPES.map((type) => (
                        <FilterCTA key={type} $isActive={filter === type} onClick={() => handleFilterChange(type)}>
                            {type}
                        </FilterCTA>
                    ))}
                </FilterWrapper>
                <SyncTooltip
                    title={t('sidebar:paper-wallet-tooltip-title')}
                    text={t('sidebar:paper-wallet-tooltip-message')}
                    trigger={
                        <SyncButton onClick={() => setShowPaperWalletModal(true)}>
                            {t('history.sync-with-phone')} <ArrowRightSVG />
                        </SyncButton>
                    }
                />
            </NavWrapper>
        </Wrapper>
    );
}
