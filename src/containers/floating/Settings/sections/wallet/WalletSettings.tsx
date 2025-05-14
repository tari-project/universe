import WalletAddressMarkup from './WalletAddressMarkup';
import MoneroAddressMarkup from './MoneroAddressMarkup';
import SeedWordsMarkup from './SeedWordsMarkup/SeedWordsMarkup.tsx';
import MoneroSeedWordSettings from './MoneroSeedWords/MoneroSeedWordSettings.tsx';
import { useConfigWalletStore } from '@app/store/useAppConfigStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';

export const WalletSettings = () => {
    const monero_address_is_generated = useConfigWalletStore((s) => s.monero_address_is_generated);
    const tari_address_is_generated = useWalletStore((s) => s.is_tari_address_generated);
    console.info('WalletSettings', { monero_address_is_generated, tari_address_is_generated });
    return (
        <>
            <WalletAddressMarkup />
            {tari_address_is_generated ? <SeedWordsMarkup /> : undefined}
            <MoneroAddressMarkup />
            {monero_address_is_generated ? <MoneroSeedWordSettings /> : undefined}
        </>
    );
};
