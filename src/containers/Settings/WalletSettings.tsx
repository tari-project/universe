import WalletAddressMarkup from './sections/wallet/WalletAddressMarkup.tsx';
import MoneroAddressMarkup from './sections/wallet/MoneroAddressMarkup';
import SeedWordsMarkup from './sections/wallet/SeedWordsMarkup/SeedWordsMarkup.tsx';
import PaperWallet from '@app/containers/Settings/sections/wallet/PaperWallet.tsx';
import MoneroSeedWordSettings from '@app/containers/Settings/sections/wallet/MoneroSeedWords/MoneroSeedWordSettings.tsx';

export const WalletSettings = () => {
    const monero_address_is_provided = false; //emp
    return (
        <>
            <WalletAddressMarkup />
            <SeedWordsMarkup />
            <MoneroAddressMarkup />
            <MoneroSeedWordSettings />
            <PaperWallet />
        </>
    );
};
