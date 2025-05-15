import WalletAddressMarkup from './WalletAddressMarkup';
import MoneroAddressMarkup from './MoneroAddressMarkup';
import SeedWordsMarkup from './SeedWordsMarkup/SeedWordsMarkup.tsx';
import MoneroSeedWordSettings from './MoneroSeedWords/MoneroSeedWordSettings.tsx';
import { useConfigWalletStore } from '@app/store/useAppConfigStore.ts';
import { useWalletStore } from '@app/store/useWalletStore.ts';
import { useUIStore } from '@app/store';
import { setSeedlessUI } from '@app/store/actions/uiStoreActions.ts';

export const WalletSettings = () => {
    const monero_address_is_generated = useConfigWalletStore((s) => s.monero_address_is_generated);
    const tari_address_is_generated = useWalletStore((s) => s.is_tari_address_generated);
    const seedlessUI = useUIStore((s) => s.seedlessUI); // temp

    const showSeeds = tari_address_is_generated || (!tari_address_is_generated && !seedlessUI); // temp
    return (
        <>
            <WalletAddressMarkup />
            {showSeeds ? (
                <SeedWordsMarkup />
            ) : (
                <button onClick={() => setSeedlessUI(false)}>{`Add seed words to recover Tari Address`}</button>
            )}
            <MoneroAddressMarkup />
            {monero_address_is_generated ? <MoneroSeedWordSettings /> : null}
        </>
    );
};
