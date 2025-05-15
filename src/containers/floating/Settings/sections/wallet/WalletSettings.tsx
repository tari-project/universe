import WalletAddressMarkup from './WalletAddressMarkup';
import MoneroAddressMarkup from './MoneroAddressMarkup';
import SeedWordsMarkup from './SeedWordsMarkup/SeedWordsMarkup.tsx';
import TariSeedWords from './TariSeedWords/TariSeedWords.tsx';
import MoneroSeedWordSettings from './MoneroSeedWords/MoneroSeedWordSettings.tsx';
import { useConfigWalletStore } from '@app/store/useAppConfigStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';

export const WalletSettings = () => {
    const monero_address_is_generated = useConfigWalletStore((s) => s.monero_address_is_generated);
    const tari_address_is_generated = useWalletStore((s) => s.is_tari_address_generated);

    return (
        <>
            <WalletAddressMarkup />
            <TariSeedWords />
            <SeedWordsMarkup />
            <MoneroAddressMarkup />

            {monero_address_is_generated ? <MoneroSeedWordSettings /> : null}
        </>
    );
};
