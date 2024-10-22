import CpuMiningMarkup from './sections/mining/CpuMiningMarkup.tsx';
import GpuMiningMarkup from './sections/mining/GpuMiningMarkup.tsx';
import MineOnStartMarkup from './sections/mining/MineOnStartMarkup.tsx';
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
