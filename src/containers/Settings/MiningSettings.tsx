import CpuMiningMarkup from './sections/mining/CpuMiningMarkup.tsx';
import GpuMiningMarkup from './sections/mining/GpuMiningMarkup.tsx';
import SeedWordsMarkup from './sections/mining/SeedWordsMarkup';
import MoneroAddressMarkup from './sections/mining/MoneroAddressMarkup';

export const MiningSettings = () => {
    return (
        <>
            <CpuMiningMarkup />
            <GpuMiningMarkup />
            <SeedWordsMarkup />
            <MoneroAddressMarkup />
        </>
    );
};
