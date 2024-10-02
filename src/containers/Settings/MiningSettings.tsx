import CpuMiningMarkup from './sections/mining/CpuMiningMarkup.tsx';
import GpuMiningMarkup from './sections/mining/GpuMiningMarkup.tsx';
import SeedWordsMarkup from './sections/wallet/SeedWordsMarkup/index.ts';

export const MiningSettings = () => {
    return (
        <>
            <CpuMiningMarkup />
            <GpuMiningMarkup />
        </>
    );
};
