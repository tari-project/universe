import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import WalletAddressMarkup from './WalletAddressMarkup.tsx';
import MoneroAddressMarkup from './MoneroAddressMarkup';
import SeedWordsMarkup from './SeedWordsMarkup/SeedWordsMarkup.tsx';
import MoneroSeedWordSettings from './MoneroSeedWords/MoneroSeedWordSettings.tsx';

export const WalletSettings = () => {
    const monero_address_is_provided = useAppConfigStore((s) => s.monero_address_is_provided);

    return (
        <>
            <WalletAddressMarkup />
            <SeedWordsMarkup />
            <MoneroAddressMarkup />
            {monero_address_is_provided ? <MoneroSeedWordSettings /> : null}
        </>
    );
};
