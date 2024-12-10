import { useState } from 'react';
import P2pMarkup from './P2pMarkup.tsx';
import P2PoolStats from './P2PoolStats.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore';

export const PoolMiningSettings = () => {
    const [disabledStats, setDisabledStats] = useState(false);
    const isP2poolEnabled = useAppConfigStore((s) => s.p2pool_enabled);
    return (
        <>
            <P2pMarkup setDisabledStats={setDisabledStats} />
            {isP2poolEnabled && !disabledStats && <P2PoolStats />}
        </>
    );
};
