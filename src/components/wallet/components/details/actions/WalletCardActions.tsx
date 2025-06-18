import { Wrapper } from './styles.ts';
import ActionCopyAddress from './ActionCopyAddress';
import ActionPhoneSync from './ActionPhoneSync';

export default function WalletCardActions() {
    return (
        <Wrapper>
            <ActionPhoneSync />
            <ActionCopyAddress />
        </Wrapper>
    );
}
