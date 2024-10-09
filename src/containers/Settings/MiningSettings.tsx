import CpuMiningMarkup from './sections/mining/CpuMiningMarkup.tsx';
import GpuMiningMarkup from './sections/mining/GpuMiningMarkup.tsx';

export const MiningSettings = () => {
    return (
        <>
            <CpuMiningMarkup />
            <GpuMiningMarkup />
        </>
    );
};
