import WalletAddressMarkup from './WalletAddressMarkup.tsx';
import MoneroAddressMarkup from './MoneroAddressMarkup';
import SeedWordsMarkup from './SeedWordsMarkup/SeedWordsMarkup.tsx';

export const WalletSettings = () => {
    return (
        <>
            <WalletAddressMarkup />
            <SeedWordsMarkup />
            <MoneroAddressMarkup />
        </>
    );
};
