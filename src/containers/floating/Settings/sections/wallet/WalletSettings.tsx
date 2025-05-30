import WalletAddressMarkup from './WalletAddressMarkup';
import MoneroAddressMarkup from './MoneroAddressMarkup';
import TariSeedWords from './TariSeedWords/TariSeedWords.tsx';
import MoneroSeedWordSettings from './MoneroSeedWords/MoneroSeedWordSettings.tsx';
import { useConfigWalletStore } from '@app/store/useAppConfigStore.ts';
import { RefreshWalletHistory } from './RefreshWalletHistory.tsx';

export const WalletSettings = () => {
    const monero_address_is_generated = useConfigWalletStore((s) => s.monero_address_is_generated);

    return (
        <>
            <WalletAddressMarkup />
            <TariSeedWords />
            <MoneroAddressMarkup />

            {monero_address_is_generated ? <MoneroSeedWordSettings /> : null}

            <RefreshWalletHistory />
        </>
    );
};
