import { useUIStore } from '@app/store';
import ActionCopyAddress from './ActionCopyAddress';
import ActionPhoneSync from './ActionPhoneSync';
import { Wrapper } from './styles.ts';
import { WalletUIMode } from '@app/types/events-payloads.ts';

export default function WalletCardActions() {
    const isStandardWalletUI = useUIStore((s) => s.walletUIMode === WalletUIMode.Standard);
    return (
        <Wrapper>
            {isStandardWalletUI && <ActionPhoneSync />}
            <ActionCopyAddress />
        </Wrapper>
    );
}
