import CpuMiningMarkup from '@app/containers/SideBar/components/Settings/Markups/CpuMiningMarkup.tsx';
import GpuMiningMarkup from '@app/containers/SideBar/components/Settings/Markups/GpuMiningMarkup.tsx';

export const MiningSettings = () => {
    return (
        <>
            <CpuMiningMarkup />
            <GpuMiningMarkup />
        </>
    );
};
