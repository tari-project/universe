import P2pMarkup from './P2pMarkup.tsx';
import P2PoolStats from './P2PoolStats.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore';
import { useUIStore } from '@app/store/useUIStore.ts';

export const PoolMiningSettings = () => {
    const isP2poolEnabled = useAppConfigStore((s) => s.p2pool_enabled);
    const disabledStats = useUIStore((s) => s.disabledP2poolStats);
    const setDisabledStats = useUIStore((s) => s.setDisabledP2poolStats);

    return (
        <>
            <P2pMarkup setDisabledStats={setDisabledStats} />
            {isP2poolEnabled && !disabledStats && <P2PoolStats />}
        </>
    );
};
