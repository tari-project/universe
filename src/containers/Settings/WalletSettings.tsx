import WalletAddressMarkup from './sections/wallet/WalletAddressMarkup.tsx';
import MoneroAddressMarkup from './sections/wallet/MoneroAddressMarkup';

export const WalletSettings = () => {
    return (
        <>
            <WalletAddressMarkup />
            <MoneroAddressMarkup />
        </>
    );
};
