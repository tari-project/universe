import { TabContentWrapper } from '@app/components/transactions/WalletSidebarContent.styles.ts';
import WalletAddressMarkup from '@app/containers/floating/Settings/sections/wallet/WalletAddressMarkup.tsx';

export function Receive() {
    return (
        <TabContentWrapper>
            <WalletAddressMarkup />
        </TabContentWrapper>
    );
}
