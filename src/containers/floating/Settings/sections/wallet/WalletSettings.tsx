import WalletAddressMarkup from './WalletAddressMarkup';
import MoneroAddressMarkup from './MoneroAddressMarkup';
import TariSeedWords from './TariSeedWords/TariSeedWords.tsx';
import MoneroSeedWordSettings from './MoneroSeedWords/MoneroSeedWordSettings.tsx';
<<<<<<< HEAD
import { useConfigWalletStore } from '@app/store/useAppConfigStore.ts';
import { RefreshWalletHistory } from './RefreshWalletHistory.tsx';
=======
import { DEFAULT_EXCHANGE_ID, useConfigBEInMemoryStore, useConfigWalletStore } from '@app/store/useAppConfigStore.ts';
>>>>>>> main

export const WalletSettings = () => {
    const monero_address_is_generated = useConfigWalletStore((s) => s.monero_address_is_generated);
    const exchangeID = useConfigBEInMemoryStore((s) => s.exchangeId);
    const isExchangeMiner = exchangeID === DEFAULT_EXCHANGE_ID;
    return (
        <>
            <WalletAddressMarkup />
            {isExchangeMiner ? <TariSeedWords /> : undefined}
            <MoneroAddressMarkup />

            {monero_address_is_generated ? <MoneroSeedWordSettings /> : undefined}

            <RefreshWalletHistory />
        </>
    );
};
