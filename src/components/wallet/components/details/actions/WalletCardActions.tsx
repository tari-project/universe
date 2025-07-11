import { useConfigUIStore } from '@app/store';
import ActionCopyAddress from './ActionCopyAddress';
import ActionPhoneSync from './ActionPhoneSync';
import { Wrapper } from './styles.ts';
import { WalletUIMode } from '@app/types/events-payloads.ts';

export default function WalletCardActions() {
    const isStandardWalletUI = useConfigUIStore((s) => s.wallet_ui_mode === WalletUIMode.Standard);
    return (
        <Wrapper>
            {isStandardWalletUI && <ActionPhoneSync />}
            <ActionCopyAddress />
        </Wrapper>
    );
}
