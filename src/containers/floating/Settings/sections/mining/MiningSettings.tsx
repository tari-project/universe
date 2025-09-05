import CpuMiningMarkup from './CpuMiningMarkup.tsx';
import GpuMiningMarkup from './GpuMiningMarkup.tsx';
import MineOnStartMarkup from './MineOnStartMarkup.tsx';
import GpuDevices from './GpuDevices.tsx';
import GpuEngine from './GpuEngine.tsx';
import GpuMiners from './GpuMiners.tsx';

export const MiningSettings = () => {
    return (
        <>
            <CpuMiningMarkup />
            <GpuMiningMarkup />
            <GpuMiners />
            <GpuEngine />
            <GpuDevices />
            <MineOnStartMarkup />
        </>
    );
};
