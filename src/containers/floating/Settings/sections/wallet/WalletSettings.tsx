import { useAppConfigStore } from '@app/store/useAppConfigStore.ts';
import WalletAddressMarkup from './WalletAddressMarkup.tsx';
import MoneroAddressMarkup from './MoneroAddressMarkup';
import SeedWordsMarkup from './SeedWordsMarkup/SeedWordsMarkup.tsx';
import MoneroSeedWordSettings from './MoneroSeedWords/MoneroSeedWordSettings.tsx';
import { KeychainWarning } from '@app/containers/floating/Settings/sections/wallet/components/KeychainWarning.tsx';

export const WalletSettings = () => {
    const monero_address_is_generated = useAppConfigStore((s) => s.monero_address_is_generated);
    const seedword_not_in_keychain = useAppConfigStore((s) => s.keyring_fallback || !s.keyring_accessed);
    return (
        <>
            {seedword_not_in_keychain && <KeychainWarning />}
            <WalletAddressMarkup />
            <SeedWordsMarkup />
            <MoneroAddressMarkup />
            {monero_address_is_generated ? <MoneroSeedWordSettings /> : null}
        </>
    );
};
