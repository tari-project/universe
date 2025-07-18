import ActionCopyAddress from './ActionCopyAddress';
import { Wrapper } from './styles.ts';

export default function WalletCardActions() {
    return (
        <Wrapper>
            <ActionCopyAddress />
        </Wrapper>
    );
}
