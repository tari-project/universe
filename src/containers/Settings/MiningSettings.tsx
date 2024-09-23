import CpuMiningMarkup from './sections/mining/CpuMiningMarkup.tsx';
import GpuMiningMarkup from './sections/mining/GpuMiningMarkup.tsx';
import SeedWordsMarkup from './sections/mining/SeedWordsMarkup';
import MoneroAddressMarkup from './sections/mining/MoneroAddressMarkup';
import WalletAddressMarkup from './sections/mining/WalletAddressMarkup.tsx';

export const MiningSettings = () => {
    return (
        <>
            <WalletAddressMarkup />
            <CpuMiningMarkup />
            <GpuMiningMarkup />
            <SeedWordsMarkup />
            <MoneroAddressMarkup />
        </>
    );
};
