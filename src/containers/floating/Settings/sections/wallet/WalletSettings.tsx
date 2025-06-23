import WalletAddressMarkup from './WalletAddressMarkup';
import MoneroAddressMarkup from './MoneroAddressMarkup';
import TariSeedWords from './TariSeedWords/TariSeedWords.tsx';
import MoneroSeedWordSettings from './MoneroSeedWords/MoneroSeedWordSettings.tsx';
import { RefreshWalletHistory } from './RefreshWalletHistory.tsx';
import { useConfigWalletStore } from '@app/store/useAppConfigStore.ts';
import { useUIStore } from '@app/store/useUIStore.ts';
import { WalletUIMode } from '@app/types/events-payloads.ts';

export const WalletSettings = () => {
    const monero_address_is_generated = useConfigWalletStore((s) => s.monero_address_is_generated);
    const isWalletUIExchangeSpecific = useUIStore((s) => s.walletUIMode === WalletUIMode.ExchangeSpecificMiner);
    return (
        <>
            <WalletAddressMarkup />
            {isWalletUIExchangeSpecific ? undefined : <TariSeedWords />}
            <MoneroAddressMarkup />

            {monero_address_is_generated ? <MoneroSeedWordSettings /> : undefined}

            <RefreshWalletHistory />
        </>
    );
};
