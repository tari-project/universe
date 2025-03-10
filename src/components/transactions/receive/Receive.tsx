import { Address } from '@app/components/wallet/Address.tsx';
import { TabContentWrapper } from '../WalletSidebarContent.styles.ts';

export function Receive() {
    return (
        <TabContentWrapper>
            <Address />
        </TabContentWrapper>
    );
}
