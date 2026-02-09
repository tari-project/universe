import CpuMiningMarkup from './CpuMiningMarkup.tsx';
import GpuMiningMarkup from './GpuMiningMarkup.tsx';
import MineOnStartMarkup from './MineOnStartMarkup.tsx';
import GpuDevices from './GpuDevices.tsx';
import PauseOnBatteryModeMarkup from './PauseOnBatteryMode.tsx';

export const MiningSettings = () => {
    return (
        <>
            <CpuMiningMarkup />
            <GpuMiningMarkup />
            <GpuDevices />
            <MineOnStartMarkup />
            <PauseOnBatteryModeMarkup />
        </>
    );
};
