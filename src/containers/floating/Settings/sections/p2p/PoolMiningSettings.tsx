import P2pMarkup from './P2pMarkup.tsx';
import P2PoolStats from './P2poolStatsMarkup.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

export const PoolMiningSettings = () => {
    const isP2poolEnabled = useAppConfigStore((s) => s.p2pool_enabled);

    return (
        <>
            <P2pMarkup />
            {isP2poolEnabled && <P2PoolStats />}
        </>
    );
};
