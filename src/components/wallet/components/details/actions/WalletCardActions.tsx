import { useUIStore } from '@app/store';
import ActionCopyAddress from './ActionCopyAddress';
import ActionPhoneSync from './ActionPhoneSync';
import { Wrapper } from './styles.ts';

export default function WalletCardActions() {
    const seedlessUI = useUIStore((s) => s.seedlessUI);
    return (
        <Wrapper>
            {!seedlessUI && <ActionPhoneSync />}
            <ActionCopyAddress />
        </Wrapper>
    );
}
