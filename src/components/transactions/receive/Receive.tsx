import WalletAddressMarkup from '@app/containers/floating/Settings/sections/wallet/WalletAddressMarkup.tsx';
import { TabContentWrapper } from '../WalletSidebarContent.styles.ts';

export function Receive() {
    return (
        <TabContentWrapper>
            <WalletAddressMarkup />
        </TabContentWrapper>
    );
}
