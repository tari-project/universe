import WalletAddressMarkup from '@app/containers/floating/Settings/sections/wallet/WalletAddressMarkup.tsx';
import { TabContentWrapper } from '../WalletSidebarContent.styles.ts';
import { Address } from '@app/components/wallet/Address.tsx';

export function Receive() {
    return (
        <TabContentWrapper>
            <Address />
            <WalletAddressMarkup />
        </TabContentWrapper>
    );
}
