import WalletAddressMarkup from './WalletAddressMarkup/WalletAddressMarkup.tsx';
import MoneroAddressMarkup from './MoneroAddressMarkup';
import TariSeedWords from './TariSeedWords/TariSeedWords.tsx';
import MoneroSeedWordSettings from './MoneroSeedWords/MoneroSeedWordSettings.tsx';
import { RefreshWalletHistory } from './RefreshWalletHistory.tsx';
import { useConfigUIStore, useConfigWalletStore } from '@app/store/useAppConfigStore.ts';
import { WalletUIMode } from '@app/types/events-payloads.ts';
import { WalletSecurityMarkup } from './WalletSecurityMarkup';
import { SyncWithPhone } from './SyncWithPhone.tsx';

export const WalletSettings = () => {
    const monero_address_is_generated = useConfigWalletStore((s) => s.monero_address_is_generated);
    const isWalletUIExchangeSpecific = useConfigUIStore((s) => s.wallet_ui_mode === WalletUIMode.ExchangeSpecificMiner);
    return (
        <>
            {!isWalletUIExchangeSpecific && <WalletSecurityMarkup />}
            <SyncWithPhone />
            <WalletAddressMarkup />
            {isWalletUIExchangeSpecific ? undefined : <TariSeedWords />}
            <MoneroAddressMarkup />
            {monero_address_is_generated ? <MoneroSeedWordSettings /> : undefined}
            <RefreshWalletHistory />
        </>
    );
};
