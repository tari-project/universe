import WalletAddressMarkup from './sections/wallet/WalletAddressMarkup.tsx';
import MoneroAddressMarkup from './sections/wallet/MoneroAddressMarkup';
import SeedWordsMarkup from './sections/wallet/SeedWordsMarkup/SeedWordsMarkup.tsx';
import PaperWallet from '@app/containers/Settings/sections/wallet/PaperWallet.tsx';
import MoneroSeedWordSettings from '@app/containers/Settings/sections/wallet/MoneroSeedWords/MoneroSeedWordSettings.tsx';
import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';

export const WalletSettings = () => {
    const monero_address_is_provided = useAppConfigStore((s) => s.monero_address_is_provided);
    return (
        <>
            <WalletAddressMarkup />
            <SeedWordsMarkup />
            <MoneroAddressMarkup />
            {!monero_address_is_provided ? <MoneroSeedWordSettings /> : null}
            <PaperWallet />
        </>
    );
};
