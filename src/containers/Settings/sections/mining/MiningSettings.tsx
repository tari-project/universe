import CpuMiningMarkup from './CpuMiningMarkup.tsx';
import GpuMiningMarkup from './GpuMiningMarkup.tsx';
import MineOnStartMarkup from './MineOnStartMarkup.tsx';

export const MiningSettings = () => {
    return (
        <>
            <CpuMiningMarkup />
            <GpuMiningMarkup />
            <MineOnStartMarkup />
        </>
    );
};
