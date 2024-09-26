import CpuMiningMarkup from './sections/mining/CpuMiningMarkup.tsx';
import GpuMiningMarkup from './sections/mining/GpuMiningMarkup.tsx';
import SeedWordsMarkup from './sections/mining/SeedWordsMarkup';
import MoneroAddressMarkup from './sections/mining/MoneroAddressMarkup';
import WalletAddressMarkup from './sections/mining/WalletAddressMarkup.tsx';
import RandomXCpuMiner from './sections/experimental/RandomXCpuMiner.tsx';

export const MiningSettings = () => {
    return (
        <>
            <WalletAddressMarkup />
            <RandomXCpuMiner />
            <CpuMiningMarkup />
            <GpuMiningMarkup />
            <SeedWordsMarkup />
            <MoneroAddressMarkup />
        </>
    );
};
