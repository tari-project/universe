import CpuMiningMarkup from './CpuMiningMarkup.tsx';
import GpuMiningMarkup from './GpuMiningMarkup.tsx';
import MineOnStartMarkup from './MineOnStartMarkup.tsx';
import GpuDevices from './GpuDevices.tsx';
import GpuEngine from './GpuEngine.tsx';

export const MiningSettings = () => {
    return (
        <>
            <CpuMiningMarkup />
            <GpuMiningMarkup />
            <GpuEngine />
            <GpuDevices />
            <MineOnStartMarkup />
        </>
    );
};
