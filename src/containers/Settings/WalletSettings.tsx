import WalletAddressMarkup from './sections/wallet/WalletAddressMarkup.tsx';
import MoneroAddressMarkup from './sections/wallet/MoneroAddressMarkup';
import SeedWordsMarkup from './sections/wallet/SeedWordsMarkup/SeedWordsMarkup.tsx';
import PaperWallet from '@app/containers/Settings/sections/wallet/PaperWallet.tsx';

export const WalletSettings = () => {
    return (
        <>
            <WalletAddressMarkup />
            <SeedWordsMarkup />
            <MoneroAddressMarkup />
            <PaperWallet />
        </>
    );
};
