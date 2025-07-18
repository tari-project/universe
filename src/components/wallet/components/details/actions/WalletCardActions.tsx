import { useConfigUIStore, useWalletStore } from '@app/store';
import ActionCopyAddress from './ActionCopyAddress';
import ActionPhoneSync from './ActionPhoneSync';
import { Wrapper } from './styles.ts';
import { WalletUIMode } from '@app/types/events-payloads.ts';

export default function WalletCardActions() {
    const isStandardWalletUI = useConfigUIStore((s) => s.wallet_ui_mode === WalletUIMode.Standard);
    const isWalletScanning = useWalletStore((s) => s.wallet_scanning?.is_scanning);

    return (
        <Wrapper>
            {isStandardWalletUI && !isWalletScanning && <ActionPhoneSync />}
            <ActionCopyAddress />
        </Wrapper>
    );
}
