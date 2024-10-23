import CpuMiningMarkup from './CpuMiningMarkup.tsx';
import GpuMiningMarkup from './GpuMiningMarkup.tsx';
import MineOnStartMarkup from './MineOnStartMarkup.tsx';
import P2pMarkup from '@app/containers/Settings/sections/experimental/P2pMarkup.tsx';

export const MiningSettings = () => {
    return (
        <>
            <CpuMiningMarkup />
            <GpuMiningMarkup />
            <MineOnStartMarkup />
            <P2pMarkup />
        </>
    );
};
