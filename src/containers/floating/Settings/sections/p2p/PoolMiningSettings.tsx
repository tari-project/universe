import { useState } from 'react';
import P2pMarkup from './P2pMarkup.tsx';
import P2PoolStats from './P2PoolStats.tsx';
import { useConfigCoreStore } from '@app/store/useAppConfigStore.ts';

export const PoolMiningSettings = () => {
    const [disabledStats, setDisabledStats] = useState(false);
    const isP2poolEnabled = useConfigCoreStore((s) => s.is_p2pool_enabled);
    return (
        <>
            <P2pMarkup setDisabledStats={setDisabledStats} />
            {isP2poolEnabled && !disabledStats && <P2PoolStats />}
        </>
    );
};
