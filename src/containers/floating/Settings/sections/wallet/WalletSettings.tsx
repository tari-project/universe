import WalletAddressMarkup from './WalletAddressMarkup';
import MoneroAddressMarkup from './MoneroAddressMarkup';
import TariSeedWords from './TariSeedWords/TariSeedWords.tsx';
import MoneroSeedWordSettings from './MoneroSeedWords/MoneroSeedWordSettings.tsx';
import { useConfigWalletStore } from '@app/store/useAppConfigStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';

export const WalletSettings = () => {
    const monero_address_is_generated = useConfigWalletStore((s) => s.monero_address_is_generated);
    const _tari_address_is_generated = useWalletStore((s) => s.is_tari_address_generated);

    return (
        <>
            <WalletAddressMarkup />
            <TariSeedWords />
            <MoneroAddressMarkup />

            {monero_address_is_generated ? <MoneroSeedWordSettings /> : null}
        </>
    );
};
