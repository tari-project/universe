import WalletAddressMarkup from './WalletAddressMarkup.tsx';
import MoneroAddressMarkup from './MoneroAddressMarkup';
import SeedWordsMarkup from './SeedWordsMarkup/SeedWordsMarkup.tsx';
import MoneroSeedWordSettings from './MoneroSeedWords/MoneroSeedWordSettings.tsx';
import { useConfigWalletStore } from '@app/store/useAppConfigStore.ts';

export const WalletSettings = () => {
    const monero_address_is_generated = useConfigWalletStore((s) => s.monero_address_is_generated);
    return (
        <>
            <WalletAddressMarkup />
            <SeedWordsMarkup />
            <MoneroAddressMarkup />
            {monero_address_is_generated ? <MoneroSeedWordSettings /> : null}
        </>
    );
};
